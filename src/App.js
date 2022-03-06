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
    this._cache.subscribe((hash)=>{this.cacheHasNewBlock(hash)});
    this._conn = new ConnectionManager();
    this._conn.subscribeData((p, d)=>{this.handlePeerBlock(p,d)});
    this._mineworker = null;
  }

  handlePeerBlock(peer, data) {
    this._cache.addBlock(RealBadBlock.coerce(JSON.parse(data)));
  }

  // Set this up as a callback from the cache when
  // it gets any new blocks
  cacheHasNewBlock(hash) {
    // We just got this block and it's new, so announce it to our friends
    this._conn.broadcast(JSON.stringify(this._cache.getBlock(hash)));

    console.log("Best block is " + this._cache.bestBlockHash + " at height " + this._cache.getBlock(this._cache.bestBlockHash).blockHeight);

    // Automatically jump to the selected state
    let topHash = this._cache.bestBlockHash;
    this.setState({
      topHash: topHash,
      topBlock: this._cache.getBlock(topHash),
      topLState: this._cache.getState(topHash),
    });
  }

  async miningLoop(destination) {
    let prevHash = '00'.repeat(32);
    let worker = null;
    let difficulty = 10*256**2;
    let reward = 100;
    while (true) {
      // Grab the newest block
      // NOTE: This will return null if there aren't any blocks yet!
      let newestHash = this._cache.bestBlockHash;

      // Only need to do a worker if the "best" is updated somehow.
      // This will be true if a new "best block" arrives OR if we have new transactions.
      //TODO: Update for new transactions!
      if (prevHash != newestHash) {
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
        b.difficulty = difficulty;
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
          // Add it to our cache
          this._cache.addBlock(RealBadBlock.coerce(b));
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
