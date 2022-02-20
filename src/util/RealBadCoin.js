// Data strucures and accessors for the RealBadCoin crypto currency

// Base class for every transaction that occurs in the network
class RealBadTransaction {
    source = null;      // Source account ID (public key)
    timestamp = null;   // Time when the transaction is created. Miners will only propagate and process transactions during a certain time window.
    miner_fee = 0;      // Fee to be paid to the miner if this transaction is accepted into a block. Miners _might_ not accept transactions without fees!
    type = null;        // What type of transaction is this, anyway?
    data = {};          // The data portion of the transaction
    tx_id = null;       // Hash of `[source, timestamp, miner_fee, type, data]`. This serves as the unique ID for the transaction.
    sig = null;         // Signature of `tx_id` using the `source` account.
}

class RealBadCoinTransfer extends RealBadTransaction {
    type = "coin_transfer";
    data = {
        sourceNonce: 0,     // Incrementing number specifying transaction count for this account. Must be sequentially incrementing or transaction will be ignored.
        destination: null,  // Destination account ID (public key)
        amount: 0,          // Amount of RealBadCoin to transfer (floating point number)
    }
}

// Create a new NFT. The "source" account is the owner of the NFT until it is transferred via a RealBadNftTransfer.
// NOTE: These aren't free - like all transactions, you have to pay a miner's fee to make one!
class RealBadNftMint extends RealBadTransaction {
    type = "nft_mint";
    data = {
        nftData: null,      // Any data we want to "mint" as an NFT. Can be a string, and object, whatever...
        nftId: null,        // The ID (hash) of the `nftData` object. Must a globally unique number on the block chain (so nftData must be unique).
    }
}

class RealBadNftTransfer extends RealBadTransaction {
    type = "nft_transfer";
    data = {
        nftId: null,        // The ID (hash) of the NFT. Must already be minted before it can be transferred.
        nftNonce: 0,        // Incrementing number specifying transfer count for this NFT. Must be sequentually incrementing or the transaction will be ignored.
        destination: null,  // Destination account ID (public key) for the new owner of the NFT.
    }
}

