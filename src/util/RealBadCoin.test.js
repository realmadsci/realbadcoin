// Import the data types for manipulating coin stuff
import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './RealBadCoin';

import * as ed from '@noble/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

// Get crypto.getRandomValues in node.js environment:
import { webcrypto as crypto } from 'crypto';


test('Construct a Coin Transfer Data Block', ()=>{
    let txData = new RealBadCoinTransfer();
    expect(txData.isValid()).toBe(false);
    txData.sourceNonce = 0;
    expect(txData.isValid()).toBe(false);
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(false);
    txData.amount = 0.1;
    expect(txData.isValid()).toBe(true);

    // "wrong-length destination" breaks the block
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(31)));
    expect(txData.isValid()).toBe(false);
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(33)));
    expect(txData.isValid()).toBe(false);
    txData.destination = null;
    expect(txData.isValid()).toBe(false);

    // "Bad characters destination" breaks the block but doesn't raise exceptions!
    txData.destination = crypto.getRandomValues(new Uint8Array(32));
    expect(txData.isValid()).toBe(false);

    // Quick sanity check
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(true);

    // Don't bother us with 0-transfers!
    txData.amount = 0;
    expect(txData.isValid()).toBe(false);
    // Also no negative transfers!
    txData.amount = -1;
    expect(txData.isValid()).toBe(false);
    // Also no bogus transfers!
    txData.amount = NaN;
    expect(txData.isValid()).toBe(false);
    txData.amount = Infinity;
    expect(txData.isValid()).toBe(false);
    txData.amount = -Infinity;
    expect(txData.isValid()).toBe(false);
    txData.amount = null;
    expect(txData.isValid()).toBe(false);
    txData.amount = undefined;
    expect(txData.isValid()).toBe(false);

    // But giant transfers are fine
    txData.amount = 3.14159e100;
    expect(txData.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = RealBadCoinTransfer.coerce(JSON.parse(JSON.stringify(txData)));
    expect(deepCopy.isValid()).toBe(true);
});



test('Construct an NFT Minting Data Block', ()=>{
    let txData = new RealBadNftMint();
    txData.nftData = {hello: "world"}
    txData.nftId = txData.hash();
    expect(txData.isValid()).toBe(true);

    // Any change breaks the NFT!
    txData.nftData = {goodbye: "world"};
    expect(txData.isValid()).toBe(false);

    // Until we re-hash it:
    txData.nftId = txData.hash();
    expect(txData.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = RealBadNftMint.coerce(JSON.parse(JSON.stringify(txData)));
    expect(deepCopy.isValid()).toBe(true);
});

test('Null NFT Minting Data Block is not valid', ()=>{
    // Even valid signed "null" NFT is not allowed:
    let txData = new RealBadNftMint();
    txData.nftData = null
    txData.nftId = txData.hash();
    expect(txData.isValid()).toBe(false);
});

test('Construct an NFT Transfer Data Block', ()=>{
    let txData = new RealBadNftTransfer();
    expect(txData.isValid()).toBe(false);
    txData.nftNonce = 0;
    expect(txData.isValid()).toBe(false);
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(false);
    txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(true);

    // "wrong-length destination" breaks the block
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(31)));
    expect(txData.isValid()).toBe(false);
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(33)));
    expect(txData.isValid()).toBe(false);
    txData.destination = null;
    expect(txData.isValid()).toBe(false);

    // "Bad characters destination" breaks the block but doesn't raise exceptions!
    txData.destination = crypto.getRandomValues(new Uint8Array(32));
    expect(txData.isValid()).toBe(false);

    // Quick sanity check
    txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(true);

    // Repeat the same tests with nftId:
    txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(31)));
    expect(txData.isValid()).toBe(false);
    txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(33)));
    expect(txData.isValid()).toBe(false);
    txData.nftId = null;
    expect(txData.isValid()).toBe(false);
    txData.nftId = crypto.getRandomValues(new Uint8Array(32));
    expect(txData.isValid()).toBe(false);
    // Sanity check
    txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(txData.isValid()).toBe(true);

    // Nonce must be an integer!
    txData.nftNonce = NaN;
    expect(txData.isValid()).toBe(false);
    txData.nftNonce = null;
    expect(txData.isValid()).toBe(false);
    txData.nftNonce = undefined;
    expect(txData.isValid()).toBe(false);
    txData.nftNonce = 3.14159;
    expect(txData.isValid()).toBe(false);
    txData.nftNonce = 1e10;
    expect(txData.isValid()).toBe(true);

    // Final sanity check
    txData.nftNonce = 0;
    expect(txData.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = RealBadNftTransfer.coerce(JSON.parse(JSON.stringify(txData)));
    expect(deepCopy.isValid()).toBe(true);
});




// We need a pubkey/privkey pair for sealing transactions:
class AccountMock {
    constructor() {
        this._privKey = null;
        this._pubKey = null;

        // Trigger the initialization to occur the first time anybody asks for anything
        this._initialized = this._initialize();
    }

    async _initialize() {
        // We don't already have a private key for this browser, so make one:
        this._privKey = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

        // Compute and set the public key
        this._pubKey = await ed.getPublicKey(this._privKey);
    }

    async getPubKeyHex() {
        await this._initialized;
        return bytesToHex(this._pubKey);
    }

    async getPrivKeyHex() {
        await this._initialized;
        return this._privKey;
    }

    async sign(msg) {
        await this._initialized;
        const sig = await ed.sign(msg, this._privKey);

        // Return the signature:
        return sig;
    }
}


test('Mint an NFT', async()=>{
    // Make an NFT
    let nftMint = new RealBadTransaction();
    nftMint.txData = new RealBadNftMint();
    nftMint.txData.nftData = {hello: "world"}
    nftMint.txData.nftId = nftMint.txData.hash();

    // Seal it
    expect(await nftMint.isValid()).toBe(false);
    await nftMint.seal(new AccountMock());
    expect(await nftMint.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = await RealBadTransaction.coerce(JSON.parse(JSON.stringify(nftMint)));
    expect(await deepCopy.isValid()).toBe(true);
});

test('Transfer an NFT', async()=>{
    // Send it to a random "friend" to burn it:
    let nftBurn = new RealBadTransaction();
    nftBurn.txData = new RealBadNftTransfer();
    nftBurn.txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    nftBurn.txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(await nftBurn.txData.isValid()).toBe(true);

    // Seal it
    expect(await nftBurn.isValid()).toBe(false);
    await nftBurn.seal(new AccountMock())
    expect(await nftBurn.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = await RealBadTransaction.coerce(JSON.parse(JSON.stringify(nftBurn)));
    expect(await deepCopy.isValid()).toBe(true);
});


test('Transfer some coins', async()=>{
    // Also burn some money by sending it to this "friend":
    let coinBurn = new RealBadTransaction();
    coinBurn.txData = new RealBadCoinTransfer();
    coinBurn.txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    coinBurn.txData.amount = 1e6;
    expect(coinBurn.txData.isValid()).toBe(true);

    // Seal it
    expect(await coinBurn.isValid()).toBe(false);
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = await RealBadTransaction.coerce(JSON.parse(JSON.stringify(coinBurn)));
    expect(await deepCopy.isValid()).toBe(true);
});


test('Verify Transactions outer fields', async()=>{
    // First make a good transaction before we mess with it:
    let coinBurn = new RealBadTransaction();
    let txData = new RealBadCoinTransfer();
    let dest = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    coinBurn.txData = txData;
    coinBurn.txData.destination = dest;
    coinBurn.txData.amount = 1;
    expect(coinBurn.txData.isValid()).toBe(true);
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(true);

    // Any messing will break the signature!
    coinBurn.txData.amount = 2;
    // The inner data is still legit
    expect(coinBurn.txData.isValid()).toBe(true);
    // But the signature fails!
    expect(await coinBurn.isValid()).toBe(false);
    // But if you talk nicely and walk it back we can be friends again:
    coinBurn.txData.amount = 1;
    expect(await coinBurn.isValid()).toBe(true);

    // Can't change destination:
    coinBurn.txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    expect(coinBurn.txData.isValid()).toBe(true);
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.txData.destination = dest;
    expect(await coinBurn.isValid()).toBe(true);

    // Can't change nonce:
    coinBurn.txData.sourceNonce = 1;
    expect(coinBurn.txData.isValid()).toBe(true);
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.txData.sourceNonce = 0;
    expect(await coinBurn.isValid()).toBe(true);

    // Can't change the time:
    let oldDate = coinBurn.timestamp;
    coinBurn.timestamp = new Date();
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.timestamp = oldDate;
    expect(await coinBurn.isValid()).toBe(true);

    // Can't change transaction fee
    coinBurn.transactionFee = 1;
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.transactionFee = 0;
    expect(await coinBurn.isValid()).toBe(true);

    // No infinite or negative transaction fees!
    coinBurn.transactionFee = -1;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(false);

    coinBurn.transactionFee = -Infinity;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(false);

    coinBurn.transactionFee = Infinity;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(false);

    coinBurn.transactionFee = NaN;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(false);

    coinBurn.transactionFee = null;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(false);

    coinBurn.transactionFee = 1;
    await coinBurn.seal(new AccountMock());
    expect(await coinBurn.isValid()).toBe(true);

    // No mucking around with txId:
    let oldHash = coinBurn.txId;
    coinBurn.txId = coinBurn.txId.replace('a', 'b');
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.txId = oldHash.slice(31);
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.txId = oldHash;
    expect(await coinBurn.isValid()).toBe(true);
});
