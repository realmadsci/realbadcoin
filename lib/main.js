

/////////////////////////////////// sha256 hashes!
import sha256 from '@noble/hashes/sha256';
console.log(sha256(new Uint8Array([1, 2, 3])));

// small utility method that converts bytes to hex
import { bytesToHex as toHex } from '@noble/hashes/utils';
console.log(toHex(sha256('abc')));



/////////////////////////////////// secp256k1 signatures!
import * as secp from "@noble/secp256k1";
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


/////////////////////////////////// peerjs!
//DOESN'T browserify yet!!!!????!?!?
//import Peer from 'peerjs';
//const Peer = require('peerjs');

//const peer = Peer({
//    host: '34.204.147.55'
//    port: 8080,
//    path: '/realbadcoin-peerjs'
//});



/////////////////////////////////// json-stringify-deterministic!
//const stringify = require('json-stringify-deterministic');
//const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };
//
//console.log(stringify(obj));


/////////////////////////////////// sort-keys-recursive!
//const sortKeysRecursive = require('sort-keys-recursive');

//const object = {
//  c: 0,
//  a: {
//    c: ['c', 'a', 'b'],
//    a: 0,
//    b: 0
//  },
//  b: 0
//};
//
//const output = sortKeysRecursive(object);
//
//console.log(output);

