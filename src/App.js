import * as React from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';


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

class App extends React.Component {
  constructor(props) {
    super(props);

    // State includes Account ID, Block Cache, MiningWorker
    this.state = {
      privKeyHex: null,
      pubKeyHex: null,
      activeTab: "1",
      tvSelected: null,
      tvBlock: null,
      tvLState: null,
      tvFollow: true,
      topHash: null,
      topBlock: null,
      topLState: null,
      accountSelected: null,
      accountLState: null,
      cache: null,
      newBlockCounter: 0,
    };

    this._id = new AccountIdentity();

    this._conn = new ConnectionManager();
    this._peerDataCallback = this.handlePeerData.bind(this);
    this._newPeerCallback = this.handleNewPeer.bind(this);

    this._blockBacklog = [];
    this._gapsToFix = {}; // Hash and peer of blocks with gaps below them.
  }

  async _initialize() {
    this.setState({
      cache: await new this._CacheWorkerFactory(),
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
      await this.cacheHasNewBlock(block.hash, null);
    }
  }

  // Return {isCheckpoint, likelyHash} object.
  async _getLikelySharedHash() {
    let bestChain = await this.state.cache.getChain(await this.state.cache.bestBlockHash);
    let bestBlockRoot = (await this.state.cache.getBlockInfo((bestChain)[0]))?.block;
    // NOTE: We tell the other side that our block we "already have" is way earlier than our true "best block" in case
    //       the other side doesn't share the same newest set of hashes with us. 40 should be _plenty_ far back, but if
    //       we've been disconnected and making our own blocks for 10+ minutes then we'll probably end up with a full fetch,
    //       but maybe that's a good thing???
    return {
      isCheckpoint: (bestBlockRoot?.blockHeight !== 0),
      likelyHash: bestChain[Math.max(0, bestChain.length-1-40)],
    }
  }

  async handleNewPeer(peer) {
    await this._initialized;

    // Whenever we get connected to a new peer, ask for all the blocks they know about!
    console.error("Pestering peer \"" + peer + "\" with requestBlocks");
    const sh = await this._getLikelySharedHash();
    const msg = JSON.stringify({
      requestBlocks: {
        have: sh.likelyHash, // NOTE: we don't care if we are using a checkpoint here. In fact, we DEFINITELY want to just use the checkpoint hash for the first fetch!
        want: null, // Null means "give me your best chain"
    }});
    setTimeout(()=>{
      console.log("poke " + peer + " with " + msg);
      this._conn.sendToPeer(peer, msg);
    },
    3000);
  }

  // Submit a new transaction to be included in future blocks
  async submitTransaction(tx) {
    // Just fake it as if we "received" it from ourselves and then we'll rebroadcast it
    await this.handlePeerData(this._conn.myId, JSON.stringify({
      newTx: tx,
    }));
  }

  async _processSomeBlocks() {
    clearTimeout(this._processTimer);
    this._processTimer = undefined;

    if (this._blockBacklog.length) {
      const chunk = this._blockBacklog.shift();
      const blocks = chunk.blocks;
      console.log("Feeding " + blocks.length.toString() + " blocks from " + chunk.source + " into cacheworker. " + this._blockBacklog.length + " more chunks to go.");
      if (await this.state.cache.addBlocks(blocks)) {
        // We added a new block to the cache, so update our UI and search for gaps to fill
        await this.cacheHasNewBlock(RealBadBlock.coerce(blocks.slice(-1)[0]).hash, chunk.source);
      }
    }

    // Handle the next bunch later if there's any left:
    if (this._blockBacklog.length) {
      if (!this._processTimer) {
        this._processTimer = setTimeout(()=>{this._processSomeBlocks()},0);
      }
    }
    else {
      // See if we can fix any gaps now that we are "idle":
      await this._fixGaps();
    }
  }

  async _fixGaps(isTimeout=false) {
    clearTimeout(this._gapCheckTimer);
    this._gapCheckTimer = undefined;

    // If there's a backlog, then defer until later:
    if (this._blockBacklog.length) {
      console.log("Gap fix has backlog. We'll get called again later.");
      return;
    }

    console.log("Trying to fix gaps. _gapsToFix = " + JSON.stringify(this._gapsToFix));

    // Check all the gaps until we find one that isn't "fixed" and then make a request to try
    // and fetch it's parent:
    const gaps = Object.keys(this._gapsToFix);
    let remainingGaps = {};
    for (const gap of gaps) {
      const source = this._gapsToFix[gap].source;
      let attempts = this._gapsToFix[gap].attempts;

      console.log("Checking gap above " + gap + " from " + source);
      const oldestParent = (await this.state.cache.getBlockInfo((await this.state.cache.getChain(gap))[0])).block;
      const oldestParentHash = RealBadBlock.coerce(oldestParent).hash;
      console.log(oldestParent);
      console.log(oldestParentHash);

      if (oldestParent.blockHeight === 0) continue; // Not a gap anymore!
      else if (
        (oldestParentHash !== gap) && (
          (oldestParentHash in this._gapsToFix) ||
          (oldestParentHash in remainingGaps)
        )
      ) {
        // This one is part of an already-known gap.
        // Don't keep two copies!
        continue;
      }
      else if (!attempts || isTimeout) {
        // We try again if we've never tried or if we are executing the "timeout" event.
        attempts++;
        if (attempts > 5) continue; // Throw the "gap" away if we've tried enough times already!

        // Send a request to try and get the gap filled!
        const sh = await this._getLikelySharedHash();
        console.error("Requesting gap-filler blocks for " + gap + " from peer \"" + source + "\" by fetching " + oldestParent.prevHash);
        const req = JSON.stringify({
          requestBlocks: {
            have: sh.isCheckpoint ? null : sh.likelyHash, // Only send our "root hash" if we have a full chain already (i.e. we aren't branched from a checkpoint).
            want: oldestParent.prevHash,
          }
        });
        // The first two tries go directly to the "source".
        if (attempts <= 2) this._conn.sendToPeer(source, req);
        // After that, we _broadcast_ it a few times!
        // NOTE: This will happen if the previous source gets disconnected!
        else this._conn.broadcast(req);
      }

      // If we get here it's not fully fixed yet.
      // Keep this gap in our list
      remainingGaps[oldestParentHash] = {
        source: source,
        attempts: attempts,
      };
    }
    this._gapsToFix = remainingGaps;

    // If there are any gaps that aren't cleared up, then set ourselves a timer to check again later!
    if (Object.keys(this._gapsToFix).length) {
      console.log("There are un-finished gaps. Setting watchdog for later.");
      this._gapCheckTimer = setTimeout(()=>{this._fixGaps(true)}, 10000);
    }
  }

  _addBlocks(blocks, peer) {
    // NOTE: For now, we don't really care about tracking the "source" for blocks that arrive in bulk.
    this._blockBacklog.push({
      blocks: blocks,
      source: peer,
    });
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
        // Whenever a new _valid_ block comes along AND we didn't request it,
        // broadcast it out to all our friends:
        this._conn.broadcast(
          JSON.stringify({
            newBlock: block,
          }),
          [peer], // Don't broadcast BACK to the person who told us about this!
        );

        // We added a new block to the cache, so update our UI and search for gaps to fill
        await this.cacheHasNewBlock(block.hash, peer);
      }
    }

    // Shiny new blocks that we requested have arrived!
    if ("blockList" in d) {
      console.error("Got " + d.blockList.length.toString() + " blocks from " + peer);
      if (d.blockList.length) this._addBlocks(d.blockList, peer);
    }

    // Somebody wants to know what we know
    if ("requestBlocks" in d) {
      // NOTE: We only send a maximum of 100 blocks per request. They'll just have to ask again later!
      let resultChain = await this.state.cache.getChain(d.requestBlocks?.want, d.requestBlocks?.have, 100);

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
  async cacheHasNewBlock(hash, source) {

    // If the new block still needs a parent and we know where it came from, then add it to
    // the "Gap fix queue" so we can try and fetch its parents:
    if (source && (source !== this._conn.myId)) {
      let oldestParent = (await this.state.cache.getBlockInfo((await this.state.cache.getChain(hash))[0])).block;
      if (oldestParent.blockHeight !== 0) {
        // NOTE: We have to put a block that we KNOW about in there, so we can pull it out for checking later.
        // We also want to always pick the same one for multiple "newBlock" events on the same chain so that
        // we can avoid redundantly fetching the same data.
        const gapHash = RealBadBlock.coerce(oldestParent).hash;
        if (gapHash in this._gapsToFix) {
          // If we get the same gap from multiple "sources", then we want to
          // tag the _most recent one to give us a fresh block_!
          this._gapsToFix[gapHash].source = source;
        }
        else {
          this._gapsToFix[gapHash] = {
            source: source,
            attempts: 0,
          };

          // Since this one's new, try and request it right away!
          await this._fixGaps();
        }
      }
    }

    // Update the new "best branch"
    let topHash = await this.state.cache.bestBlockHash;
    let innerState = {};
    if (topHash !== null) {
      let bi = await this.state.cache.getBlockInfo(topHash);
      //console.log("Best block is " + topHash + " at height " + bi.block.blockHeight);

      // Get the block a good distance above this "best" block and use it as a checkpoint
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

      let accountState = null;
      let safeHash = (await this.state.cache.getChain(topHash, null, 4))[0];
      if (safeHash) {
        const bisafe = await this.state.cache.getBlockInfo(safeHash);
        accountState = RealBadLedgerState.coerce(bisafe?.state);
      }

      // Automatically jump to the selected state
      this.setState({
        topHash: topHash,
        topBlock: RealBadBlock.coerce(bi.block),
        topLState: RealBadLedgerState.coerce(bi.state),
        accountSelected: safeHash,
        accountLState: accountState,
      });
    }
    // Click the newBlockCounter, which triggers anything that is looking for "new blocks" to update:
    this.setState(prevState => ({
      newBlockCounter: prevState.newBlockCounter+1,
      ...innerState
    }));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.tvFollow) {
      const nextHash = this.state.accountSelected ?? this.state.topHash;
      if (nextHash !== this.state.tvSelected) {
        this.setState({
          tvSelected: nextHash,
        });
      }
    }

    if (this.state.tvSelected !== prevState.tvSelected) {
      this.state.cache.getBlockInfo(this.state.tvSelected).then(bi=>{
        this.setState({
          tvBlock: bi?.block,
          tvLState: bi?.state,
        });
      });
    }
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
      //console.log("Set up to mine block: " + JSON.stringify(unsealed));

      let before = Date.now();
      let b = await this._MineWorker.tryToSeal(unsealed, sealAttempts);
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
        //console.log("Mining time = " + delta.toString() + " ms, errorRatio = " + errorRatio.toString() + ", attempts = " + sealAttempts.toString());
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
    // Start up the web workers
    this._rawMineWorker = new Worker(new URL("./util/MineWorker.js", import.meta.url));
    this._MineWorker = Comlink.wrap(this._rawMineWorker);
    this._rawCacheWorker = new Worker(new URL("./util/CacheWorker.js", import.meta.url));
    this._CacheWorkerFactory = Comlink.wrap(this._rawCacheWorker);

    // Connect to the server:
    this._conn.subscribeData(this._peerDataCallback);
    this._conn.subscribeNewPeer(this._newPeerCallback);
    this._conn.connectToServer();

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
    // Stop timers
    clearTimeout(this._processTimer);
    clearTimeout(this._gapCheckTimer);

    // Kill off the web workers
    this._rawMineWorker.terminate();
    this._rawCacheWorker.terminate();

    // Disconnect from the server
    this._conn.unsubscribeData(this._peerDataCallback);
    this._conn.unsubscribeNewPeer(this._newPeerCallback);
    this._conn.disconnectFromServer();
  }

  render() {
    return (
      <TabContext value={this.state.activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider'}}>
          <TabList
            onChange={(e,nV)=>this.setState({activeTab: nV})}
            aria-label="View"
            centered
          >
            <Tab icon={<AccountBalanceWalletRoundedIcon />} label="ACCOUNT" value="1" />
            <Tab icon={<PrecisionManufacturingRoundedIcon />} label="MINING" value="2" />
            <Tab icon={<AccountTreeRoundedIcon />} label="BLOCKCHAIN" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1" sx={{p: 0}}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            rowGap: 1,
            minWidth: 350,
          }}>
            <Paper elevation={4}>
              <AccountView pubKeyHex={this.state.pubKeyHex} privKeyHex={this.state.privKeyHex} lstate={this.state.accountLState} />
            </Paper>
            <Paper elevation={4}>
              <PeerApp conn={this._conn} />
            </Paper>
            <Paper elevation={4}>
              <CoinTransfer id={this._id} submit={tx=>this.submitTransaction(tx)} lstate={this.state.accountLState} />
            </Paper>
          </Box>
        </TabPanel>
        <TabPanel value="2" sx={{p: 0}}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            rowGap: 1,
            minWidth: 350,
          }}>
            <Paper elevation={4}>
              <BlockView hash={this.state.topHash} block={this.state.topBlock} lstate={this.state.topLState} />
            </Paper>
          </Box>
        </TabPanel>
        <TabPanel value="3" sx={{p: 0}}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            rowGap: 1,
            minWidth: 350,
          }}>
            <Paper elevation={4}
              sx={{
                height: 220,
              }}
            >
              <TreeView
                selected={this.state.tvSelected}
                nodeSelected={hash=>{this.setState({tvFollow: false, tvSelected: hash})}}
                isFollowing={this.state.tvFollow}
                enableFollow={()=>{this.setState({tvFollow: true});}}
                cache={this.state.cache}
                newBlockCounter={this.state.newBlockCounter}
              />
            </Paper>
            <Paper elevation={4}>
              <BlockView hash={this.state.tvSelected} block={this.state.tvBlock} lstate={this.state.tvLState} />
            </Paper>
          </Box>
        </TabPanel>
      </TabContext>
    );
  }
}

export default App;
