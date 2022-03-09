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
    this._cache = new RealBadCache();
    this._cache.subscribe((hash, req)=>{this.cacheHasNewBlock(hash, req)});
    this._conn = new ConnectionManager();
    this._conn.subscribeData((p, d)=>{this.handlePeerData(p,d)});
    this._mineworker = null;
  }

  handlePeerData(peer, data) {
    let d = JSON.parse(data);
    if ("newBlock" in d) {
      // Whenever we see a new block arrival, see if we can add it to the cache:
      let block = RealBadBlock.coerce(d.newBlock);
      if (this._cache.addBlock(block, peer, false)) {

        // If the new block was good but still needs a parent, then send a request to try to fetch it's parent:
        let hash = block.hash;
        let oldestParent = this._cache.getBlock(this._cache.getChain(hash)[0]);
        if (oldestParent.blockHeight !== 0) {
          this._conn.sendToPeer(peer, JSON.stringify({
            requestBlocks: {
              have: this._cache.bestBlockHash,
              want: oldestParent.prevHash,
            }
          }));
        }
      }
    }

    // Shiny new blocks that we requested have arrived!
    if ("blockList" in d) {
      d.blockList.forEach((b, i)=>{
        this._cache.addBlock(
          RealBadBlock.coerce(b),
          peer,
          true, // We requested these!
        );
      });
    }

    // Somebody wants to know what we know
    if ("requestBlocks" in d) {
      let resultChain = this._cache.getChain(d.requestBlocks?.want, d.requestBlocks?.have);

      // Get the blocks and send them
      let blocks = resultChain.map((h, i)=>this._cache.getBlock(h));
      this._conn.sendToPeer(peer, JSON.stringify({
        blockList: blocks,
      }));
    }
  }

  // Set this up as a callback from the cache when
  // it gets any new blocks
  cacheHasNewBlock(hash, wasRequested) {
    // Whenever a new block comes along AND we didn't request it, broadcast it out to all our friends:
    if (!wasRequested) {
      this._conn.broadcast(
        JSON.stringify({
          newBlock: this._cache.getBlock(hash),
        }),
        [this._cache.getSource(hash)], // Don't broadcast BACK to the person who told us about this!
      );
    }

    if (this._cache.bestBlockHash !== null) {
      console.log("Best block is " + this._cache.bestBlockHash + " at height " + this._cache.getBlock(this._cache.bestBlockHash).blockHeight);

      // Automatically jump to the selected state
      let topHash = this._cache.bestBlockHash;
      this.setState({
        topHash: topHash,
        topBlock: this._cache.getBlock(topHash),
        topLState: this._cache.getState(topHash),
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
      let newestHash = this._cache.bestBlockHash;

      // Only need to do a worker if the "best" is updated somehow.
      // This will be true if a new "best block" arrives OR if we have new transactions.
      //TODO: Update for new transactions!
      if (prevHash !== newestHash) {
        // If we got a newer "best" block, then use that.
        // If we got null when we asked for the newest, then keep
        // the "pre-genesis" hash as "prevHash".
        let prevHeight = -1;
        if (newestHash !== null) {
          prevHash = newestHash;
          prevHeight = this._cache.getBlock(prevHash).blockHeight;
        }

        let b = new RealBadBlock();
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        b.difficulty = this._cache.getState(prevHash)?.nextBlockDifficulty ?? baseDifficulty;
        b.miningReward = reward;
        b.rewardDestination = destination;
        //TODO: Add transactions in here somewhere!

        // If the block has changed, then update the worker.
        // Note: We will just "abandon" old workers and they will
        //       get garbage collected.
        worker = await new MineWorker(b);
      }

      if (worker !== null) {
        let b = await worker.tryToSeal(50000);
        if (b !== null) {
          // We got one!
          // Add it to our cache
          this._cache.addBlock(RealBadBlock.coerce(b), this._conn.myId);
        }
      }
    }
  }

  componentDidMount() {
    // Grab the keys sometime in the future and stash them:
    this._id.getPrivKeyHex().then(p=>{
      this._id.getPubKeyHex().then(q=>{
        this.setState({
          privKeyHex: p,
          pubKeyHex: q
        }, ()=>{
          this.miningLoop(q);
        });
      });
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
