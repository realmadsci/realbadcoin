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

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, Hash, utf8ToBytes } from '@noble/hashes/utils';

// For the HashWorker:
import * as Comlink from 'comlink';


function pad(n, length = 64, base = 16) {
    //return n.toString(base).padStart(length, '0');
    return n.toString();
}

const HashWorker = Comlink.wrap(new Worker(new URL("./util/HashWorker.js", import.meta.url)));

class AccountIdentity {

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

        // Create a dummy hashworker
        this._hashworker = await new HashWorker(0);
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

        //HACK: Do some busy work here to simulate taking a while to compute the sig and practice using WebWorker
        await this._hashworker.increment(100000000);
        console.log("Count = " + await this._hashworker.counter);

        // Return the signature:
        return bytesToHex(sig);
    }
}

class EccApp extends React.Component {
    constructor() {
        super();

        this.state = {
            id: new AccountIdentity(),

            privKeyHex: null,
            showPrivKey: false,
            pubKeyHex: null,

            message: 'hello world',
            sigHex: null,
        };
    }

    onMsgChange(event) {
        const message = event.target.value;
        //TODO: Why are we limiting to 1 char or longer???
        if (message.length > 0) this.setState({ message });

        this.updateSig(message);
    }

    updateSig(msg) {
        this.state.id.sign(utf8ToBytes(msg)).then(sig=>this.setState({sigHex: sig}));
    }

    componentDidMount() {
        // Grab the keys sometime in the future and stash them:
        this.state.id.getPrivKeyHex().then(p=>this.setState({privKeyHex: p}));
        this.state.id.getPubKeyHex().then(p=>this.setState({pubKeyHex: p}));

        this.updateSig(this.state.message);
    }

    toggleShowPrivKey() {
        this.setState({showPrivKey: !this.state.showPrivKey});
    }

    render() {
        return (
            <>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <AccountBalanceRoundedIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Account Number"
                            secondary={this.state.pubKeyHex}
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
                                    secondary={this.state.privKeyHex}
                                />
                            </ListItem>
                        </List>
                    </Collapse>
                </List>
                <TextField
                    label="Message to sign"
                    variant="filled"
                    maxLength="512"
                    value={this.state.message}
                    onChange={this.onMsgChange.bind(this)}
                    onKeyUp={this.onMsgChange.bind(this)}
                />
                {this.state.sigHex}
            </>
        );
    }
}

export default EccApp;
