// This is a background thread that will manage the validation and storage of
// blocks, to offload the work from the UI thread
import * as Comlink from 'comlink';

import {
    RealBadBlock
} from './RealBadCoin.tsx';

import {
    RealBadCache
} from './RealBadState.tsx';

class CacheWorker {
    #cache = new RealBadCache();

    // Validate and possibly add a block to the cache
    addBlock(block, source) {
        let b = RealBadBlock.coerce(block);
        return this.#cache.addBlock(b, source);
    }

    // Validate and possibly add a list of blocks to the cache
    addBlocks(blockList, source) {
        return blockList.map((b, i)=>this.addBlock(b, source));
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
    getChain(hash, rootHash) {
        return this.#cache.getChain(hash, rootHash);
    }

    // Return the hash of the top of the "best chain" that we know about
    get bestBlockHash() {
        return this.#cache.bestBlockHash;
    }
}

Comlink.expose(CacheWorker);
