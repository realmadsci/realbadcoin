// Imports from paulmillr.github.io demo:
import * as React from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import * as ed from '@noble/ed25519';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

function pad(n, length = 64, base = 16) {
    //return n.toString(base).padStart(length, '0');
    return n.toString();
}

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

export class AccountView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showPrivKey: false,
        };
    }

    toggleShowPrivKey() {
        this.setState({showPrivKey: !this.state.showPrivKey});
    }

    render() {
        let s = this.props.lstate;
        let id = this.props.pubKeyHex;
        let balance = (s && id in s.accounts && s.accounts[id].balance) || 0;
        let nfts = [];
        if (s !== null) {
            nfts = Object.keys(s.nfts).filter(k=>(s.nfts[k].owner === id));
        }
        //TODO: Add drop-down list for owned NFTs??

        return (
            <List component="div" disablePadding>
                <ListItem>
                    <ListItemIcon>
                        <AccountBalanceWalletRoundedIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Wallet"
                        secondary={id}
                        secondaryTypographyProps={{variant: "hexblob"}}
                    />
                    <IconButton
                        aria-label={this.state.showPrivKey ? "Hide Private Key" : "Show Private Key"}
                        onClick={()=>this.toggleShowPrivKey()}
                    >
                        {this.state.showPrivKey ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                    </IconButton>
                </ListItem>
                <Collapse in={this.state.showPrivKey} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem>
                            <ListItemIcon>
                                <LockRoundedIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary="Private Key"
                                secondary={this.props.privKeyHex}
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
                    secondary={"\u211C" + balance.toString()}
                />
                </ListItem>
            </List>
        );
    }
}
