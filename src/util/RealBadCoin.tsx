// Data strucures and accessors for the RealBadCoin crypto currency

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { hexToBigint } from 'bigint-conversion';

export async function asyncEvery(arr, predicate) {
	for (let e of arr) {
		if (!await predicate(e)) return false;
	}
	return true;
};

export class RealBadCoinTransfer {
    type = "coin_transfer";
    destination = null; // Destination account ID (public key)
    amount = 0;         // Amount of RealBadCoin to transfer (floating point number)

    // Accept an object and attempt to convert it into a valid object of this type.
    // Return null if it doesn't work or if the resulting object is invalid.
    static coerce({
        type,
        destination,
        amount,
    }) {
        try {
            let r = new RealBadCoinTransfer();
            r.type = type;
            r.destination = destination;
            r.amount = amount;
            return r.isValid() ? r : null;
        } catch {
            return null;
        }
    }

    // Check the all fields have correct data types
    isValid() {
        try {
            return (
                this.type === "coin_transfer" &&

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

    // Accept an object and attempt to convert it into a valid object of this type.
    // Return null if it doesn't work or if the resulting object is invalid.
    static coerce({
        type,
        nftData,
        nftId,
    }) {
        try {
            let r = new RealBadNftMint();
            r.type = type;
            r.nftData = nftData;
            r.nftId = nftId;
            return r.isValid() ? r : null;
        } catch {
            return null;
        }
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

    // Accept an object and attempt to convert it into a valid object of this type.
    // Return null if it doesn't work or if the resulting object is invalid.
    static coerce({
        type,
        nftId,
        nftNonce,
        destination,
    }) {
        try {
            let r = new RealBadNftTransfer();
            r.type = type;
            r.nftId = nftId;
            r.nftNonce = nftNonce;
            r.destination = destination;
            return r.isValid() ? r : null;
        } catch {
            return null;
        }
    }

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
    sourceNonce = 0;        // Source account transaction nonce. Used to ensure transactions (including transactionFees) apply IN ORDER.
                            // Must be sequentially incrementing or transaction will be ignored.
                            // nonce is NOT REQURIED and NOT UPDATED if no coins are spent (txFee or transfer).
    timestamp = null;       // Time when the transaction is created. Miners will only propagate and process transactions during a certain time window.
    transactionFee = 0;     // Fee to be paid to the miner if this transaction is accepted into a block. Miners _might_ not accept transactions without fees!
    txData = null;          // The data portion of the transaction. One of the valid transaction object types must go here.
    txId = null;            // Hash of `[source, timestamp, transactionFee, txData]`. This serves as the unique ID for the transaction.
    signature = null;       // Signature of `txId` using the `source` account.

    // Compute the hash (txId) of this object
    hash() {
        let tx_val = JSON.stringify([
            this.source,
            this.sourceNonce,
            this.timestamp,
            this.transactionFee,
            this.txData,
        ]);
        return bytesToHex(sha256(tx_val));
    }

    // Accept an object and attempt to convert it into a valid object of this type.
    // Return null if it doesn't work or if the resulting object is invalid.
    static async coerce({
        source,
        sourceNonce,
        timestamp,
        transactionFee,
        txData,
        txId,
        signature,
    }) {
        try {
            let r = new RealBadTransaction();
            r.source = source;
            r.sourceNonce = sourceNonce;
            r.timestamp = new Date(timestamp);
            r.transactionFee = transactionFee;
            r.txId = txId;
            r.signature = signature;

            // Cute!
            r.txData =
                RealBadCoinTransfer.coerce(txData) ||
                RealBadNftMint.coerce(txData) ||
                RealBadNftTransfer.coerce(txData);

            return (await r.isValid()) ? r : null;
        } catch {
            return null;
        }
    }

    // Check the signature, hash, and confirm that all fields have correct non-null data types
    async isValid() {
        try {
            return (
                // The source ID is a 32-byte hex value
                (hexToBytes(this.source).length === 32) &&

                // The source nonce is an integer
                Number.isInteger(this.sourceNonce) &&

                // The timestamp is a Date object and contains a valid value
                (this.timestamp instanceof Date) &&
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

export class RealBadBlock {
    prevHash = '00'.repeat(32); // Hash of previous block. It is included in this block to form a block-chain.
    blockHeight = 0;            // How far we are "above" the genesis block. This is previous block's height + 1.
    timestamp = null;           // Time of last update to the block (prior to hash computation). This is mainly for display purposes.
    transactions = [];          // List of all transactions in the block
    miningReward = 100;         // Base reward claimed for mining this block
    rewardDestination = null;   // Miner's destination account ID (public key) for mining reward and transaction fees.
    difficulty = 256**2;        // Required difficulty for hash. Increasing this makes it harder to find a valid hash. For example, setting this to 256**N will require the top N bytes of the hash to be zeros.
    nonce = 0;                  // Number that can be changed to cause block's hash to vary

    // Compute the hash of this object
    // NOTE: We don't STORE the hash of the object inside the object because this
    //       isn't a signed object so we can't trust the validity of any hash that
    //       is TOLD to us! We have to check it ourselves!
    get hash() {
        let block_val = JSON.stringify(this);
        return bytesToHex(sha256(block_val));
    }

    static difficultyMetric(h) {
        // The difficulty metric is proportional to how low the hash is relative to the "zero difficulty" level.
        // The lower the hash as an integer, the bigger the difficulty.
        let zeroDifficulty = 1n << 256n;
        let hashAsInt = hexToBigint(h);
        return zeroDifficulty / hashAsInt;
    }

    isSealed(minDifficulty = 256**2) {
        let difficulty = Math.max(minDifficulty, this.difficulty);
        let maxHash = (1n << 256n) / BigInt(difficulty);
        let hashAsInt = hexToBigint(this.hash);
        return hashAsInt < maxHash;
    }

    // Increment the nonce and keep trying to find a hash that is valid.
    // Try up to num_attempts times before giving up.
    tryToSeal(num_attempts) {
        let maxHash = (1n << 256n) / BigInt(this.difficulty);
        this.timestamp = new Date();

        for (let i = 0; i < num_attempts; i++) {
            let hash = this.hash;
            let hashAsInt = hexToBigint(hash);
            if (hashAsInt < maxHash) {
                return this.isSealed(this.difficulty);
            }
            // We post-increment the nonce, so that repeated calls to this function don't waste any work.
            this.nonce++;
        }
        return false;
    }

    // Accept an object and attempt to convert it into a valid object of this type.
    // Return null if it doesn't work or if the resulting object is invalid.
    static async coerce({
        prevHash,
        blockHeight,
        timestamp,
        transactions,
        miningReward,
        rewardDestination,
        difficulty,
        nonce,
    }) {
        try {
            let r = new RealBadBlock();
            r.prevHash = prevHash;
            r.blockHeight = blockHeight;
            r.timestamp = new Date(timestamp);
            r.transactions = await Promise.all(transactions.map(async (t)=>{
                return await RealBadTransaction.coerce(t)
            }));
            r.miningReward = miningReward;
            r.rewardDestination = rewardDestination;
            r.difficulty = difficulty;
            r.nonce = nonce;

            return (await r.isValid()) ? r : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Check that the block is sealed properly and confirm that all fields have correct non-null data types.
    // This also checks that every Transaction in the block is correctly signed.
    // NOTE: This does NOT mean that the Transactions are ALLOWED and CORRECT. That has to
    //       be validated at the "block chain" level!
    async isValid(minDifficulty = 256**2) {
        try {
            return (
                // First check if the block is sealed, which will allow us to skip the work of detailed checks.
                // This helps prevent us from getting spammed by garbage blocks and causing a DoS, since we can
                // quickly check the seal but the seal takes a long time to make!
                this.isSealed(minDifficulty)
                // Note: isSealed() validates the hash quality, after which we don't care about "difficulty" or
                //       "nonce" so we can skip those fields from now on.

                // The previous block hash is a 32-byte hex value
                && (hexToBytes(this.prevHash).length === 32)

                // The blockHeight is a non-negative integer
                && Number.isInteger(this.blockHeight)
                && this.blockHeight >= 0

                // If the blockHeight is 0, the previous hash should be all 0's as well:
                && (
                    this.blockHeight > 0 ||
                    (this.prevHash === '00'.repeat(32))
                )

                // The timestamp is a Date object and contains a valid value
                && (this.timestamp instanceof Date)
                && !isNaN(this.timestamp.getTime())

                // All the transactions have valid signatures and contain correct data types
                && Array.isArray(this.transactions)
                && asyncEvery(this.transactions, async(t)=>{
                    return (t instanceof RealBadTransaction) && await t.isValid();
                })

                // The mining reward is a non-negative finite number
                && Number.isFinite(this.miningReward)
                && (this.miningReward >= 0)

                // The reward address is a 32-byte hex value
                && (hexToBytes(this.rewardDestination).length === 32)
            );
        } catch {
            return false;
        }
    }
}
