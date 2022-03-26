// This is a background thread that will manage the validation and storage of
// blocks, to offload the work from the UI thread
import * as Comlink from 'comlink';

import {
    RealBadBlock,
    RealBadTransaction,
} from './RealBadCoin.tsx';

import {
    RealBadCache,
    RealBadLedgerState
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

    makeMineableBlock(reward, destination) {
        return this.#cache.makeMineableBlock(reward, destination);
    }

    // Reject a transaction so you can attempt to undo it.
    // This will replace the cache with a new copy and re-compute all the state,
    // rejecting this transaction _every time_ it appears.
    async cancelTransaction(txIdToReject = null) {
        // Take a ref to the old cache so we can copy everything out of it
        const oldCache = this.#cache;

        // Make a new cache copy and tell it to reject the transaction in question
        this.#cache = new RealBadCache(oldCache.myAccount);
        this.#cache.txIdToReject = txIdToReject;

        // Transfer the old blockchain into the new cache
        const oldBlocks = oldCache.getChain().map(h=>this.#cache.getBlock(h));
        for(const b of oldBlocks) {
            await this.#cache.addBlock(b);
        }
    }
}

Comlink.expose(CacheWorker);
