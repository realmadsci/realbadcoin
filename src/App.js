import * as React from 'react';
import Paper from '@mui/material/Paper';

import {
  AccountIdentity,
  AccountView,
} from './AccountView.js';
import PeerApp from './PeerDemo';
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

function makeBlock() {
  let block = new RealBadBlock();
  // Pick an easy target to save testing time, but hard enough that
  // it isn't likely to happen by accident.
  block.difficulty = 256 ** 2;
  block.rewardDestination = "FE39C1887F08F1B7CFB9B6034AC01F6DD06F721FE370D3CD1F7621045387C230".toLowerCase();
  block.tryToSeal(1e6);
  //expect(block.isSealed()).toBe(true);
  return block;
}

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
    this._cache.subscribe(()=>{this.cacheHasNewBlock()});
    this._mineworker = null;
  }

  // Set this up as a callback from the cache when
  // it gets any new blocks
  cacheHasNewBlock() {
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
      <>
        <Paper>
          <AccountView pubKeyHex={this.state.pubKeyHex} privKeyHex={this.state.privKeyHex} lstate={this.state.topLState} />
        </Paper>
        <Paper>
          <PeerApp />
        </Paper>
        <Paper>
          <BlockView hash={this.state.topHash} block={this.state.topBlock} lstate={this.state.topLState} />
        </Paper>
        <Paper>
          <TransactionView />
        </Paper>
      </>
    );
  }
}

export default App;
