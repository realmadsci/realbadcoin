import * as React from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import {
  AccountIdentity,
  AccountView,
} from './AccountView.js';
import { ConnectionManager, PeerApp } from './ConnectionManager';
import BlockView from './BlockView';
import TransactionView from './TransactionView';

// For the MineWorker:
import * as Comlink from 'comlink';

import {
  RealBadBlock
} from './util/RealBadCoin.tsx';

import {
  RealBadCache
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
    };

    this._id = new AccountIdentity();

    this._conn = new ConnectionManager();
    this._conn.subscribeData((p, d)=>{this.handlePeerData(p,d)});

    this._mineworker = null;

    // Start the async initialization process
    this._initialized = this._initialize();
  }

  async _initialize() {
    this.state.privKeyHex = await this._id.getPrivKeyHex();
    this.state.pubKeyHex = await this._id.getPubKeyHex();
    this._cacheworker = await new CacheWorker();
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
    let baseDifficulty = 10*256**2;
    let reward = 100;
    while (true) {
      // Grab the newest block
      // NOTE: This will return null if there aren't any blocks yet!
      let newestHash = await this._cacheworker.bestBlockHash;

      // Only need to do a worker if the "best" is updated somehow.
      // This will be true if a new "best block" arrives OR if we have new transactions.
      //TODO: Update for new transactions!
      if (prevHash !== newestHash) {
        // If we got a newer "best" block, then use that.
        // If we got null when we asked for the newest, then keep
        // the "pre-genesis" hash as "prevHash".
        if (newestHash !== null) prevHash = newestHash;

        // Get the info for the previous block that we're going to build upon.
        // NOTE: This might be null!
        let lastBlockInfo = await this._cacheworker.getBlockInfo(prevHash);
        let prevHeight = lastBlockInfo?.block?.blockHeight ?? -1;

        let b = new RealBadBlock();
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        b.difficulty = lastBlockInfo?.state?.nextBlockDifficulty ?? baseDifficulty;
        b.miningReward = reward;
        b.rewardDestination = destination;
        //TODO: Add transactions in here somewhere!

        // If the block has changed, then update the worker.
        // Note: We will just "abandon" old workers and they will
        //       get garbage collected.
        worker = await new MineWorker(b);
      }

      if (worker !== null) {
        let b = await worker.tryToSeal(1e6);
        if (b !== null) {
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
          <BlockView hash={this.state.topHash} block={this.state.topBlock} lstate={this.state.topLState} />
        </Paper>
        <Paper elevation={8}>
          <PeerApp conn={this._conn} />
        </Paper>
      </Box>
    );
  }
}

export default App;
