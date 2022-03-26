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
    coinBurn.sourceNonce = 1;
    expect(await coinBurn.isValid()).toBe(false);
    coinBurn.sourceNonce = 0;
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


test('Basic block sealing', ()=>{
    let block = new RealBadBlock();

    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    block.difficulty = 256**2;
    // Expect it to fail in the first 10 tries (pretty good odds).
    expect(block.tryToSeal(10)).toBe(false); //<---- I suppose this might fail every 65536/10 times :shrug:
    expect(block.nonce).toBe(10);
    expect(block.tryToSeal(1e6)).toBe(true);
    expect(block.isSealed()).toBe(true);

    // We requested 2 bytes of hash to be 0's, so make sure they are!
    expect(block.hash.slice(0,4)).toBe("0000");
});


test('Basic empty block', async ()=>{
    let b = new RealBadBlock();
    b.rewardDestination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    b.difficulty = 256**2;

    // Seal it
    expect(b.tryToSeal(1e6)).toBe(true);
    expect(b.isSealed()).toBe(true);

    // This should be a valid block now.
    expect(await b.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = await RealBadBlock.coerce(JSON.parse(JSON.stringify(b)));
    expect(await deepCopy.isValid()).toBe(true);
});


test('Non-empty block', async ()=>{
    let b = new RealBadBlock();
    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    b.difficulty = 256**2;
    b.rewardDestination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

    // Make a coin transfer
    let t1 = new RealBadTransaction();
    t1.txData = new RealBadCoinTransfer();
    t1.sourceNonce = 0;
    t1.txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    t1.txData.amount = 100;
    t1.transactionFee = 0.1;
    await t1.seal(new AccountMock());
    expect(await t1.isValid()).toBe(true);

    // Add it to the block
    b.transactions.push(t1);

    // Mint an NFT
    let t2 = new RealBadTransaction();
    t2.txData = new RealBadNftMint();
    t2.txData.nftData = {hello: "world"}
    t2.txData.nftId = t2.txData.hash();
    t2.transactionFee = 0.3;
    await t2.seal(new AccountMock());
    expect(await t2.isValid()).toBe(true);
    b.transactions.push(t2);

    // Transfer an NFT
    let t3 = new RealBadTransaction();
    t3.txData = new RealBadNftTransfer();
    t3.txData.destination = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    t3.txData.nftId = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    t3.transactionFee = 0.5;
    await t3.seal(new AccountMock())
    expect(await t3.isValid()).toBe(true);
    b.transactions.push(t3);

    // Seal it
    expect(b.tryToSeal(1e6)).toBe(true);
    expect(b.isSealed()).toBe(true);

    // This should be a valid block now.
    expect(await b.isValid()).toBe(true);

    // Deep copy is still valid:
    let deepCopy = await RealBadBlock.coerce(JSON.parse(JSON.stringify(b)));
    expect(await deepCopy.isValid()).toBe(true);
});
