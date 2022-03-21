// Peer-to-peer comms using peerjs
import * as React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
    RealBadBlock
} from './util/RealBadCoin.tsx';

import * as ed from '@noble/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

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

async function makeCoinTransfer() {
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let a2 = new AccountMock();
    let id2 = await a2.getPubKeyHex();

    let t3 = new RealBadTransaction();
    t3.txData = new RealBadCoinTransfer();
    t3.txData.destination = id2;
    t3.txData.amount = 111;
    t3.transactionFee = 3;
    t3.sourceNonce = 1;
    await t3.seal(a);
    return t3;
}

async function makeNftMint() {
    let a = new AccountMock();
    let id = await a.getPubKeyHex();

    let t3 = new RealBadTransaction();
    t3.txData = new RealBadNftMint();
    t3.txData.nftData = {hello: "world"};
    t3.txData.nftId = t3.txData.hash();
    t3.transactionFee = 3;
    t3.sourceNonce = 2;
    await t3.seal(a);
    return t3;
}

async function makeNftTransfer() {
    let a = new AccountMock();
    let id = await a.getPubKeyHex();
    let a2 = new AccountMock();
    let id2 = await a2.getPubKeyHex();

    let t3 = new RealBadTransaction();
    t3.txData = new RealBadNftTransfer();
    t3.txData.destination = id2;
    t3.txData.nftId = id; // Shrug?
    t3.txData.nftNonce = 4;
    t3.transactionFee = 3;
    t3.sourceNonce = 1;
    await t3.seal(a);
    return t3;
}

class TransactionView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {tx: this.props.tx};
    }

    componentDidMount() {
        // Generate some random filler if the parent didn't give us a tx:
        if (!this.state.tx) {
            makeNftTransfer().then((t)=>this.setState({tx: t}));
        }
    }

    static renderTxData(d) {
        /* Available fields in txData:
        RealBadCoinTransfer
        destination = null; // Destination account ID (public key)
        amount = 0;         // Amount of RealBadCoin to transfer (floating point number)

        RealBadNftMint
        nftData = null;     // Any data we want to "mint" as an NFT. Can be a string, and object, whatever...
        nftId = null;       // The ID (hash) of the `nftData` object. Must a globally unique number on the block chain (so nftData must be unique).

        RealBadNftTransfer
        nftId = null;       // The ID (hash) of the NFT. Must already be minted before it can be transferred.
        nftNonce = 0;       // Incrementing number specifying transfer count for this NFT. Must be sequentually incrementing or the transaction will be ignored.
        destination = null; // Destination account ID (public key) for the new owner of the NFT.
        */
        if (d instanceof RealBadCoinTransfer) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="Destination"
                    secondary={d.destination}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Amount"
                    secondary={"\u211C " + d.amount.toString()}
                />
                </ListItem>
                </>
            );
        }
        else if (d instanceof RealBadNftMint) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="ID"
                    secondary={d.nftId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Content"
                    secondary={d.nftData.toString()}
                />
                </ListItem>
                </>
            );
        }
        else if (d instanceof RealBadNftTransfer) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="ID"
                    secondary={d.nftId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Destination"
                    secondary={d.destination}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="NFT Nonce"
                    secondary={d.nftNonce}
                />
                </ListItem>
                </>
            );
        }
        else return null;
    }

    render() {
        /* Available fields in RealBadTransaction:
        source = null;          // Source account ID (public key)
        sourceNonce = 0;        // Source account transaction nonce. Used to ensure transactions (including transactionFees) apply IN ORDER.
                                // Must be sequentially incrementing or transaction will be ignored.
                                // nonce is NOT REQURIED and NOT UPDATED if no coins are spent (txFee or transfer).
        timestamp = null;       // Time when the transaction is created. Miners will only propagate and process transactions during a certain time window.
        transactionFee = 0;     // Fee to be paid to the miner if this transaction is accepted into a block. Miners _might_ not accept transactions without fees!
        txData = null;          // The data portion of the transaction. One of the valid transaction object types must go here.
        txId = null;            // Hash of `[source, timestamp, transactionFee, txData]`. This serves as the unique ID for the transaction.
        signature = null;       // Signature of `txId` using the `source` account.
        */

        if (this.state.tx === undefined) return null;

        return (
            <List component="div" disablePadding>
            <ListItem>
                <ListItemText
                    primary="Transaction ID"
                    secondary={this.state.tx.txId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Transaction Time"
                    secondary={this.state.tx.timestamp.toLocaleString()}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Transaction Fee"
                    secondary={"\u211C " + this.state.tx.transactionFee.toString()}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Source"
                    secondary={this.state.tx.source}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Source Nonce"
                    secondary={this.state.tx.sourceNonce}
                />
            </ListItem>
            {TransactionView.renderTxData(this.state.tx.txData)}
            </List>
        );
    }
}

export default TransactionView;
