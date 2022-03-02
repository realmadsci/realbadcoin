// This is a background thread that will search for a hash that matches
// the proof-of-work limit
import * as Comlink from 'comlink';

import {
    RealBadBlock
} from './RealBadCoin.tsx';


class MineWorker {
    constructor(block) {
        this._block = RealBadBlock.coerce(block);
    }

    get nonce() {
        return this._block.nonce;
    }

    tryToSeal(num_attempts) {
        if (this._block.tryToSeal(num_attempts)) {
            return this._block;
        }
        else return null;
    }
}

Comlink.expose(MineWorker);
