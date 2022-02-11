
var _sha = require("@noble/hashes/sha256");

/////////////////////////////////// sha256 hashes!
console.log((0, _sha.sha256)(new Uint8Array([1, 2, 3]))); //// small utility method that converts bytes to hex



/////////////////////////////////// secp256k1 signatures!
// If you're using single file, use global variable instead:
// nobleSecp256k1

(async () => {
    // You pass a hex string, or Uint8Array
    const privateKey = "6b911fd37cdf5c81d4c0adb1ab7fa822ed253ab0ad9aa18d77257c88b29b718e";
    const message = "hello world";
    const messageHash = await secp.utils.sha256(message);
    const publicKey = secp.getPublicKey(privateKey);
    const signature = await secp.sign(messageHash, privateKey);
    const isSigned = secp.verify(signature, messageHash, publicKey);
  
    // Sigs with improved security (see README)
    const signatureE = await secp.sign(messageHash, privateKey, { extraEntropy: true });
  
    // Malleable signatures, compatible with openssl
    const signatureM = await secp.sign(messageHash, privateKey, { canonical: false });
  
    // If you need hex strings
    const hex = secp.utils.bytesToHex;
    console.log(hex(publicKey));
  
    // Supports Schnorr signatures
    const rpub = secp.schnorr.getPublicKey(privateKey);
    const rsignature = await secp.schnorr.sign(message, privateKey);
    const risSigned = await secp.schnorr.verify(rsignature, message, rpub);
  })();
  
  
  /////////////////////////////////// sha256 hashes!
  console.log(sha256(new Uint8Array([1, 2, 3])));
  
  // small utility method that converts bytes to hex
  console.log(toHex(sha256('abc')));
  
  
  