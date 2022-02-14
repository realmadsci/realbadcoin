import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Imports from paulmillr.github.io demo:
//import React from 'react';
//import ReactDOM from 'react-dom';
import * as secp from '@noble/secp256k1';
import * as ed from '@noble/ed25519';
import * as bls from '@noble/bls12-381';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

// Peer-to-peer comms using peerjs
import Peer from 'peerjs';


//ReactDOM.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>,
//  document.getElementById('root')
//);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();









function pad(n, length = 64, base = 16) {
  //return n.toString(base).padStart(length, '0');
  return n.toString();
}

class Signer extends React.Component {
  constructor() {
    super();
    this.state = {
      hex: '',
      x: '',
      y: '',
      z: '',
      signature: '',
    };
  }
  componentDidMount() {
    this.getPublicKey().then((obj) => this.setState(obj));
    this.sign().then((sig) => this.setState(sig));
  }
  componentDidUpdate(prevProps) {
    if (this.props.privKey !== prevProps.privKey) {
      this.getPublicKey().then((obj) => this.setState(obj));
    }
    if (this.props.privKey !== prevProps.privKey || this.props.message !== prevProps.message) {
      this.sign().then((sig) => this.setState(sig));
    }
  }
  async getPublicKey() {}
  async sign(msg) {}
  render() {
    return this.renderPoint();
  }
}

class SecpSigner extends Signer {
  async getPublicKey() {
    const hex = secp.getPublicKey(this.props.privKey, true);
    const pub = secp.Point.fromHex(hex);
    const [x, y] = [pub.x, pub.y].map((n) => pad(n));
    return { hex33: pub.toHex(true), hex64: pub.toHex(false), x, y };
  }
  async sign() {
    const msgHash = sha256(this.props.message);
    const sigHash = await secp.sign(msgHash, this.props.privKey, { canonical: true });
    const sig = secp.Signature.fromDER(sigHash);
    const [r, s] = [sig.r, sig.s].map((n) => pad(n));
    return {
      compactSig: sig.toCompactHex(),
      derSig: sig.toDERHex(),
      msgHash: bytesToHex(msgHash),
      r,
      s,
    };
  }
  // prettier-ignore
  renderPoint() {
    return (
      <div className="curve-data">
        <h3>Public key</h3>
        <table>
          <tbody>
            <tr><td>x</td><td><code>{this.state.x}</code></td></tr>
            <tr><td>y</td><td><code>{this.state.y}</code></td></tr>
            <tr><td>33b hex</td><td><code>{this.state.hex33}</code></td></tr>
            <tr><td>64b hex</td><td><code>{this.state.hex64}</code></td></tr>
          </tbody>
        </table>
        <h3>Signature</h3>
        <table>
          <tbody>
            <tr><td>msgHash</td><td><code>{this.state.msgHash}</code></td></tr>
            <tr><td>r</td><td><code>{this.state.r}</code></td></tr>
            <tr><td>s</td><td><code>{this.state.s}</code></td></tr>
            <tr><td>compact</td><td><code>{this.state.compactSig}</code></td></tr>
            <tr><td>der</td><td><code>{this.state.derSig}</code></td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

class SecpSchnorrSigner extends Signer {
  async getPublicKey() {
    const pub = secp.Point.fromHex(secp.schnorr.getPublicKey(this.props.privKey));
    const [x, y] = [pub.x, pub.y].map((n) => pad(n));
    return { hex: pub.toHex(), x, y };
  }
  async sign() {
    const msg = utf8ToBytes(this.props.message);
    const auxRand = secp.utils.randomBytes();
    const _sig = (await secp.schnorr.sign(msg, this.props.privKey, auxRand));
    const sig = secp.schnorr.Signature.fromHex(_sig);
    const [r, s] = [sig.r, sig.s].map((n) => pad(n));
    return { msg: bytesToHex(msg), auxRand: bytesToHex(auxRand), r, s, sigHex: sig.toHex() };
  }
  // prettier-ignore
  renderPoint() {
    return (
      <div className="curve-data">
        <h3>Public key</h3>
        <table>
          <tbody>
            <tr><td>x</td><td><code>{this.state.x}</code></td></tr>
            <tr><td>y</td><td><code>{this.state.y}</code></td></tr>
            <tr><td>hex</td><td><code>{this.state.hex}</code></td></tr>
          </tbody>
        </table>
        <h3>Signature</h3>
        <table>
          <tbody>
            <tr><td>msg</td><td><code>{this.state.msg}</code></td></tr>
            <tr><td>auxRand</td><td><code>{this.state.auxRand}</code></td></tr>
            <tr><td>r</td><td><code>{this.state.r}</code></td></tr>
            <tr><td>s</td><td><code>{this.state.s}</code></td></tr>
            <tr><td>sigHex</td><td><code>{this.state.sigHex}</code></td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

class EdSigner extends Signer {
  async getPublicKey() {
    const pub = ed.Point.fromHex(await ed.getPublicKey(this.props.privKey));
    const [x, y] = [pub.x, pub.y].map((n) => pad(n));
    return { hex: pub.toHex(), x, y };
  }
  async sign() {
    const msg = utf8ToBytes(this.props.message);
    const sig = ed.Signature.fromHex(await ed.sign(msg, this.props.privKey));
    const [rx, ry, s] = [sig.r.x, sig.r.y, sig.s].map((n) => pad(n));
    return { msg: bytesToHex(msg), rx, ry, s, sigHex: sig.toHex() };
  }
  // prettier-ignore
  renderPoint() {
    return (
      <div className="curve-data">
        <h3>Public key</h3>
        <table>
          <tbody>
            <tr><td>x</td><td><code>{this.state.x}</code></td></tr>
            <tr><td>y</td><td><code>{this.state.y}</code></td></tr>
            <tr><td>hex</td><td><code>{this.state.hex}</code></td></tr>
          </tbody>
        </table>
        <h3>Signature</h3>
        <table>
          <tbody>
            <tr><td>msg</td><td><code>{this.state.msg}</code></td></tr>
            <tr><td>r.x</td><td><code>{this.state.rx}</code></td></tr>
            <tr><td>r.y</td><td><code>{this.state.ry}</code></td></tr>
            <tr><td>s</td><td><code>{this.state.s}</code></td></tr>
            <tr><td>sigHex</td><td><code>{this.state.sigHex}</code></td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

class BlsSigner extends Signer {
  async getPublicKey() {
    const hex = bls.getPublicKey(this.props.privKey);
    const pub = bls.PointG1.fromHex(hex);
    const [x, y, z] = [pub.x, pub.y, pub.z].map((n) => pad(n.value));
    return { hex, x, y, z };
  }
  async sign() {
    const msgHash = sha256(this.props.message);
    const sigHex = await bls.sign(msgHash, this.props.privKey);
    const sig = bls.PointG2.fromSignature(sigHex);
    const [sigX, sigXi, sigY, sigYi] = [sig.x.c[0], sig.x.c[1], sig.y.c[0], sig.y.c[0]].map((n) => {
      return pad(n.value, 96);
    });
    return { msgHash: bytesToHex(msgHash), sigX, sigXi, sigY, sigYi, sigHex: bytesToHex(sigHex) };
  }
  // prettier-ignore
  renderPoint() {
    return (
      <div className="curve-data">
        <h3>Public key G1</h3>
        <table>
          <tbody>
            <tr><td>x</td><td><code>{this.state.x}</code></td></tr>
            <tr><td>y</td><td><code>{this.state.y}</code></td></tr>
            <tr><td>hex</td><td><code>{this.state.hex}</code></td></tr>
          </tbody>
        </table>
        <h3>Signature G2</h3>
        <p><small>bls consists of two curves: G1 (ordinary) and G2 (complex numbers). Most implementations use G1 for pubkeys and G2 for signatures. So, signatures will coordinates in form of <code>(x₀, x₁×i), (y₀, y₁×i)</code></small></p>
        <table>
          <tbody>
            <tr><td>msgHash</td><td><code>{this.state.msgHash}</code></td></tr>
            <tr><td>x</td><td><code>{this.state.sigX}</code> +<br/><code>{this.state.sigXi}×i</code></td></tr>
            <tr><td>y</td><td><code>{this.state.sigY}</code> +<br/><code>{this.state.sigYi}×i</code></td></tr>
            <tr><td>sigHex</td><td><code>{this.state.sigHex}</code></td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

const signers = [
  { name: 'secp256k1 ecdsa', hash: 'sha256', cls: SecpSigner },
  { name: 'secp256k1 schnorr', hash: 'sha256', cls: SecpSchnorrSigner },
  { name: 'ed25519', hash: 'sha256', cls: EdSigner },
  { name: 'bls12-381', hash: 'sha256', cls: BlsSigner },
];

class EccApp extends React.Component {
  constructor() {
    super();
    this.state = {
      privKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      message: 'greetings from noble',
      curve: signers[0],
    };
  }

  setPrivateKey(value) {
    this.setState({ privKey: value });
  }

  generateRandomPrivateKey() {
    const array = window.crypto.getRandomValues(new Uint8Array(32));
    this.setPrivateKey(bytesToHex(array));
  }

  onKeyChange(event) {
    const padded = event.target.value.padStart(64, '0');
    if (/[\daAbBcCdDeEfFxX]{0,66}/.test(padded)) {
      this.setPrivateKey(padded);
    }
  }
  onMsgChange(event) {
    const message = event.target.value;
    if (message.length > 0) this.setState({ message });
  }

  selectCurve(curve) {
    this.setState({ curve });
  }

  render() {
    const radios = signers.map((s, i) => {
      const index = `curve-${i}`;
      return (
        <span className="curve-selector" key={index}>
          <input
            type="radio"
            name="curve"
            value={s.name}
            id={index}
            onChange={this.selectCurve.bind(this, s)}
            checked={s.name === this.state.curve.name}
          />
          <label htmlFor={index}>{s.name}</label>
        </span>
      );
    });
    return (
      <div>
        <div>
          <div>
            <label htmlFor="private-key">
              <strong>Private key in hex format</strong>
            </label>{' '}
            <button type="button" onClick={this.generateRandomPrivateKey.bind(this)}>
              Random
            </button>
          </div>
          <div>
            <input
              id="private-key"
              type="text"
              size="66"
              maxLength="66"
              value={this.state.privKey}
              pattern="[\daAbBcCdDeEfFxX]{0,66}"
              onBlur={this.onKeyChange.bind(this)}
              readOnly="1"
            />
          </div>
        </div>
        <div>
          <label htmlFor="message-to-sign">
            <strong>Message to sign</strong>
            <small style={{ color: 'gray' }}> (will be hashed with {this.state.curve.hash} for ecdsa/bls12)</small>
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
        <div>
          <div>
            <strong>Elliptic curve</strong>
          </div>
          {radios}
        </div>
        <div className="selected-curve">
          {<this.state.curve.cls privKey={this.state.privKey} message={this.state.message} />}
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', function () {
  ReactDOM.render(<EccApp />, document.querySelector('.ecc-calculator-container'));
});




// Peer-to-peer comms using peerjs
class PeerApp extends React.Component {

  state = {
    myId: '',
    friendId: '',
    peer: {},
    message: '',
    messages: []
  }

  componentDidMount() {
    const peer = new Peer('', {
      host: 'coinpeers.realmadsci.com',
      port: 8080,
      path: '/',
      secure: true,
      debug: 3
    });

    peer.on('open', (id) => {
      this.setState({
        myId: id,
        peer: peer
      });
    });

    peer.on('connection', (conn) => {
      console.log("I got connection. Reliable = " + conn.reliable);

      conn.on('data', (data) => {
        this.setState({
          messages: [...this.state.messages, data]
        });
      });
    });

    peer.on('disconnected', () => {
      console.log("Got disconnected. Trying to reconnect!");
      this.state.peer.reconnect();
    });
  }

  send = () => {
    const conn = this.state.peer.connect(this.state.friendId, {reliable: true});

    conn.on('open', () => {
      console.log("I opened a connection. Reliable = " + conn.reliable);

      const msgObj = {
        sender: this.state.myId,
        message: this.state.message
      };

      console.log("I'm going to send. I'll let you know how it goes! msg = " + msgObj);
      conn.send(msgObj);
      console.log("Sent!");

      this.setState({
        messages: [...this.state.messages, msgObj],
        message: ''
      });

    });

    conn.on('close', () => {
      console.log("The connection to " + conn.peer + " is closed!");
    });

    conn.on('error', (err) => {
      console.log("Got error = " + err);
    });

  }

  render() {
    return (
      <div className="wrapper">
        <div className="col">
          <h1>My ID: {this.state.myId}</h1>

          <label>Friend ID:</label>
          <input
            type="text"
            value={this.state.friendId}
            onChange={e => { this.setState({ friendId: e.target.value }); }} />

          <br />
          <br />

          <label>Message:</label>
          <input
            type="text"
            value={this.state.message}
            onChange={e => { this.setState({ message: e.target.value }); }} />
          <button onClick={this.send}>Send</button>

          {
            this.state.messages.map((message, i) => {
              return (
                <div key={i}>
                  <h3>{message.sender}:</h3>
                  <p>{message.message}</p>
                </div>

              )
            })
          }
        </div>
      </div>
    );
  }
}


document.addEventListener('DOMContentLoaded', function () {
  ReactDOM.render(<PeerApp />, document.querySelector('.peer-container'));
});
