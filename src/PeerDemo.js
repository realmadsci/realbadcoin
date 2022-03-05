// Peer-to-peer comms using peerjs
import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';

import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';

import Peer from 'peerjs';

// Ability to send events when connection status changes
import { EventEmitter } from 'events';

// Random slug generator to simplify connection to server
const { generateSlug } = require("random-word-slugs");

class ConnectionManager {

    constructor() {
        this.myId = null;
        this.server = null;
        this.peers = {};
        this.state = "disconnected";
        this._updateNotifier = new EventEmitter();
    }

    // Add subscribe/unsub options for tracking when connection/disconnection events happen
    subscribe(callback) {
        this._updateNotifier.addListener('status_change', callback);
    }

    unsubscribe(callback) {
        this._updateNotifier.removeListener('status_change', callback);
    }

    _notifyStatusChange(newState) {
        this.state = newState;
        console.log(this.state);
        this._updateNotifier.emit('status_change');
    }

    _notifyPeerStatusChange(peer, newState) {
        this.peers[peer].state = newState;
        console.log(this.peers);
        this._updateNotifier.emit('status_change');
    }

    // Connect to the peer server and claim our peer_id
    connectToServer() {
        if (this.state !== "disconnected") {
            console.error("Can only call connect if we are not already connected!");
        }

        this._notifyStatusChange("connecting");

        //https://anseki.github.io/gnirts/
        const a = (388).toString(36).toLowerCase() + (function () { var Z = Array.prototype.slice.call(arguments), H = Z.shift(); return Z.reverse().map(function (Q, P) { return String.fromCharCode(Q - H - 7 - P) }).join('') })(29, 140, 147, 144, 144) + (28210).toString(36).toLowerCase() + (1203767).toString(36).toLowerCase().split('').map(function (r) { return String.fromCharCode(r.charCodeAt() + (-39)) }).join('') + (596).toString(36).toLowerCase() + (function () { var o = Array.prototype.slice.call(arguments), i = o.shift(); return o.reverse().map(function (L, H) { return String.fromCharCode(L - i - 38 - H) }).join('') })(0, 101, 104, 101, 99, 97, 151, 149, 151, 151, 157, 154, 147, 147) + (7482579).toString(36).toLowerCase() + (function () { var L = Array.prototype.slice.call(arguments), w = L.shift(); return L.reverse().map(function (c, N) { return String.fromCharCode(c - w - 39 - N) }).join('') })(4, 153, 146);
        this.myId = sessionStorage.getItem("peer_id") || generateSlug(2).replace("-", "_");
        this.server = new Peer(this.myId, {
            secure: true,
            debug: 3,
            config: {
                'iceServers': [
                    { url: 'stun:coinpeers.realmadsci.com' },
                    { url: 'turn:coinpeers.realmadsci.com', username: 'coin', credential: a }
                ]
            }
        });

        // If it failed, try again in a little bit
        this.server.on('disconnected', () => {
            let prevState = this.state;
            this._notifyStatusChange("disconnected");

            // See if we want to try and reconect:
            if (prevState !== "quitting") {
                console.error("Initial connect attempt failed! Trying again in 10 seconds.");
                setTimeout(()=>{
                    this.connectToServer();
                }, 10000);
            }
        });

        // If it works, then we keep track of the connection!
        this.server.on('open', (id) => {
            this._notifyStatusChange("connected");

            this.myId = id; // This *should* already match, but just in case...
            sessionStorage.setItem("peer_id", id);

            // Now that we've connected once, set a new "disconnect" handler to just try and reconnect.
            this.server.on('disconnected', () => {
                let prevState = this.state;
                this._notifyStatusChange("disconnected");

                // See if we want to try and reconect:
                if (prevState !== "quitting") {
                    console.log("Got disconnected. Trying to reconnect!");
                    this.server.reconnect();
                    this._notifyStatusChange("reconnecting");
                }
            });
        });

        this.server.on('connection', (conn) => {this.gotNewConnection(conn);});
    }

    disconnectFromServer() {
        this.state = "quitting";
        if (this.server !== null) {
            this.server.disconnect();
            this.server = null;
        }
    }

    gotNewConnection(conn) {
        console.log("I got connection. Reliable = " + conn.reliable);

        this.peers[conn.peer] = {
            state: "connected",
            conn: conn,
            initiator: false,
        }

        conn.on('data', (data) => {
            console.log("Data from " + conn.peer + " = " + data.toString());
        });
    }

    connectToPeer(peer_id) {
        console.error("Trying to connect to peer_id = " + peer_id)
        const conn = this.server.connect(peer_id, { reliable: true });

        this.peers[peer_id] = {
            state: "connecting",
            conn: conn,
            initiator: true,
        }
        this._notifyPeerStatusChange(peer_id, "connecting");

        conn.on('open', () => {
            this._notifyPeerStatusChange(peer_id, "connected");
            console.log("I opened a connection to " + peer_id  + ". Reliable = " + conn.reliable);
        });

        conn.on('close', () => {
            console.log("The connection to " + conn.peer + " is closed!");
            let prevState = this.peers[conn.peer].state;
            this._notifyPeerStatusChange(conn.peer, "disconnected");


            // See if we want to try and reconect:
            if (prevState !== "quitting") {
                console.log("Got disconnected. Trying to reconnect!");
                this.server.reconnect();
                this._notifyPeerStatusChange(conn.peer, "reconnecting");
            }

        });

        conn.on('error', (err) => {
            console.error("Got error connecting to " + conn.peer + ": " + err);
            this._notifyPeerStatusChange(conn.peer, "disconnected");
        });
    }

    sendToPeer(peer_id, msgObj) {
        if (peer_id in this.peers) {
            if (this.peers[peer_id].state !== "connected") {
                console.error("Tried to send to " + peer_id + " but they are not currently connected");
                return;
            }

            console.log("I'm going to send to " + peer_id + ". I'll let you know how it goes! msg = " + msgObj);
            this.peers[peer_id].conn.send(msgObj);
            console.log("Sent!");
        }
    }
}




class PeerApp extends React.Component {

    constructor(props) {
        super(props);

        this._conn = props?.conn ?? new ConnectionManager();
        this._conn.subscribe(()=>this._syncConnectionState());

        this.state = {
            myId: '',
            friendId: '',
            message: '',
            messages: []
        }
    }

    _syncConnectionState() {
        this.setState({
            myId: this._conn.myId + ":" + this._conn.state,
        });
    }

    _tryConnectPeer() {
        this._conn.connectToPeer(this.state.friendId);
    }

    componentDidMount() {
        this._conn.connectToServer();
    }

    _send() {
        this._conn.sendToPeer(this.state.friendId, this.state.message);
        this.setState({message: ''});
    }

    render() {
        return (
            <div className="wrapper">
                <div className="col">
                    <Box
                        component="form"
                        sx={{
                            '& > :not(style)': { m: 1, width: '25ch' },
                        }}
                        noValidate
                        autoComplete="off"
                    >
                        <List component="div" disablePadding>
                            <ListItem>
                                <ListItemIcon>
                                    <SensorsRoundedIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Network ID"
                                    secondary={this.state.myId}
                                />
                            </ListItem>
                        </List>

                        <TextField
                            label="Friend ID"
                            variant="filled"
                            InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CloudRoundedIcon />
                                  </InputAdornment>
                                ),
                            }}
                            value={this.state.friendId}
                            onChange={e => { this.setState({ friendId: e.target.value }); }}
                            onKeyUp={e => {
                                if (e.key==='Enter') {
                                    this._tryConnectPeer();
                                }
                            }}
                        />

                        <TextField
                            label="Message"
                            variant="filled"
                            value={this.state.message}
                            onChange={e => { this.setState({ message: e.target.value }); }}
                            onKeyUp={e => {
                                if (e.key==='Enter') {
                                    this._send();
                                }
                            }}
                        />

                    </Box>
                    <dl>
                        {
                            this.state.messages.map((message, i) => {
                                return (
                                    <>
                                        <dt>{message.sender}</dt>
                                        <dd>{message.message}</dd>
                                    </>
                                )
                            })
                        }
                    </dl>
                </div>
            </div>
        );
    }
}

export default PeerApp;
