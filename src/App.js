import * as React from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import {
  AccountIdentity,
  AccountView,
} from './AccountView.js';
import { ConnectionManager, PeerApp } from './ConnectionManager';
import BlockView from './BlockView';
import CoinTransfer from './CoinTransfer';

// For the MineWorker:
import * as Comlink from 'comlink';

import {
  RealBadBlock
} from './util/RealBadCoin.tsx';

const MineWorker = Comlink.wrap(new Worker(new URL("./util/MineWorker.js", import.meta.url)));
const CacheWorker = Comlink.wrap(new Worker(new URL("./util/CacheWorker.js", import.meta.url)));

class App extends React.Component {
  constructor(props) {
    super(props);

    // State includes Account ID, Block Cache, MiningWorker
    this.state = {
      privKeyHex: null,
      pubKeyHex: null,
      topHash: null,
      topBlock: null,
      topLState: null,
    };

    this._id = new AccountIdentity();

    this._conn = new ConnectionManager();
    this._conn.subscribeData((p, d)=>{this.handlePeerData(p,d)});
    this._conn.subscribeNewPeer((p)=>{this.handleNewPeer(p);});

    this._mineworker = null;

    // Start the async initialization process
    this._initialized = this._initialize();
  }

  async _initialize() {
    this.state.privKeyHex = await this._id.getPrivKeyHex();
    this.state.pubKeyHex = await this._id.getPubKeyHex();
    this._cacheworker = await new CacheWorker();
  }

  async handleNewPeer(peer) {
    // Whenever we get connected to a new peer, ask for all the blocks they know about!
    //console.log("Pestering peer \"" + peer + "\" with requestBlocks");
    this._conn.sendToPeer(peer, JSON.stringify({
      requestBlocks: {
        have: await this._cacheworker.bestBlockHash,
        want: null, // Null means "give me your best chain"
      }
    }));
  }

  // Submit a new transaction to be included in future blocks
  async submitTransaction(tx) {
    // Just fake it as if we "received" it from ourselves and then we'll rebroadcast it
    await this.handlePeerData(this._conn.myId, JSON.stringify({
      newTx: tx,
    }));
  }

  async handlePeerData(peer, data) {
    let d = JSON.parse(data);
    if ("newBlock" in d) {
      // Whenever we see a new block arrival, see if we can add it to the cache:
      let block = RealBadBlock.coerce(d.newBlock);
      if (await this._cacheworker.addBlock(block, peer, false)) {

        // If the new block was good but still needs a parent, then send a request to try to fetch it's parent:
        let hash = block.hash;
        let oldestParent = (await this._cacheworker.getBlockInfo((await this._cacheworker.getChain(hash))[0])).block;
        if (oldestParent.blockHeight !== 0) {
          this._conn.sendToPeer(peer, JSON.stringify({
            requestBlocks: {
              have: await this._cacheworker.bestBlockHash,
              want: oldestParent.prevHash,
            }
          }));
        }

        // Whenever a new _valid_ block comes along AND we didn't request it,
        // broadcast it out to all our friends:
        this._conn.broadcast(
          JSON.stringify({
            newBlock: block,
          }),
          [peer], // Don't broadcast BACK to the person who told us about this!
        );

        // We added a new block to the cache, so update our UI!
        await this.cacheHasNewBlock(hash);
      }
    }

    // Shiny new blocks that we requested have arrived!
    if ("blockList" in d) {
      if (
        (await this._cacheworker.addBlocks(d.blockList)).some(r=>(r===true))
      ) {
        // We added a new block to the cache, so update our UI!
        await this.cacheHasNewBlock();
      }
    }

    // Somebody wants to know what we know
    if ("requestBlocks" in d) {
      let resultChain = await this._cacheworker.getChain(d.requestBlocks?.want, d.requestBlocks?.have);

      // Get the blocks and send them
      let blocks = await this._cacheworker.getBlocks(resultChain);
      this._conn.sendToPeer(peer, JSON.stringify({
        blockList: blocks,
      }));
    }

    // Yay! A new transaction has arrived!
    if ("newTx" in d) {
      // Try to add it to the tx pool.
      // If it's any good, then ship it to all our friends as well!
      console.error("Got new transaction from " + peer + ": " + JSON.stringify(d.newTx));
      if (await this._cacheworker.addTransaction(d.newTx)) {
        this._conn.broadcast(
          JSON.stringify({
            newTx: d.newTx, // Note: Extracting just the one Tx in case someone sends us a multiple-message?
          }),
          [peer], // Don't broadcast BACK to the person who told us about this!
        );
      }
    }
  }

  // Set this up as a callback from the cache when
  // it gets any new blocks
  async cacheHasNewBlock(hash=undefined, wasRequested=undefined) {
    let topHash = await this._cacheworker.bestBlockHash;
    if (topHash !== null) {
      let bi = await this._cacheworker.getBlockInfo(topHash);
      //console.log("Best block is " + topHash + " at height " + bi.block.blockHeight);

      // Automatically jump to the selected state
      this.setState({
        topHash: topHash,
        topBlock: bi.block,
        topLState: bi.state,
      });
    }
  }

  async miningLoop(destination) {
    let prevHash = '00'.repeat(32);
    let worker = null;
    let reward = 100;
    let sealAttempts = 4e5; // How many attempts to make per sealing loop
    while (true) {
      // Grab the newest block
      // NOTE: This will return null if there aren't any blocks yet!
      let newestHash = await this._cacheworker.bestBlockHash;

      // Only need to reset the worker if the "best" is updated somehow.
      // This will be true if a new "best block" arrives (or we make one!).
      if (prevHash !== newestHash) {
        // If we got a newer "best" block, then use that.
        // If we got null when we asked for the newest, then keep
        // the "pre-genesis" hash as "prevHash".
        if (newestHash !== null) prevHash = newestHash;

        // Get a new mineable block from the cache, which will include transactions, etc.
        let b = await this._cacheworker.makeMineableBlock(reward, destination);

        console.log("Setting up to mine block: " + JSON.stringify(b));

        // The block has changed, so update the worker.
        // Note: We will just "abandon" old workers and they will
        //       get garbage collected.
        worker = await new MineWorker(b);
      }

      if (worker !== null) {
        let before = new Date()
        let b = await worker.tryToSeal(sealAttempts);
        if (b === null) {
          // Didn't get one.
          // Adjust the mining length to try and hit a target time per loop
          let after = new Date();
          let delta = after - before;
          let errorRatio = delta / (5 * 1000); // Aiming for 5 seconds per cycle. Would try for less, but Brave keeps crashing with "sbox out of memory" or something...
          // Exponential moving average (EMA) approximation
          // NOTE: We clamp the error ratio between 0 and 2 so that even if we get EXTREMELY long gaps we
          // don't adjust more than 1/N in either direction!
          errorRatio = Math.min(2, errorRatio);
          const N = 40; // Number of cycles of "smoothing" effect.
          sealAttempts = Math.round(sealAttempts * (1 + (1 - errorRatio) / N));
          //console.log("Mining time = " + delta.toString() + " ms, errorRatio = " + errorRatio.toString() + ", attempts = " + sealAttempts.toString());
        }
        else {
          // We got one!
          // Pretend like we sent it to ourselves, so it will get cached and broadcasted.
          this.handlePeerData(this._conn.myId, JSON.stringify({
            newBlock: b,
          }));
        }
      }
    }
  }

  componentDidMount() {
    // Grab the keys sometime in the future and stash them:
    this._initialized.then(()=>{
      this.miningLoop(this.state.pubKeyHex);
    });
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1,
        rowGap: 1,
        minWidth: 350,
      }}>
        <Paper elevation={8}>
          <AccountView pubKeyHex={this.state.pubKeyHex} privKeyHex={this.state.privKeyHex} lstate={this.state.topLState} />
        </Paper>
        <Paper elevation={8}>
          <PeerApp conn={this._conn} />
        </Paper>
        <Paper elevation={8}>
          <CoinTransfer id={this._id} submit={tx=>this.submitTransaction(tx)} lstate={this.state.topLState} />
        </Paper>
        <Paper elevation={8}>
          <BlockView hash={this.state.topHash} block={this.state.topBlock} lstate={this.state.topLState} />
        </Paper>
      </Box>
    );
  }
}

export default App;
