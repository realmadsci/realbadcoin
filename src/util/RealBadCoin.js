// Data strucures and accessors for the RealBadCoin crypto currency

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

export class RealBadCoinTransfer {
    type = "coin_transfer";
    sourceNonce = 0;    // Incrementing number specifying transaction count for this account. Must be sequentially incrementing or transaction will be ignored.
    destination = null; // Destination account ID (public key)
    amount = 0;         // Amount of RealBadCoin to transfer (floating point number)

    // Check the all fields have correct data types
    isValid() {
        try {
            return (
                this.type === "coin_transfer" &&

                // The source nonce is an integer
                Number.isInteger(this.sourceNonce) &&

                // The destination is a 32-byte hex value
                (hexToBytes(this.destination).length === 32) &&

                // The amount is a finite positive number
                Number.isFinite(this.amount) &&
                (this.amount > 0)
            );
        } catch {
            return false;
        }
    }
}

// Create a new NFT. The "source" account is the owner of the NFT until it is transferred via a RealBadNftTransfer.
// NOTE: These aren't free - like all transactions, you have to pay a miner's fee to make one!
export class RealBadNftMint {
    type = "nft_mint";
    nftData = null;     // Any data we want to "mint" as an NFT. Can be a string, and object, whatever...
    nftId = null;       // The ID (hash) of the `nftData` object. Must a globally unique number on the block chain (so nftData must be unique).

    // Compute the hash (txId) of this object
    hash() {
        return bytesToHex(sha256(JSON.stringify(this.nftData)));
    }

    // Check the all fields have correct data types
    isValid() {
        try {
            return (
                this.type === "nft_mint" &&

                // The NFT ID is a 32-byte hex value and it matches the hash
                (hexToBytes(this.nftId).length === 32) &&
                this.nftId === this.hash() &&

                // The data isn't null and can be turned into a JSON string
                this.nftData !== null &&
                JSON.stringify(this.nftData).length > 0
            );
        } catch {
            return false;
        }
    }
}

export class RealBadNftTransfer {
    type = "nft_transfer";
    nftId = null;       // The ID (hash) of the NFT. Must already be minted before it can be transferred.
    nftNonce = 0;       // Incrementing number specifying transfer count for this NFT. Must be sequentually incrementing or the transaction will be ignored.
    destination = null; // Destination account ID (public key) for the new owner of the NFT.

    // Check the all fields have correct data types
    isValid() {
        try {
            return (
                this.type === "nft_transfer" &&

                // The NFT nonce is an integer
                Number.isInteger(this.nftNonce) &&

                // The NFT ID is a 32-byte hex value
                (hexToBytes(this.nftId).length === 32) &&

                // The destination account is a 32-byte hex value
                (hexToBytes(this.destination).length === 32)
            );
        } catch {
            return false;
        }
    }
}

// Required base fields for every transaction that occurs in the network
export class RealBadTransaction {
    source = null;          // Source account ID (public key)
    timestamp = null;       // Time when the transaction is created. Miners will only propagate and process transactions during a certain time window.
    transactionFee = 0;     // Fee to be paid to the miner if this transaction is accepted into a block. Miners _might_ not accept transactions without fees!
    txData = null;          // The data portion of the transaction. One of the valid transaction object types must go here.
    txId = null;            // Hash of `[source, timestamp, transactionFee, txData]`. This serves as the unique ID for the transaction.
    signature = null;       // Signature of `txId` using the `source` account.

    // Compute the hash (txId) of this object
    hash() {
        let tx_val = JSON.stringify([
            this.source,
            this.timestamp,
            this.transactionFee,
            this.txData,
        ]);
        return bytesToHex(sha256(tx_val));
    }

    // Check the signature, hash, and confirm that all fields have correct non-null data types
    async isValid() {
        try {
            return (
                // The source ID is a 32-byte hex value
                (hexToBytes(this.source).length === 32) &&

                // The timestamp is a Date object and contains a valid value
                Object.prototype.toString.call(this.timestamp) === '[object Date]' &&
                !isNaN(this.timestamp.getTime()) &&

                // The transaction fee is a non-negative finite number
                Number.isFinite(this.transactionFee) &&
                (this.transactionFee >= 0) &&

                // The transaction internal data is valid
                this.txData.isValid() &&

                // The hash is a 32-byte hex value and it matches the actual hash of this object
                (hexToBytes(this.txId).length === 32) &&
                (this.hash() === this.txId) &&

                // The signature is a 64-byte hex value and the signature is a valid sig of the hash from the source
                (hexToBytes(this.signature).length === 64) &&
                await ed.verify(this.signature, this.txId, this.source)
            );
        } catch {
            return false;
        }
    }

    // Seal the transaction, setting the source and timestamp and signing it with the account object provided.
    // The account object needs to provide an `async getPubKeyHex()` and `async sign()` function
    async seal(account) {
        this.source = await account.getPubKeyHex();
        this.timestamp = new Date();
        this.txId = this.hash();
        this.signature = bytesToHex(await account.sign(this.txId));
    }
}

// Extract a concrete RealBadTransaction child class from JSON string
// This is the reverse of RealBadTransaction.toJSON() function.
function parseTransaction(str) {
}

export class RealBadBlock {
    data = {
        prevBlockHash: null,        // Hash of previous block. It is included in this block to form a block-chain.
        blockHeight: 0,             // How far we are "above" the genesis block. This is previous block's height + 1.
        timestamp: null,            // Time of last update to the block (prior to hash computation). This is mainly for display purposes.
        transactions: [],           // List of all transactions in the block
        miningReward: 100,          // Base reward claimed for mining this block
        transactionFeeTotal: 0,     // Total of all miner_fee values for every transaction in this block
        rewardDestination: null,    // Miner's destination account ID (public key) for mining reward and transaction fees.
        changedAccounts: {},        // List of updated (Account ID, Balance) pairs for accounts involved in any transactions in this block.
        changedNfts: {},            // List of (NFT ID, Owner Account ID)  pairs for any NFTs involved in any transactions in this block.
        maxHash: null,              // Maximum allowable blockHash value. Setting this lower sets the difficulty level of finding a valid hash.
        nonce: 0,
    }
    blockHash = null;               // Hash of the data section of the block. This must be less than  This is used as the block ID as well.
}
