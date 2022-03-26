import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CatchingPokemonRoundedIcon from '@mui/icons-material/CatchingPokemonRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import { Emoji } from 'emoji-mart';

import * as ed from '@noble/ed25519';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

import { CoinTransferDialog, MintNftDialog, TransferNftDialog } from './TransactionDialog';

import {
    RealBadTransaction,
} from './util/RealBadCoin.tsx';

export class AccountIdentity {

    constructor() {
        this._privKey = null;
        this._pubKey = null;

        // Trigger the initialization to occur the first time anybody asks for anything
        this._initialized = this._initialize();
    }

    async _initialize() {
        // Pull the private key out of storage or generate a new one
        this._privKey = localStorage.getItem("private_key");
        if (this._privKey === null) {
            // We don't already have a private key for this browser, so make one:
            const array = window.crypto.getRandomValues(new Uint8Array(32));
            this._privKey = bytesToHex(array);
            localStorage.setItem("private_key", this._privKey);
        }

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

export function NftChip(props) {
    const {nftId, lstate, onSend} = props;

    const emoji=lstate.nftPayloads[nftId].emoji;
    return (
        <Chip
            avatar={
                <Emoji
                    size={48}
                    emoji={emoji}
                />
            }
            onDelete={()=>{
                onSend(emoji);
            }}
            deleteIcon={<SendRoundedIcon />}
        />
    );
}

export function AccountView(props) {
    const {lstate, topLState, pubKeyHex, privKeyHex, sendTx} = props;
    const [showPrivKey, setShowPrivKey] = useState(false);
    const [showCoinTxDialog, setShowCoinTxDialog] = useState(false);
    const [showMintNftDialog, setShowMintNftDialog] = useState(false);
    const [showTransferNftDialog, setShowTransferNftDialog] = useState(false);
    const [transferNft, setTransferNft] = useState({nftId:"", emoji:":shrug:"});

    let balance = (lstate && pubKeyHex in lstate.accounts && lstate.accounts[pubKeyHex].balance) || 0;

    let nfts = [];
    if (lstate !== null) {
        nfts = Object.keys(lstate.nfts).filter(k=>(lstate.nfts[k].owner === pubKeyHex));
    }

    const toggleShowPrivKey = ()=>{
        setShowPrivKey(!showPrivKey);
    }

    return (
        <List component="div" disablePadding>
            <ListItem>
                <ListItemIcon>
                    <AccountBalanceWalletRoundedIcon />
                </ListItemIcon>
                <ListItemText
                    primary="Wallet"
                    secondary={pubKeyHex}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                <IconButton
                    aria-label={showPrivKey ? "Hide Private Key" : "Show Private Key"}
                    onClick={toggleShowPrivKey}
                >
                    {showPrivKey ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </IconButton>
            </ListItem>
            <Collapse in={showPrivKey} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItem>
                        <ListItemIcon>
                            <LockRoundedIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Private Key"
                            secondary={privKeyHex}
                            secondaryTypographyProps={{variant: "hexblob"}}
                        />
                    </ListItem>
                </List>
            </Collapse>

            <ListItem>
                <ListItemIcon>
                    <AccountBalanceRoundedIcon />
                </ListItemIcon>
                <ListItemText
                    primary="Balance"
                    secondary={"\u211C " + balance.toString()}
                />
                <IconButton
                    aria-label="Send Coins"
                    onClick={()=>{setShowCoinTxDialog(true)}}
                >
                    <SendRoundedIcon />
                </IconButton>
                <CoinTransferDialog
                    open={showCoinTxDialog}
                    onClose={()=>{setShowCoinTxDialog(false)}}
                    sendTx={sendTx}
                    lstate={topLState}
                />
            </ListItem>

            <ListItem>
                <ListItemIcon>
                    <CatchingPokemonRoundedIcon />
                </ListItemIcon>
                <ListItemText
                    primary="NFTs"
                    secondary={nfts.length}
                />
                <IconButton
                    aria-label="Mint New NFT"
                    onClick={()=>{setShowMintNftDialog(true)}}
                >
                    <AddRoundedIcon />
                </IconButton>
                <MintNftDialog
                    open={showMintNftDialog}
                    onClose={()=>{setShowMintNftDialog(false)}}
                    sendTx={sendTx}
                    lstate={topLState}
                />
            </ListItem>

            { (!nfts?.length) ? null : (<>
                <Divider variant="fullWidth" />
                <ListItem>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        columnGap: 1,
                        rowGap: 2,
                        paddingTop: 1,
                        paddingBottom: 1,
                    }}>
                    {
                        nfts.map(nftId=>{
                            return (
                                <NftChip
                                    key={nftId}
                                    nftId={nftId}
                                    lstate={lstate}
                                    onSend={(emoji)=>{
                                        setTransferNft({
                                            nftId: nftId,
                                            emoji: emoji,
                                        });
                                        setShowTransferNftDialog(true);
                                    }}
                                />
                            );
                        })
                    }
                    </Box>
                    <TransferNftDialog
                        open={showTransferNftDialog}
                        nftId={transferNft?.nftId}
                        emoji={transferNft?.emoji}
                        onClose={()=>{setShowTransferNftDialog(false)}}
                        sendTx={sendTx}
                        lstate={topLState}
                    />
                </ListItem>
            </>)}
        </List>
    );
}
