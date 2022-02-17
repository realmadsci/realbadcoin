// This is a background thread that will search for a hash that matches
// the proof-of-work limit
import * as Comlink from 'comlink';

class HashWorker {
    constructor(init = 0) {
        console.log(init);
        this._counter = init;
    }

    get counter() {
        return this._counter;
    }

    increment(delta = 1) {
        for (let i = 0; i < delta; i++) {
            this._counter += 1;
        }
    }
}

Comlink.expose(HashWorker);
