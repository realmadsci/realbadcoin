// Import the data types for manipulating coin stuff
import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './RealBadCoin.tsx';

import { hexToBigint, bigintToHex } from 'bigint-conversion';

export class RealBadAccountState {
    balance = 0;
    nonce = 0;

    static coerce({
        balance,
        nonce,
    }) {
        let r = new RealBadAccountState();
        r.balance = balance;
        r.nonce = nonce;
        return r;
    }
}

export class RealBadNftState {
    owner = null;
    nonce = 0;

    static coerce({
        owner,
        nonce,
    }) {
        let r = new RealBadNftState();
        r.owner = owner;
        r.nonce = nonce;
        return r;
    }
}

// Exception thrown when 
export class RealBadInvalidTransaction {
    message = "";
    transaction = null;

    constructor(message, transaction) {
        this.message = message;
        this.transaction = transaction;
    }

    toString() {
      return "Bad Transaction:\n" + this.message + "\n" + this.transaction.toString();
    };
}

// This represents the state of the ledger at any given point
export class RealBadLedgerState {
    accounts = {};  // List of "accountId:RealBadAccountState" pairs.
    nfts = {};      // List of "nftId:RealBadNftState" pairs.
    transactionFees = 0;

    // Initialize the "last block" info with the "pre-genesis block"
    lastBlockHash = '00'.repeat(32);
    lastBlockHeight = -1;

    // This is the target difficulty, based on the timestamps between each block
    nextBlockDifficulty = null; // Difficulty of a genesis block!
    lastBlockTimestamp = null;

    // This is the sum of all difficulty metrics for all blocks in the chain leading up to this state.
    // It is used to determine which chain represents the highest block.
    totalDifficulty = 0n;

    // Can assign the genesis block difficulty in the constructor
    constructor(genesisDifficulty = 2e6) {
        this.nextBlockDifficulty = genesisDifficulty;
    }

    static coerce({
        accounts,
        nfts,
        transactionFees,
        lastBlockHash,
        lastBlockHeight,
        nextBlockDifficulty,
        lastBlockTimestamp,
        totalDifficulty,
    }) {
        let r = new RealBadLedgerState();
        Object.keys(accounts).forEach(k=>{
            r.accounts[k] = RealBadAccountState.coerce(accounts[k]);
        });
        Object.keys(nfts).forEach(k=>{
            r.nfts[k] = RealBadNftState.coerce(nfts[k]);
        });
        r.transactionFees = transactionFees;
        r.lastBlockHash = lastBlockHash;
        r.lastBlockHeight = lastBlockHeight;
        r.nextBlockDifficulty = nextBlockDifficulty;
        r.lastBlockTimestamp = lastBlockTimestamp;
        r.totalDifficulty = totalDifficulty;
        return r;
    }

    // Return a deep copy clone of the state
    clone() {
        // Shallow copy first:
        let copy = Object.assign({}, this);
        // JSON doesn't know what to do with BigInt, so we have to help it
        copy.totalDifficulty = bigintToHex(copy.totalDifficulty);
        // Force a total deep copy:
        copy = RealBadLedgerState.coerce(JSON.parse(JSON.stringify(copy)));
        // Fix totalDifficulty back:
        copy.totalDifficulty = hexToBigint(copy.totalDifficulty);
        return copy;
    }

    // Try and apply a transaction to the current state
    // Raises exception and doesn't change the state if it creates an unpermissible condition
    // Assumes that you've already checked that the transaction is VALID!
    tryTransaction(t) {
        if (t.txData instanceof RealBadCoinTransfer) {
            if (!(t.source in this.accounts)) throw new RealBadInvalidTransaction("Account tried to send coins before it existed", t);
            if (t.sourceNonce !== this.accounts[t.source].nonce + 1) throw new RealBadInvalidTransaction("Incorrect nonce", t);
            if (t.txData.amount + t.transactionFee > this.accounts[t.source].balance) throw new RealBadInvalidTransaction("Insufficient balance", t);

            // Consume the money spent from this account:
            this.accounts[t.source].nonce++;
            this.accounts[t.source].balance -= t.txData.amount + t.transactionFee;

            // Give the money to the other accounts, creating them if needed:
            this.transactionFees += t.transactionFee;
            if (!(t.txData.destination in this.accounts)) this.accounts[t.txData.destination] = new RealBadAccountState();
            this.accounts[t.txData.destination].balance += t.txData.amount;
        }
        else if (t.txData instanceof RealBadNftMint) {
            // See if the NFT already exists
            if (t.txData.nftId in this.nfts) throw new RealBadInvalidTransaction("NFT Mint attempted on already-existing NFT ID", t);

            // Accounts only have to exist and have coins if they are paying a Tx fee.
            // Otherwise they don't need to exist and they also don't increment their nonce!
            if (t.transactionFee > 0) {
                if (!(t.source in this.accounts)) throw new RealBadInvalidTransaction("Account tried to pay NFT Mint txFee before it existed", t);
                if (t.sourceNonce !== this.accounts[t.source].nonce + 1) throw new RealBadInvalidTransaction("Incorrect nonce for NFT Mint txFee", t);
                if (t.transactionFee > this.accounts[t.source].balance) throw new RealBadInvalidTransaction("Insufficient balance for NFT Mint txFee", t);
            }

            if (t.transactionFee > 0) {
                // Consume the money spent from this account and increment the nonce:
                this.accounts[t.source].nonce++;
                this.accounts[t.source].balance -= t.transactionFee;

                // Accept the transaction fee:
                this.transactionFees += t.transactionFee;
            }

            // Create the NFT and claim it for this account
            let nft = new RealBadNftState();
            nft.nonce = 0;
            nft.owner = t.source;
            this.nfts[t.txData.nftId] = nft;
        }
        else if (t.txData instanceof RealBadNftTransfer) {
            let nftid = t.txData.nftId;
            if (!(nftid in this.nfts)) throw new RealBadInvalidTransaction("NFT Transfer attempted on non-existent NFT ID", t);
            if (this.nfts[nftid].owner !== t.source) throw new RealBadInvalidTransaction("NFT Transfer attempted by non-owner of NFT", t);
            if (t.txData.nftNonce !== this.nfts[nftid].nonce + 1) throw new RealBadInvalidTransaction("Incorrect NFT nonce", t);

            // Accounts only have to exist and have coins if they are paying a Tx fee.
            // Otherwise they don't need to exist and they also don't increment their nonce!
            if (t.transactionFee > 0) {
                if (!(t.source in this.accounts)) throw new RealBadInvalidTransaction("Account tried to pay NFT Mint txFee before it existed", t);
                if (t.sourceNonce !== this.accounts[t.source].nonce + 1) throw new RealBadInvalidTransaction("Incorrect nonce for NFT Mint txFee", t);
                if (t.transactionFee > this.accounts[t.source].balance) throw new RealBadInvalidTransaction("Insufficient balance for NFT Mint txFee", t);
            }

            if (t.transactionFee > 0) {
                // Consume the money spent from this account and increment the nonce:
                this.accounts[t.source].nonce++;
                this.accounts[t.source].balance -= t.transactionFee;

                // Accept the transaction fee:
                this.transactionFees += t.transactionFee;
            }

            // Enjoy your shiny new NFT!
            this.nfts[nftid].nonce++;
            this.nfts[nftid].owner = t.txData.destination;
        }
    }

    // Try and apply a block to the current state
    // Returns a new RealBadLedgerState with the block applied if successful. Otherwise returns null.
    // Assumes that you've already checked that the block is VALID and that you approve of the mining reward amount!
    applyBlock(block) {
        // Make a deep copy of ourselves
        let s = this.clone();

        // First just check if the new block fits as the next block in the block chain
        if (block.prevHash !== this.lastBlockHash) return null;
        if (block.blockHeight !== this.lastBlockHeight + 1) return null;
        if (block.timestamp > Date.now() + 5*1000) return null; // No blocks from the (distant) future!
        if ((block.blockHeight !== 0) && (block.timestamp < this.lastBlockTimestamp)) return null; // Block timestamps must be monotonically increasing!

        s.lastBlockHash = block.hash;
        s.lastBlockHeight = block.blockHeight;
        let blockTimeDelta = (block.blockHeight === 0) ? 0 : block.timestamp - this.lastBlockTimestamp;
        s.lastBlockTimestamp = block.timestamp;

        // The difficulty metric is proportional to how low the hash is relative to the "zero difficulty" level.
        // The lower the hash as an integer, the bigger the difficulty.
        // When you sum this metric from two blocks, it is equivalent to having solved one block with twice the difficulty.
        s.totalDifficulty = this.totalDifficulty + RealBadBlock.difficultyMetric(s.lastBlockHash);

        // Check if they tried hard enough
        if (block.difficulty < this.nextBlockDifficulty) return null; // They didn't try and hit the target difficulty!

        // Re-target the difficulty based on how long this last block took to harvest
        // This uses a long-running "leaky integrator" IIR filter to low-pass filter the block gaps
        // until we reach an equilibrium. But everybody can easily compute the next result based only on
        // the last two timestamps!
        if (block.blockHeight === 0) {
            // The first 2 blocks get the same "genesis difficulty":
            s.nextBlockDifficulty = this.nextBlockDifficulty;
        }
        else {
            let errorRatio = blockTimeDelta / (15 * 1000); // Targeting 15 seconds per block
            // Exponential moving average (EMA) approximation
            // NOTE: We clamp the error ratio between 0 and 2 so that even if we get EXTREMELY long gaps we
            // don't adjust more than 1/N in either direction!
            errorRatio = Math.min(2, errorRatio);
            const N = 40; // Number of blocks of "smoothing" effect.
            s.nextBlockDifficulty = Math.round(this.nextBlockDifficulty * (1 + (1 - errorRatio) / N));
        }
        //console.log("Target difficulty after block " + s.lastBlockHeight.toString() + " is " + s.nextBlockDifficulty.toString());

        // Attempt to apply all the transactions
        try {
            block.transactions.forEach(t => {
                s.tryTransaction(t);
            });
        } catch (error) {
            console.error(error);
            return null;
        }

        // If successful, pay the mining rewards, including the sum of transactionFees from all transactions.
        if (!(block.rewardDestination in s.accounts)) s.accounts[block.rewardDestination] = new RealBadAccountState();
        s.accounts[block.rewardDestination].balance += block.miningReward + s.transactionFees;

        // Clear out transaction fees now that they are claimed
        s.transactionFees = 0;

        return s;
    }
}

// Keep track of a set of blocks and provide helper functions for identifying the longest chain, etc.
// NOTE: This is a LOCAL data structure and is not something that can be trusted if it is sent from elsewhere!
export class RealBadCache {
    _blocks = {};               // Key/value pairs with key as block hash and full state of system as the value
    _anticipatedBlocks = {};    // Key/value pairs with key as "prevHash" for blocks that don't exist in our cache yet, and value as a list of blocks waiting on them to arrive.
    _readyBlocks = [];          // List of hashes of blocks that are marked as "ready for processing state". They are pulled from _anticipatedBlocks once their ancestor is done processing.
    _bestBlock = null;          // Hash of the top-scoring block (i.e. the one with the deepest block chain "strength")
    _txPool = {};               // Pool of un-confirmed transactions that we can try add to a block.
    _recentConfirmedTx = {};    // Pool of recently confirmed transactions so we can avoid repeating them.
    minDifficulty = 256**2;     // Minimum difficulty level of blocks to allow into our cache.
    genesisDifficulty = 2e6;    // Difficulty of genesis blocks

    // Only accept good RealBadBlocks into our cache!
    async addBlock(block, source, minDifficulty=this.minDifficulty) {
        try {
            let hash = block.hash; // Save us the trouble of recomputing this tons of times!
            if (
                // Make sure its a valid sealed block
                (block instanceof RealBadBlock)
                && await block.isValid(minDifficulty)

                // Also make sure we haven't seen it before
                && !(hash in this._blocks)
            ) {
                // This is a new block, so create the info object with just the block and originator for now.
                this._blocks[hash] = {
                    block: block,
                    source: source,
                };

                // Check if this block is a genesis block or is linked to a block with a valid already-computed state
                if ((block.blockHeight === 0) || ((block.prevHash in this._blocks) && ("state" in this._blocks[block.prevHash]))) {
                    this._readyBlocks.push(hash);
                }
                else {
                    // Otherwise (can't compute the state yet), add this block to the "watch list" for later computation
                    // once we fill in the missing links.
                    if (!(block.prevHash in this._anticipatedBlocks)) this._anticipatedBlocks[block.prevHash] = [];
                    this._anticipatedBlocks[block.prevHash].push(hash);

                    if (this._readyBlocks.length) console.error("Expected _readyBlocks to be empty but there were " + this._readyBlocks.length);
                }

                // Update all the blocks in the ready list
                // Note that updating them might add new ones to the ready list by pulling them from _anticipatedBlocks.
                // We update those too until we run out.
                while (this._readyBlocks.length) {
                    let b = this.getBlock(this._readyBlocks.pop());
                    let h = b.hash;

                    if (b.blockHeight === 0) {
                        // Genesis block!
                        this._blocks[h].state = (new RealBadLedgerState(this.genesisDifficulty)).applyBlock(b);
                    }
                    // ASSUMPTION: Unless this is a genesis block, if it got into _readyBlocks then it's prevHash *is available* in our block cache!
                    else if (this._blocks[b.prevHash].state === null) {
                        // The previous state might be null, which means the chain was a bad state.
                        // This is fine - just propagates this to all children blocks. But that's still a "valid state".
                        this._blocks[h].state = null;
                    }
                    else {
                        // Yep, we can compute its new state based on its old one.
                        // The new state might be null if this block is bad.
                        this._blocks[h].state = this._blocks[b.prevHash].state.applyBlock(b);
                    }

                    // Now that we updated a block, see if this lets us update any others, which will have us repeat the loop again.
                    if (h in this._anticipatedBlocks) {
                        this._readyBlocks = this._readyBlocks.concat(this._anticipatedBlocks[h]);
                        delete this._anticipatedBlocks[h];
                    }

                    // Also now that we updated a block, see if it is now the "best block".
                    // This is the only place where we need to check for those updates, because we just added new state that we didn't have before.
                    // NOTE: The "best" chain is weighed based on total difficulty to create it, rather than block height!
                    //       Block height is just a human-readable metric and is used to detect genesis blocks.
                    let thisState = this.getState(h);
                    if (thisState !== null) {
                        let bestState = this.getState(this._bestBlock);
                        if (
                            (bestState === null) ||
                            (thisState.totalDifficulty > bestState.totalDifficulty)
                        ) {
                            this._updateBestBlock(h);
                        }
                    }
                }
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    // Whenever we have chosen a new "best" block, we need to update the transaction pools
    _updateBestBlock(newBest) {
        let oldBest = this._bestBlock;
        this._bestBlock = newBest;

        //TODO: Maybe find a more efficient method for this other
        // than "construct entire chains and compare them"!
        let oldChain = this.getChain(oldBest);
        let newChain = this.getChain(newBest);

        // These are "Removed" blocks. All transactions in them should be added to the tx pool
        let removedBlocks = oldChain.filter((b, i)=>!newChain.includes(b));
        removedBlocks.forEach(h=>{
            let b = this.getBlock(h);
            b.transactions.forEach(t=>{
                // Add them to txPool
                // NOTE: This can cause really really old transactions to reenter the pool. :shrug:
                this._txPool[t.txId] = t;

                // Remove from recently confirmed pool:
                delete this._recentConfirmedTx[t.txId];
            });
        });

        // These are "Added" blocks. All transactions in them should be removed from the tx pool
        let addedBlocks = newChain.filter((b, i)=>!oldChain.includes(b));
        addedBlocks.forEach(h=>{
            let b = this.getBlock(h);
            b.transactions.forEach(t=>{
                // Add them to recently confirmed pool, but only if they are "recent":
                if (
                    (t.timestamp < Date.now()) &&
                    ((Date.now() - t.timestamp) < 10*60*1000)
                ) {
                    this._recentConfirmedTx[t.txId] = t;
                }

                // Remove from txPool:
                delete this._txPool[t.txId];
            });
        });
    }

    // Return hash of the best block that we know about:
    get bestBlockHash() {
        return this._bestBlock;
    }

    getBlock(hash) {
        if (hash in this._blocks) {
            return this._blocks[hash].block;
        }
        return null;
    }

    getSource(hash) {
        if (hash in this._blocks) {
            return this._blocks[hash].source;
        }
        return null;
    }

    getState(hash) {
        if ((hash in this._blocks) && ("state" in this._blocks[hash])) {
            return this._blocks[hash].state;
        }
        return null;
    }

    // Return list with all blocks in the chain.
    // Stops when it runs out of previous blocks (or hits a genesis block).
    // Also stops early when it hits rootHash if that is part of the chain.
    // If `hash` is null-ish, then it will assume you want the top of the "best chain".
    getChain(hash, rootHash=null) {
        let chain = [];
        let currHash = hash ?? this.bestBlockHash;
        let currBlock = this.getBlock(currHash);

        while ((currHash !== rootHash) && (currBlock !== null)) {
            chain.unshift(currHash);

            // Stop when we hit genesis block
            if (currBlock.blockHeight === 0) break;

            currHash = currBlock.prevHash;
            currBlock = this.getBlock(currHash);
        }

        return chain;
    }

    // Validate and possibly add a transaction into the memory pool.
    // If the transaction is VALID and NEW, then return true.
    async addTransaction(tx) {
        try {
            if (
                // Make sure its a valid signed Tx
                (tx instanceof RealBadTransaction)
                && await tx.isValid()

                // Make sure it's timestamp isn't (too far) in the future or too far in the past
                && (tx.timestamp < Date.now() + 5*1000)
                && (Date.now() - tx.timestamp < 10*60*1000) // We only keep them for 10 minutes

                // Also quit early if we already have this one!
                && !(tx.txId in this._txPool)
                && !(tx.txId in this._recentConfirmedTx)
            ) {
                // This is a new transaction that we haven't seen recently!
                this._txPool[tx.txId] = tx;
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    // Create the next block for mining, based on the best known block plus
    // whatever valid transactions we can grab from the txPool
    makeMineableBlock(reward, destination) {
        let prevHash = this.bestBlockHash ?? '00'.repeat(32);

        // Get the info for the previous block that we're going to build upon.
        // NOTE: This might be null!
        let lastBlock = this.getBlock(prevHash);
        let lastBlockState = this.getState(prevHash) ?? new RealBadLedgerState(this.genesisDifficulty);
        let prevHeight = lastBlock?.blockHeight ?? -1;

        let b = new RealBadBlock();
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        b.difficulty = lastBlockState.nextBlockDifficulty;
        b.miningReward = reward;
        b.rewardDestination = destination;
        // Set the block's timestamp to at least _slightly_ ahead of the last block so that we
        // don't allow timestamps to go backward!
        b.timestamp = new Date(Number(lastBlock?.timestamp ?? Date.now()) + 1);

        // Try and add as many transactions to the block as will create a valid state
        let s = lastBlockState.clone();
        let poolCopy = [];
        for (const txId in this._txPool) {
            poolCopy.push(txId);
        }

        // Transactions only "work" in certain orders, so try our best to find that order.
        // We're going to loop until we don't get any new valid transactions
        // in a pass through the list
        while (true) {
            let newTransactions = [];
            poolCopy.forEach(txId=>{
                try {
                    s.tryTransaction(this._txPool[txId]);
                    newTransactions.push(txId);
                } catch (error) {
                    if (!(error instanceof RealBadInvalidTransaction)) {
                        throw error;
                    }
                }
            });

            // When we stop making progress, quit!
            if (newTransactions.length === 0) break;

            // Put the new transactions in the block
            b.transactions = b.transactions.concat(newTransactions.map(txId=>this._txPool[txId]));

            // Remove them from further consideration
            poolCopy = poolCopy.filter((txId, i)=>!newTransactions.includes(txId));
        }
        return b;
    }
}
