// This is a background thread that will search for a hash that matches
// the proof-of-work limit
import * as Comlink from 'comlink';

import {
    RealBadBlock
} from './RealBadCoin.tsx';

function async_sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const MineWorker = {
    async tryToSeal(block, num_attempts) {
        const b = RealBadBlock.coerce(block);
        // The Chrome-based systems will starve the garbage collector and run out of memory if we don't take a pause...
        // So far it's only Chrome and Brave, and not Edge???
        await async_sleep(10);
        const success = b.tryToSeal(num_attempts);
        return success ? b : null;
    }
}

Comlink.expose(MineWorker);
