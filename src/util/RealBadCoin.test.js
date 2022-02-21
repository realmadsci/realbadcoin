// Import the data types for manipulating coin stuff
import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './RealBadCoin';

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
});


test('Mint an NFT', async()=>{
    // Make an NFT
    let nftMint = new RealBadTransaction();
    nftMint.txData = new RealBadNftMint();
    nftMint.txData.nftData = {hello: "world"}
    nftMint.txData.nftId = nftMint.txData.hash();

    // Seal it
    expect(await nftMint.isValid()).toBe(false);
    await nftMint.seal(this.state.id);
    expect(await nftMint.isValid()).toBe(true);
    console.log("nftMint = " + JSON.stringify(nftMint));
});

test('Transfer an NFT', async()=>{
    // Send it to a random "friend" to burn it:
    let nftBurn = new RealBadTransaction();
    nftBurn.txData = new RealBadNftTransfer();
    nftBurn.txData.destination = bytesToHex(window.crypto.getRandomValues(new Uint8Array(32)));
    nftBurn.txData.nftId = bytesToHex(window.crypto.getRandomValues(new Uint8Array(32)));

    // Seal it
    expect(await nftBurn.isValid()).toBe(false);
    await nftBurn.seal(this.state.id)
    expect(await nftBurn.isValid()).toBe(true);
});


test('Transfer some coins', async()=>{
    // Also burn some money by sending it to this "friend":
    let coinBurn = new RealBadTransaction();
    coinBurn.txData = new RealBadCoinTransfer();
    coinBurn.txData.destination = nftBurn.txData.destination;
    coinBurn.txData.amount = 1e6;
    await coinBurn.seal(this.state.id);
    console.log("coinBurn isValid = " + coinBurn.isValid());
    console.log("coinBurn = " + JSON.stringify(coinBurn));
});
