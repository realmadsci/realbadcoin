import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Imports from paulmillr.github.io demo:
//import React from 'react';
//import ReactDOM from 'react-dom';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, Hash, utf8ToBytes } from '@noble/hashes/utils';
import { Spoiler } from './react-spoiler';

// Peer-to-peer comms using peerjs
import Peer from 'peerjs';

import * as Comlink from 'comlink';

// Random slug generator to simplify connection to server
const { generateSlug } = require("random-word-slugs");

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
    (new HashWorker(0)).then(h=>{
      this.setState({hasher: h});

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
  async getPublicKey() {}
  async sign(msg) {}
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
        <table>
          <tbody>
            <tr><td>hex</td><td><code>{this.state.pubKeyHex}</code></td></tr>
          </tbody>
        </table>
        <h3>Signature</h3>
        <table>
          <tbody>
            <tr><td>msg</td><td><code>{this.state.msgHex}</code></td></tr>
            <tr><td>sigHex</td><td><code>{this.state.sigHex}</code></td></tr>
          </tbody>
        </table>
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
    //https://anseki.github.io/gnirts/
    const a=(388).toString(36).toLowerCase()+(function(){var Z=Array.prototype.slice.call(arguments),H=Z.shift();return Z.reverse().map(function(Q,P){return String.fromCharCode(Q-H-7-P)}).join('')})(29,140,147,144,144)+(28210).toString(36).toLowerCase()+(1203767).toString(36).toLowerCase().split('').map(function(r){return String.fromCharCode(r.charCodeAt()+(-39))}).join('')+(596).toString(36).toLowerCase()+(function(){var o=Array.prototype.slice.call(arguments),i=o.shift();return o.reverse().map(function(L,H){return String.fromCharCode(L-i-38-H)}).join('')})(0,101,104,101,99,97,151,149,151,151,157,154,147,147)+(7482579).toString(36).toLowerCase()+(function(){var L=Array.prototype.slice.call(arguments),w=L.shift();return L.reverse().map(function(c,N){return String.fromCharCode(c-w-39-N)}).join('')})(4,153,146);
    const id = sessionStorage.getItem("peer_id") || generateSlug(2);
    const peer = new Peer(id, {
      secure: true,
      debug: 3,
      config: {'iceServers': [
        { url: 'stun:coinpeers.realmadsci.com'},
        { url: 'turn:coinpeers.realmadsci.com', username: 'coin', credential: a}
      ]}
    });

    peer.on('open', (id) => {
      sessionStorage.setItem("peer_id", id);
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
