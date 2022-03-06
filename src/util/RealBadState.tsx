// Import the data types for manipulating coin stuff
import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './RealBadCoin.tsx';

import { hexToBigint, bigintToHex } from 'bigint-conversion';

import { EventEmitter } from 'events';

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

    // This is the sum of all difficulty metrics for all blocks in the chain leading up to this state.
    // It is used to determine which chain represents the highest block.
    totalDifficulty = 0n;

    static coerce({
        accounts,
        nfts,
        transactionFees,
        lastBlockHash,
        lastBlockHeight,
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
        s.lastBlockHash = block.hash;
        s.lastBlockHeight = block.blockHeight;

        // The difficulty metric is proportional to how low the hash is relative to the "zero difficulty" level.
        // The lower the hash as an integer, the bigger the difficulty.
        // When you sum this metric from two blocks, it is equivalent to having solved one block with twice the difficulty.
        s.totalDifficulty = this.totalDifficulty + RealBadBlock.difficultyMetric(s.lastBlockHash);

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
    constructor() {
        this._blocks = {};               // Key/value pairs with key as block hash and full state of system as the value
        this._anticipatedBlocks = {};    // Key/value pairs with key as "prevHash" for blocks that don't exist in our cache yet, and value as a list of blocks waiting on them to arrive.
        this._readyBlocks = [];          // List of hashes of blocks that are marked as "ready for processing state". They are pulled from _anticipatedBlocks once their ancestor is done processing.
        this._bestBlock = null;          // Hash of the top-scoring block (i.e. the one with the deepest block chain "strength")
        this.minDifficulty = 256**2;     // Minimum difficulty level of blocks to allow into our cache.
        this._updateNotifier = new EventEmitter();
    }

    // Add subscribe/unsub options for tracking when new blocks arrive
    subscribe(callback) {
        this._updateNotifier.addListener('new_block', callback);
    }

    unsubscribe(callback) {
        this._updateNotifier.removeListener('new_block', callback);
    }

    // Only accept good RealBadBlocks into our cache!
    addBlock(block, source, wasRequested, minDifficulty=this.minDifficulty) {
        try {
            let hash = block.hash; // Save us the trouble of recomputing this tons of times!
            if (
                // Make sure its a valid sealed block
                (block instanceof RealBadBlock)
                && block.isValid(minDifficulty)

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
                        this._blocks[h].state = (new RealBadLedgerState()).applyBlock(b);
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
                            this._bestBlock = h;
                        }
                    }
                }
                this._updateNotifier.emit('new_block', hash, wasRequested);
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
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
    getChain(hash) {
        let chain = [];
        let currHash = hash;
        let currBlock = this.getBlock(currHash);

        while (currBlock !== null) {
            chain.unshift(currHash);

            // Stop when we hit genesis block
            if (currBlock.blockHeight === 0) break;

            currHash = currBlock.prevHash;
            currBlock = this.getBlock(currHash);
        }

        return chain;
    }
}
