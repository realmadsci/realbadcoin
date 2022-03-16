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
    #cache = new RealBadCache();

    // Validate and possibly add a block to the cache
    async addBlock(block, source) {
        let b = RealBadBlock.coerce(block);
        return await this.#cache.addBlock(b, source);
    }

    // Validate and possibly add a list of blocks to the cache
    async addBlocks(blockList, source) {
        let anyGood = false;
        for (let b of blockList) {
            // WARNING: The order of the operands matters here, due to lazy execution!
            anyGood = await this.addBlock(b, source) || anyGood;
        }
        return anyGood;
    }

    restoreCheckpoint(block, state) {
        this.#cache.restoreCheckpoint(
            RealBadBlock.coerce(block),
            RealBadLedgerState.coerce(state),
        );
    }

    // Return all the info about one block from the cache
    getBlockInfo(hash) {
        return {
            block: this.#cache.getBlock(hash),
            state: this.#cache.getState(hash),
            source: this.#cache.getSource(hash),
        };
    }

    // Get a list of blocks (just the blocks, not full info!) matching the list of hashes.
    getBlocks(hashList) {
        return hashList.map((h, i)=>this.#cache.getBlock(h));
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

    makeMineableBlock(reward, destination) {
        return this.#cache.makeMineableBlock(reward, destination);
    }
}

Comlink.expose(CacheWorker);
