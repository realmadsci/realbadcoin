// Import the data types for manipulating coin stuff
import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './RealBadCoin';

import {
    RealBadCache,
    RealBadInvalidTransaction,
    RealBadLedgerState,
} from './RealBadState';

import * as ed from '@noble/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

// Get crypto.getRandomValues in node.js environment:
import { webcrypto as crypto } from 'crypto';

async function asyncForEach(arr, predicate) {
	for (let e of arr) {
		await predicate(e);
	}
};

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

test('Empty genesis block provides $$ to creator', async ()=>{
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let reward = 12345;

    let b = new RealBadBlock();
    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    b.difficulty = 256**2;
    b.miningReward = reward;
    b.rewardDestination = id;

    // Seal it
    expect(b.tryToSeal(1e6)).toBe(true);
    expect(b.isSealed()).toBe(true);
    expect(await b.isValid()).toBe(true);

    // Apply it to the ledger and see if we get some $$
    let blank = new RealBadLedgerState(0); // Just ignore difficulty target!
    let s = blank.applyBlock(b);
    expect(s.accounts[id].balance).toBe(reward);
    expect(s.accounts[id].nonce).toBe(0);
});


test('Transfers', async ()=>{
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let reward = 12345;
    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    let difficulty = 256**2;

    let b = new RealBadBlock();
    b.difficulty = difficulty;
    b.miningReward = reward;
    b.rewardDestination = id;

    // Seal it
    expect(b.tryToSeal(1e6)).toBe(true);
    expect(b.isSealed()).toBe(true);
    expect(await b.isValid()).toBe(true);

    // Apply it to the ledger and see if we get some $$
    let blank = new RealBadLedgerState(0); // Just ignore difficulty target!
    let s = blank.applyBlock(b);
    expect(s.accounts[id].balance).toBe(reward);
    expect(s.accounts[id].nonce).toBe(0);

    // Create a second block and send some money to a "friend"
    let a2 = new AccountMock();
    let id2 = await a2.getPubKeyHex();

    // a2 tries to mint an NFT but can't pay for it yet:
    let t = new RealBadTransaction();
    t.txData = new RealBadNftMint();
    t.txData.nftData = {"Am I broke?": true}
    t.txData.nftId = t.txData.hash();
    t.transactionFee = 0.001;
    await t.seal(a2);
    expect(await t.isValid()).toBe(true);

    // The ledger can tell you right away that this isn't going to work!
    expect(()=>s.tryTransaction(t, true)).toThrow(RealBadInvalidTransaction);

    // But let's go ahead and try it anyway
    let b2 = new RealBadBlock();
    b2.prevHash = b.hash;
    b2.blockHeight = b.blockHeight + 1;
    b2.difficulty = difficulty;
    b2.miningReward = reward;
    b2.rewardDestination = id2;
    b2.transactions.push(t);
    expect(b2.tryToSeal(1e6)).toBe(true);
    expect(b2.isSealed()).toBe(true);
    expect(await b2.isValid()).toBe(true);

    // It made a valid block, but the ledger ain't going to put up with it!
    expect(s.applyBlock(b2).errors.length).toBeGreaterThan(0);

    // Both members mint NFTs, but only the rich one pays for theirs (the poor guy
    // is mining the block themselves, so they don't need to pay :shrug:)
    t.transactionFee = 0;
    await t.seal(a2);
    expect(await t.isValid()).toBe(true);
    {
        // The transaction should be accepted this time!
        let temp = s.clone();
        temp.tryTransaction(t, true);
        expect(temp.nfts[t.txData.nftId].owner === id2);
    }

    // Rich guy's turn
    let t2 = new RealBadTransaction();
    t2.txData = new RealBadNftMint();
    t2.txData.nftData = {"Am I broke?": false}
    t2.txData.nftId = t2.txData.hash();
    t2.transactionFee = 0.001;
    t2.sourceNonce = 1;
    await t2.seal(a);
    expect(await t2.isValid()).toBe(true);

    // Dump them both in the block and let 'er rip!
    b2.transactions = []
    b2.transactions.push(t, t2);
    expect(b2.tryToSeal(1e6)).toBe(true);
    expect(b2.isSealed()).toBe(true);
    expect(await b2.isValid()).toBe(true);

    // This one should be good to go
    let s2 = s.applyBlock(b2);
    expect(s2.accounts[id2].balance).toBe(reward + t2.transactionFee);
    expect(s2.accounts[id].balance).toBe(s.accounts[id].balance - t2.transactionFee);
    expect(s2.accounts[id].nonce).toBe(1);

    expect(s2.nfts[t.txData.nftId].owner).toBe(id2);
    expect(s2.nfts[t2.txData.nftId].owner).toBe(id);

    // Now they both pay each other and swap NFTs
    let t3 = new RealBadTransaction();
    t3.txData = new RealBadCoinTransfer();
    t3.txData.destination = id2;
    t3.txData.amount = 111;
    t3.transactionFee = 3;
    t3.sourceNonce = 2;
    await t3.seal(a);
    expect(await t3.isValid()).toBe(true);

    let t4 = new RealBadTransaction();
    t4.txData = new RealBadCoinTransfer();
    t4.txData.destination = id;
    t4.txData.amount = 111;
    t4.transactionFee = 4;
    t4.sourceNonce = 1;
    await t4.seal(a2);
    expect(await t4.isValid()).toBe(true);

    let t5 = new RealBadTransaction();
    t5.txData = new RealBadNftTransfer();
    t5.txData.destination = id;
    t5.txData.nftId = t.txData.nftId;
    t5.txData.amount = 111;
    t5.transactionFee = 5;
    t5.sourceNonce = 2;
    await t5.seal(a2);
    expect(await t5.isValid()).toBe(true);

    let t6 = new RealBadTransaction();
    t6.txData = new RealBadNftTransfer();
    t6.txData.destination = id2;
    t6.txData.nftId = t2.txData.nftId;
    t6.txData.amount = 222;
    t6.transactionFee = 7;
    t6.sourceNonce = 3;
    await t6.seal(a);
    expect(await t6.isValid()).toBe(true);

    // But let's go ahead and try it anyway
    let b3 = new RealBadBlock();
    b3.difficulty = difficulty;
    b3.miningReward = reward;
    b3.rewardDestination = id;
    b3.transactions.push(t3, t4, t5, t6);
    expect(b3.tryToSeal(1e6)).toBe(true);
    expect(b3.isSealed()).toBe(true);
    expect(await b3.isValid()).toBe(true);

    let s3 = s2.applyBlock(b3);
    // Oops, we forgot to "block chain" that one correctly, so it shouldn't work!
    expect(s3.errors.length).toBeGreaterThan(0);

    // Let's put the hash in and then re-seal:
    b3.prevHash = b2.hash;
    b3.blockHeight = 1;
    expect(b3.tryToSeal(1e6)).toBe(true);
    expect(b3.isSealed()).toBe(true);
    expect(await b3.isValid()).toBe(true);
    // Still nope. Also need the blockHeight to align correctly!
    s3 = s2.applyBlock(b3);
    expect(s3.errors.length).toBeGreaterThan(0);

    // Ok it should work this time
    b3.blockHeight = b2.blockHeight + 1;
    expect(b3.tryToSeal(1e6)).toBe(true);
    expect(b3.isSealed()).toBe(true);
    expect(await b3.isValid()).toBe(true);

    s3 = s2.applyBlock(b3);
    expect(s3.nfts[t.txData.nftId].owner).toBe(id);
    expect(s3.nfts[t.txData.nftId].nonce).toBe(1);
    expect(s3.nfts[t2.txData.nftId].owner).toBe(id2);
    expect(s3.nfts[t2.txData.nftId].nonce).toBe(1);

    expect(s3.accounts[id].nonce).toBe(3);
    expect(s3.accounts[id2].nonce).toBe(2);
    expect(s3.accounts[id2].balance).toBe(s2.accounts[id2].balance + t3.txData.amount - t4.txData.amount - t4.transactionFee - t5.transactionFee);
    expect(s3.accounts[id].balance).toBe(s2.accounts[id].balance + reward - t3.txData.amount + t4.txData.amount + t4.transactionFee + t5.transactionFee);
});

test('Check accumulation of difficulty', async ()=>{
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let reward = 12345;
    // Pick an easy target to save testing time, but hard enough that
    // it isn't likely to happen by accident.
    let difficulty = 256**2;

    // Create a 2-block chain
    let b1 = new RealBadBlock();
    b1.difficulty = difficulty;
    b1.miningReward = reward;
    b1.rewardDestination = id;
    expect(b1.tryToSeal(1e6)).toBe(true);
    expect(b1.isSealed()).toBe(true);
    expect(await b1.isValid()).toBe(true);

    let b2 = new RealBadBlock();
    b2.difficulty = difficulty;
    b2.miningReward = reward;
    b2.rewardDestination = id;
    b2.prevHash = b1.hash;
    b2.blockHeight = b1.blockHeight + 1;
    expect(b2.tryToSeal(1e6)).toBe(true);
    expect(b2.isSealed()).toBe(true);
    expect(await b2.isValid()).toBe(true);

    // Figure out the state at the end:
    let blank = new RealBadLedgerState(0); // Just ignore difficulty target!
    let s1 = blank.applyBlock(b1);
    let s2 = s1.applyBlock(b2);

    expect(s1.totalDifficulty).toBeGreaterThanOrEqual(difficulty);
    expect(s2.totalDifficulty).toBeGreaterThanOrEqual(difficulty);
    expect(s2.totalDifficulty).toBeGreaterThanOrEqual(s1.totalDifficulty);
    expect(s2.totalDifficulty).toBeGreaterThanOrEqual(2*difficulty);
});


test('May the best chain win', async ()=>{
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let reward = 100;
    // Prove that 2 blocks at twice as hard is more valuable than 3 blocks.
    let difficulty1 = 256**1;
    let difficulty2 = 256**2;

    // Store all the blocks into a cache
    let c = new RealBadCache();
    c.genesisDifficulty = 0; // Just ignore difficulty target!

    // First chain of 3 "easy" blocks:
    let prevHash = "00".repeat(32)
    let prevHeight = -1;
    for (let i = 0; i < 3; i++) {
        let b = new RealBadBlock();
        b.difficulty = difficulty1;
        b.miningReward = reward;
        b.rewardDestination = id;
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        expect(b.tryToSeal(1e6)).toBe(true);
        expect(b.isSealed(difficulty1)).toBe(true);
        expect(await b.isValid(difficulty1)).toBe(true);

        // Add it to our cache
        await c.addBlock(b, null, difficulty1);

        prevHash = b.hash;
        prevHeight = b.blockHeight;
    }

    let best1 = c.bestBlockHash;

    // Second chain of 2 "hard" blocks
    prevHash = "00".repeat(32)
    prevHeight = -1;
    for (let i = 0; i < 2; i++) {
        let b = new RealBadBlock();
        b.difficulty = difficulty2;
        b.miningReward = reward;
        b.rewardDestination = id;
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        expect(b.tryToSeal(1e6)).toBe(true);
        expect(b.isSealed()).toBe(true);
        expect(await b.isValid()).toBe(true);

        // Add it to our cache
        await c.addBlock(b);

        prevHash = b.hash;
        prevHeight = b.blockHeight;
    }
    let best2 = c.bestBlockHash;

    expect(best1 === best2).toBe(false);
    expect(c.getState(best2).totalDifficulty).toBeGreaterThanOrEqual(c.getState(best1).totalDifficulty);

    expect(c.getChain(best1).length).toBe(3);
    expect(c.getChain(best2).length).toBe(2);
});


test('Insert all blocks backwards still processes correctly', async ()=>{
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let reward = 100;
    let difficulty = 256**1;

    // Store all the blocks into a list so we can insert them into cache
    // out of order later.
    let l = [];

    // Build chain of 9 "easy" blocks.
    let prevHash = "00".repeat(32)
    let prevHeight = -1;
    for (let i = 0; i < 9; i++) {
        let b = new RealBadBlock();
        b.difficulty = difficulty;
        b.miningReward = reward;
        b.rewardDestination = id;
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        expect(b.tryToSeal(1e6)).toBe(true);
        expect(b.isSealed(difficulty)).toBe(true);
        expect(await b.isValid(difficulty)).toBe(true);

        // Add it to our list
        l.push(b);

        prevHash = b.hash;
        prevHeight = b.blockHeight;
    }

    // Dump the list into the cache in reverse order
    let c = new RealBadCache();
    c.genesisDifficulty = 0; // Just ignore difficulty target!
    await asyncForEach(l.reverse(), async b=>{
        expect(c.bestBlockHash).toBe(null);
        await c.addBlock(b, null, difficulty);
    });
    l.reverse(); // Flip it back forward.
    expect(c.bestBlockHash).toBe(l[8].hash);

    // Dump the list into the cache in *almost* reverse order
    let c2 = new RealBadCache();
    c2.genesisDifficulty = 0; // Just ignore difficulty target!
    await c2.addBlock(l[0], null, difficulty);
    expect(c2.bestBlockHash).toBe(l[0].hash);
    await c2.addBlock(l[1], null, difficulty);
    await asyncForEach(l.slice(2).reverse(), async b=>{
        expect(c2.bestBlockHash).toBe(l[1].hash);
        await c2.addBlock(b, null, difficulty);
    });

    expect(c2.bestBlockHash).toBe(l[8].hash);
});



test('Tracking Confirmations and Reverse Child List', async ()=>{
    const a = new AccountMock();
    const id = await a.getPubKeyHex();
    const reward = 100;
    const difficulty = 256**1;

    // Store all the blocks into a list so we can branch off of them later
    let l1 = [];

    // Build chain of 12 blocks.
    let prevHash = "00".repeat(32)
    let prevHeight = -1;
    for (let i = 0; i < 12; i++) {
        let b = new RealBadBlock();
        b.difficulty = difficulty;
        b.miningReward = reward;
        b.rewardDestination = id;
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        expect(b.tryToSeal(1e6)).toBe(true);
        expect(b.isSealed(difficulty)).toBe(true);
        expect(await b.isValid(difficulty)).toBe(true);

        // Add it to our list
        l1.push(b);

        prevHash = b.hash;
        prevHeight = b.blockHeight;
    }

    // Build another chain branching off of the third other one...
    let l2 = [];
    prevHash = l1[2].hash;
    prevHeight = l1[2].blockHeight;
    for (let i = 0; i < 4; i++) {
        let b = new RealBadBlock();
        b.difficulty = difficulty;
        b.miningReward = reward;
        b.rewardDestination = id;
        b.prevHash = prevHash;
        b.blockHeight = prevHeight + 1;
        expect(b.tryToSeal(1e6)).toBe(true);
        expect(b.isSealed(difficulty)).toBe(true);
        expect(await b.isValid(difficulty)).toBe(true);

        // Add it to our list
        l2.push(b);

        prevHash = b.hash;
        prevHeight = b.blockHeight;
    }

    // Dump the lists into the cache in a slightly strange order
    let c = new RealBadCache();
    c.genesisDifficulty = 0; // Just ignore difficulty target!
    await asyncForEach(l2.concat(l1), async b=>{
        await c.addBlock(b, null, difficulty);
    });
    // The longer chain should "win"
    expect(c.bestBlockHash).toBe(l1[11].hash);

    // The "children" properties should be a "reverse linked list":
    for (let i = 0; i < 3; i++) {
        expect(c.getState(l2[i].hash).children).toStrictEqual([l2[i+1].hash]);
    }
    expect(c.getState(l2[3].hash).children).toStrictEqual([]);

    for (let i = 0; i < 11; i++) {
        if (i === 2) {
            expect(c.getState(l1[i].hash).children).toStrictEqual([
                l2[0].hash,
                l1[i+1].hash,
            ]);
        }
        else {
            expect(c.getState(l1[i].hash).children).toStrictEqual([l1[i+1].hash]);
        }
    }
    expect(c.getState(l1[11].hash).children).toStrictEqual([]);

});
