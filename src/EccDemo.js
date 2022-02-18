// Imports from paulmillr.github.io demo:
import * as React from 'react';

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, Hash, utf8ToBytes } from '@noble/hashes/utils';
import { Spoiler } from './react-spoiler';

// For the HashWorker:
import * as Comlink from 'comlink';


function pad(n, length = 64, base = 16) {
    //return n.toString(base).padStart(length, '0');
    return n.toString();
}

const HashWorker = Comlink.wrap(new Worker(new URL("./util/HashWorker.js", import.meta.url)));

class Signer extends React.Component {
    constructor() {
        super();
        this.state = {
            pubKeyHex: '',
            msgHex: '',
            sigHex: '',
            hasher: null,
        };
    }
    componentDidMount() {
        this.getPublicKey().then((obj) => this.setState(obj));
        (new HashWorker(0)).then(h => {
            this.setState({ hasher: h });

            // NOTE: We need the hashworker before we can start the signing process!
            this.sign().then((sig) => this.setState(sig));
        });
    }
    componentDidUpdate(prevProps) {
        if (this.props.privKey !== prevProps.privKey) {
            this.getPublicKey().then((obj) => this.setState(obj));
        }
        if (this.props.privKey !== prevProps.privKey || this.props.message !== prevProps.message) {
            this.sign().then((sig) => this.setState(sig));
        }
    }
    async getPublicKey() { }
    async sign(msg) { }
    render() {
        return this.renderPoint();
    }
}

class EdSigner extends Signer {
    async getPublicKey() {
        const pub = ed.Point.fromHex(await ed.getPublicKey(this.props.privKey));
        return { pubKeyHex: pub.toHex() };
    }
    async sign() {
        const msg = utf8ToBytes(this.props.message);
        const sig = ed.Signature.fromHex(await ed.sign(msg, this.props.privKey));
        // Do some busy work here to compute the sig
        await this.state.hasher.increment(100000000);
        console.log("Count = " + await this.state.hasher.counter);
        return { msgHex: bytesToHex(msg), sigHex: sig.toHex() };
    }
    // prettier-ignore
    renderPoint() {
        return (
            <div className="curve-data">
                <h3>Public key</h3>
                <dl>
                    <dt>hex</dt>
                    <dd>{this.state.pubKeyHex}</dd>
                </dl>

                <h3>Signature</h3>
                <dl>
                    <dt>msg</dt>
                    <dd>{this.state.msgHex}</dd>
                    <dt>sigHex</dt>
                    <dd>{this.state.sigHex}</dd>
                </dl>
            </div>
        );
    }
}


class EccApp extends React.Component {
    constructor() {
        super();

        let privKey = localStorage.getItem("private_key");
        if (privKey === null) {
            // We don't already have a private key for this browser, so make one:
            const array = window.crypto.getRandomValues(new Uint8Array(32));
            privKey = bytesToHex(array);
            localStorage.setItem("private_key", privKey);
        }

        this.state = {
            privKey: privKey,
            message: 'hello world',
            curve: EdSigner,
        };
    }

    onMsgChange(event) {
        const message = event.target.value;
        if (message.length > 0) this.setState({ message });
    }

    render() {
        return (
            <div>
                <div>
                    <label htmlFor="private-key">
                        <strong>Private key</strong>
                    </label>
                    <Spoiler>{this.state.privKey}</Spoiler>
                </div>
                <div>
                    <label htmlFor="message-to-sign">
                        <strong>Message to sign</strong>
                    </label>
                </div>
                <div>
                    <input
                        id="message-to-sign"
                        type="text"
                        size="66"
                        maxLength="512"
                        value={this.state.message}
                        onChange={this.onMsgChange.bind(this)}
                        onKeyUp={this.onMsgChange.bind(this)}
                    />
                </div>
                <div className="selected-curve">
                    {<this.state.curve privKey={this.state.privKey} message={this.state.message} />}
                </div>
            </div>
        );
    }
}

export default EccApp;
