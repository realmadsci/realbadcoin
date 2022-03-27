// This is a background thread that will manage the validation and storage of
// blocks, to offload the work from the UI thread
import * as Comlink from 'comlink';

import {
    RealBadBlock,
    RealBadTransaction,
} from './RealBadCoin.tsx';

import {
    RealBadCache,
    RealBadLedgerState,
    RealBadInvalidBlock,
} from './RealBadState.tsx';

class CacheWorker {
    #cache;

    constructor(myAccount) {
        this.#cache = new RealBadCache(myAccount);
    }

    // Validate and possibly add a block to the cache
    async addBlock(block) {
        let b = RealBadBlock.coerce(block);
        return await this.#cache.addBlock(b);
    }

    // Validate and possibly add a list of blocks to the cache
    async addBlocks(blockList) {
        let anyGood = false;
        for (let b of blockList) {
            // WARNING: The order of the operands matters here, due to lazy execution!
            anyGood = await this.addBlock(b) || anyGood;
        }
        return anyGood;
    }

    restoreCheckpoint(block, state) {
        this.#cache.restoreCheckpoint(
            RealBadBlock.coerce(block),
            RealBadLedgerState.coerce(state),
        );
    }

    // Identify if we are working from a checkpoint or if we have a full chain
    get isCheckpoint() {
        return this.#cache.isCheckpoint;
    }

    // Return all the info about one block from the cache
    getBlockInfo(hash) {
        return {
            block: this.#cache.getBlock(hash),
            state: this.#cache.getState(hash),
        };
    }

    // Get a list of blocks (just the blocks, not full info!) matching the list of hashes.
    getBlocks(hashList) {
        return hashList.map((h, i)=>this.#cache.getBlock(h));
    }

    getCommonParent(hash1, hash2, maxLength=Infinity) {
        return this.#cache.getCommonParent(hash1, hash2, maxLength);
    }

    // Get the list of hashes comprising the chain, starting at `hash` and going
    // backward until `rootHash` is found (or a genesis block, or a block with no parent).
    // If topHash is null or undefined, then we start at the "best" hash.
    getChain(hash, rootHash=null, maxLength=Infinity) {
        return this.#cache.getChain(hash, rootHash, maxLength);
    }

    // Get the number of "confirmations" for a particular block (i.e. how many blocks, including itself,
    // are on the main chain after it).
    getConfirmations(hash) {
        return this.#cache.getConfirmations(hash);
    }

    // Return the hash of the top of the "best chain" that we know about
    get bestBlockHash() {
        return this.#cache.bestBlockHash;
    }

    // Validate and possibly add a transaction into the memory pool.
    // If the transaction is VALID and NEW, then return true.
    async addTransaction(transaction) {
        let tx = RealBadTransaction.coerce(transaction);
        return await this.#cache.addTransaction(tx);
    }

    getBlocksWithTransaction(txId) {
        return this.#cache.getBlocksWithTransaction(txId);
    }

    getTxPool() {
        return this.#cache.getTxPool();
    }

    setMinTxFee(fee) {
        this.#cache.setMinTxFee(fee);
    }

    makeMineableBlock(reward, destination) {
        return this.#cache.makeMineableBlock(reward, destination);
    }

    // Reject a transaction so you can attempt to undo it.
    // This will pick the block _above_ this transaction as the new root, and re-compute
    // all the state above that point, rejecting this transaction _every time_ it appears.
    cancelTransaction(txIdToReject = null) {
        // Keep track so we never accept this transaction again!
        this.#cache.txIdToReject = txIdToReject;

        // Find all blocks with this transaction
        const blockHashes = this.#cache.getBlocksWithTransaction(txIdToReject);

        // Mark them and all their children as being error blocks
        for (const hash of blockHashes) {
            const error = new RealBadInvalidBlock("Block contains banned transaction!", hash);
            const state = this.#cache.getState(hash);
            let childHashes = [];
            if (state) {
                state.errors.push(error);
                childHashes.push(state.children);
            }

            while (childHashes.length) {
                const ch = childHashes.shift();
                const state = this.#cache.getState(ch);
                if (state) {
                    state.errors.push(error);
                    childHashes.push(state.children);
                }
            }
        }

        // Now find which remaining block in the cache has the highest difficulty ranking.
        // It's _probably_ one of the parents of the recently-burned blocks, but
        // we're going to just brute force it anyway.
        this.#cache._bestBlock = null;
        for (const h of Object.keys(this.#cache._blocks)) {
            let thisState = this.#cache.getState(h);
            if (thisState?.errors?.length === 0) {
                let bestState = this.#cache.getState(this.#cache._bestBlock);
                if ((bestState === null) ||
                    (thisState.totalDifficulty > bestState.totalDifficulty)
                ) {
                    this.#cache._bestBlock = h;
                }
            }
        }
    }
}

Comlink.expose(CacheWorker);
