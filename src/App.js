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

import {
  RealBadLedgerState
} from './util/RealBadState.tsx';

const MineWorker = Comlink.wrap(new Worker(new URL("./util/MineWorker.js", import.meta.url)));
const CacheWorker = Comlink.wrap(new Worker(new URL("./util/CacheWorker.js", import.meta.url)));

function async_sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    // Restore the checkpoint if we have one
    const checkpoint = JSON.parse(sessionStorage.getItem("checkpoint"));
    const useCheckpoint = sessionStorage.getItem("use_checkpoint"); // TODO: Make a checkbox for this to use for mobile devices???
    const block = checkpoint?.block;
    const state = checkpoint?.state;
    if (useCheckpoint && block && state) {
      await this._cacheworker.restoreCheckpoint(block, state);
    }
  }

  async handleNewPeer(peer) {
    // Whenever we get connected to a new peer, ask for all the blocks they know about!
    console.error("Pestering peer \"" + peer + "\" with requestBlocks");
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
      console.error("Got block " + block.blockHeight + " from " + peer);
      if (await this._cacheworker.addBlock(block, peer, false)) {

        // If the new block was good but still needs a parent, then send a request to try to fetch it's parent:
        let hash = block.hash;
        let oldestParent = (await this._cacheworker.getBlockInfo((await this._cacheworker.getChain(hash))[0])).block;
        if (oldestParent.blockHeight !== 0) {
          console.error("Requesting gap-filler blocks from peer \"" + peer + "\"");
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
      console.error("Got " + d.blockList.length.toString() + " blocks from " + peer);
      // Dump only 100 at a time, so we can keep updating the UI
      for (let i = 0; i < d.blockList.length; i += 100) {
        console.log("Feeding " + i.toString() + " to " + (i + 100).toString() + " into cacheworker");
        if (await this._cacheworker.addBlocks(d.blockList.slice(i, Math.min(i+100, d.blockList.length)))) {
          // We added a new block to the cache, so update our UI!
          await this.cacheHasNewBlock();
        }
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
      //console.log("Got new transaction from " + peer + ": " + JSON.stringify(d.newTx));
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

      // Get the block 100 blocks above this "best" block and use it as a checkpoint
      const checkpoint = JSON.parse(sessionStorage.getItem("checkpoint"));
      const checkpointHash = checkpoint?.hash;
      const chain = await this._cacheworker.getChain(topHash, checkpoint?.parentHash);
      // If the checkpoint hash has changed, then update it in storage
      const checkIndex = Math.max(0, chain.length - 1 - 100);
      if (chain[checkIndex] !== checkpointHash) {
        const checkpointHash = chain[checkIndex];
        const checkpointInfo = await this._cacheworker.getBlockInfo(checkpointHash);
        sessionStorage.setItem("checkpoint", JSON.stringify({
          block: RealBadBlock.coerce(checkpointInfo.block),
          state: RealBadLedgerState.coerce(checkpointInfo.state),
          hash: checkpointHash,
          parentHash: checkpointInfo.block.prevHash,
        }));
      }

      // Automatically jump to the selected state
      this.setState({
        topHash: topHash,
        topBlock: bi.block,
        topLState: bi.state,
      });
    }
  }

  async miningLoop(destination) {
    let worker = null;
    let reward = 100;
    const isChrome = false;//window.chrome ? true : false;
    const cycleTarget = isChrome ? 8 : 1; // Chrome has to cycle WAY more slowly or its GC will die...
    const gapTime = isChrome ? 800 : 100;
    let sealAttempts = isChrome ? 8e5 : 2e5; // How many attempts to make per sealing loop
    while (true) {
      // The Chrome-based systems will starve the garbage collector and run out of memory if we don't take a pause...
      await async_sleep(gapTime);

      // Get a new mineable block from the cache, which will include up-to-date list of transactions, etc.
      let unsealed = await this._cacheworker.makeMineableBlock(reward, destination);
      unsealed.nonce = Math.round(Math.random() * 2**32);
      console.log("Set up to mine block: " + JSON.stringify(unsealed));

      // The block has changed, so update the worker.
      // Note: We just "abandon" old workers and they will get garbage collected.
      worker = await new MineWorker(unsealed);

      let before = Date.now();
      let b = await worker.tryToSeal(sealAttempts);
      if (b === null) {
        // Didn't get one.
        // Adjust the mining length to try and hit a target time per loop
        let after = Date.now();
        let delta = after - before;
        let errorRatio = delta / (cycleTarget * 1000); // Aiming for 1 second per cycle to give fast confirmation times. Chrome browsers need more or they keep crashing with "sbox out of memory" or something...
        // Exponential moving average (EMA) approximation
        // NOTE: We clamp the error ratio between 0 and 2 so that even if we get EXTREMELY long gaps we
        // don't adjust more than 1/N in either direction!
        errorRatio = Math.min(2, errorRatio);
        const N = 40; // Number of cycles of "smoothing" effect.
        sealAttempts = Math.round(sealAttempts * (1 + (1 - errorRatio) / N));
        console.log("Mining time = " + delta.toString() + " ms, errorRatio = " + errorRatio.toString() + ", attempts = " + sealAttempts.toString());
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
