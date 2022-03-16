import * as React from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import {
  AccountIdentity,
  AccountView,
} from './AccountView.js';
import { ConnectionManager, PeerApp } from './ConnectionManager';
import BlockView from './BlockView';
import TreeView from './TreeView';
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
      cache: null,
      newBlockCounter: 0,
    };

    this._id = new AccountIdentity();

    this._conn = new ConnectionManager();
    this._conn.subscribeData((p, d)=>{this.handlePeerData(p,d)});
    this._conn.subscribeNewPeer((p)=>{this.handleNewPeer(p);});

    this._blockBacklog = [];
  }

  async _initialize() {
    this.setState({
      cache: await new CacheWorker(),
      privKeyHex: await this._id.getPrivKeyHex(),
      pubKeyHex: await this._id.getPubKeyHex(),
    });

    // Restore the checkpoint if we have one
    const checkpoint = JSON.parse(sessionStorage.getItem("checkpoint"));
    const useCheckpoint = sessionStorage.getItem("use_checkpoint"); // TODO: Make a checkbox for this to use for mobile devices???
    const block = checkpoint?.block;
    const state = checkpoint?.state;
    if (useCheckpoint && block && state) {
      await this.state.cache.restoreCheckpoint(block, state);
      await this.cacheHasNewBlock();
    }
  }

  async handleNewPeer(peer) {
    await this._initialized;

    // Whenever we get connected to a new peer, ask for all the blocks they know about!
    console.error("Pestering peer \"" + peer + "\" with requestBlocks");
    this._conn.sendToPeer(peer, JSON.stringify({
      requestBlocks: {
        have: this.state.topHash,
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

  async _processSomeBlocks() {
    if (this._blockBacklog.length) {
      const chunkLen = Math.min(1000, this._blockBacklog.length);
      const blocks = this._blockBacklog.slice(0, chunkLen);
      this._blockBacklog = this._blockBacklog.slice(blocks.length);
      console.log("Feeding " + chunkLen.toString() + " more blocks into cacheworker. " + this._blockBacklog.length + " more to go.");
      if (await this.state.cache.addBlocks(blocks)) {
        // We added a new block to the cache, so update our UI!
        await this.cacheHasNewBlock();
      }
    }

    // Handle the next bunch later if there's any left:
    if (this._blockBacklog.length) {
      this._processTimer = setTimeout(()=>{this._processSomeBlocks()},0);
    }
    else {
      this._processTimer = undefined;
    }
  }

  _addBlocks(blocks) {
    // NOTE: For now, we don't really care about tracking the "source" for blocks that arrive in bulk.
    this._blockBacklog = this._blockBacklog.concat(blocks);
    if (!this._processTimer) {
      this._processTimer = setTimeout(()=>{this._processSomeBlocks()},0);
    }
  }

  async handlePeerData(peer, data) {
    await this._initialized;

    let d = JSON.parse(data);
    if ("newBlock" in d) {
      // Whenever we see a new block arrival, see if we can add it to the cache:
      let block = RealBadBlock.coerce(d.newBlock);
      console.error("Got block " + block.blockHeight + " from " + peer);
      if (await this.state.cache.addBlock(block, peer, false)) {

        // If the new block was good but still needs a parent, then send a request to try to fetch it's parent:
        let hash = block.hash;
        let oldestParent = (await this.state.cache.getBlockInfo((await this.state.cache.getChain(hash))[0])).block;
        if (oldestParent.blockHeight !== 0) {
          let bestHash = await this.state.cache.bestBlockHash;
          let bestChain = await this.state.cache.getChain(bestHash);
          let bestBlockRoot = (await this.state.cache.getBlockInfo((bestChain)[0]))?.block;
          // NOTE: We tell the other side that our block we "already have" is way earlier than our true "best block" in case
          //       the other side doesn't share the same newest set of hashes with us. 40 should be _plenty_ far back, but if
          //       we've been disconnected and making our own blocks for 10+ minutes then we'll probably end up with a full fetch,
          //       but maybe that's a good thing???
          let likelyToBeOnMainBlockchain = bestChain[Math.max(0, bestChain.length-1-40)];
          console.error("Requesting gap-filler blocks from peer \"" + peer + "\"");
          this._conn.sendToPeer(peer, JSON.stringify({
            requestBlocks: {
              have: (bestBlockRoot?.blockHeight === 0) ? likelyToBeOnMainBlockchain : null, // Only send our "root hash" if we have a full chain already (i.e. we aren't branched from a checkpoint).
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
      this._addBlocks(d.blockList);
    }

    // Somebody wants to know what we know
    if ("requestBlocks" in d) {
      let resultChain = await this.state.cache.getChain(d.requestBlocks?.want, d.requestBlocks?.have);

      // Get the blocks and send them
      let blocks = await this.state.cache.getBlocks(resultChain);
      console.log("Got requestBlocks from " + peer + ": (" + d.requestBlocks?.want + "," + d.requestBlocks?.have + "), sending " + blocks.length + " blocks to them.");
      this._conn.sendToPeer(peer, JSON.stringify({
        blockList: blocks,
      }));
    }

    // Yay! A new transaction has arrived!
    if ("newTx" in d) {
      // Try to add it to the tx pool.
      // If it's any good, then ship it to all our friends as well!
      console.log("Got new transaction from " + peer + ": " + JSON.stringify(d.newTx));
      if (await this.state.cache.addTransaction(d.newTx)) {
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
    let topHash = await this.state.cache.bestBlockHash;
    if (topHash !== null) {
      let bi = await this.state.cache.getBlockInfo(topHash);
      //console.log("Best block is " + topHash + " at height " + bi.block.blockHeight);

      // Get the block 100 blocks above this "best" block and use it as a checkpoint
      const chain = await this.state.cache.getChain(topHash, null, 100);
      // If the checkpoint hash has changed, then update it in storage
      const checkpointHash = chain[0];
      const checkpointInfo = await this.state.cache.getBlockInfo(checkpointHash);
      if (checkpointInfo) {
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
    // Click the newBlockCounter, which triggers anything that is looking for "new blocks" to update:
    this.setState(prevState => ({
      newBlockCounter: prevState.newBlockCounter+1,
    }));
  }

  async miningLoop(destination) {
    let worker = null;
    let reward = 100;
    const cycleTarget = 1; // How long to make each sealing attempt
    let sealAttempts = 2e5; // How many attempts to make per sealing loop
    while (true) {
      // Get a new mineable block from the cache, which will include up-to-date list of transactions, etc.
      let unsealed = await this.state.cache.makeMineableBlock(reward, destination);
      unsealed.nonce = Math.round(Math.random() * 2**32);
      console.log("Set up to mine block: " + JSON.stringify(unsealed));

      let before = Date.now();
      let b = await MineWorker.tryToSeal(unsealed, sealAttempts);
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
        // NOTE: We "await" it here though, so that the block cache gets updated before we try to mine again!
        await this.handlePeerData(this._conn.myId, JSON.stringify({
          newBlock: b,
        }));
      }
    }
  }

  componentDidMount() {
    // Start the async initialization process
    this._initialized = this._initialize();

    // After the initialization is complete, start the mining loop
    this._initialized.then(()=>{
      // Sleep a little while to let the page finish loading and then start the mining loop
      setTimeout(()=>{
        this.miningLoop(this.state.pubKeyHex)
        },
        2000
      );
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
        <Paper elevation={8} sx={{height: 400}}>
          <TreeView selected={this.state.topHash} cache={this.state.cache} newBlockCounter={this.state.newBlockCounter} />
        </Paper>
      </Box>
    );
  }
}

export default App;
