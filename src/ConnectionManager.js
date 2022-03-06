// Peer-to-peer comms using peerjs
import * as React from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';

import Peer from 'peerjs';

// Ability to send events when connection status changes
import { EventEmitter } from 'events';

// Random slug generator to simplify connection to server
const { generateSlug } = require("random-word-slugs");

export class ConnectionManager {

    constructor() {
        this.myId = null;
        this.server = null;
        this.peers = {};
        this.peerHistory = [];
        this.state = "disconnected";
        this._updateNotifier = new EventEmitter();
    }

    // Add subscribe/unsub options for tracking when connection/disconnection events happen
    subscribeStatus(callback) {
        this._updateNotifier.addListener('status_change', callback);
    }

    subscribeData(callback) {
        this._updateNotifier.addListener('data', callback);
    }

    _notifyStatusChange(newState) {
        this.state = newState;
        console.log(this.state);
        this._updateNotifier.emit('status_change');
    }

    _notifyPeerStatusChange(peer, newState) {
        if (newState !== "deleted") {
            this.peers[peer].state = newState;
        }
        else {
            // If the user specifically deleted the connection, then wipe it from the restart history:
            this.peerHistory = this.peerHistory.filter((e, i) => e !== peer);
            sessionStorage.setItem("peer_history", JSON.stringify(this.peerHistory));
        }
        if (newState === "connected") {
            // Keep track of previously connected peers so we can try to dial them up again next time!
            this.peerHistory.push(peer);
            // Only keep unique ones!
            this.peerHistory = this.peerHistory.filter((e, i) => this.peerHistory.indexOf(e) === i);
            sessionStorage.setItem("peer_history", JSON.stringify(this.peerHistory));
        }
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
        this.peerHistory = JSON.parse(sessionStorage.getItem("peer_history") || "[]");
        this.server = new Peer(this.myId, {
            //secure: true,
            //debug: 3,
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

            // Now try and pull in our old friends!
            this.peerHistory.forEach(p=>{this.connectToPeer(p);});

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

        // Cap the incoming connection count
        let good_connections = Object.keys(this.peers).filter((p, i)=>(this.peers[p].state === "connected"));
        if (good_connections.length >= 5) {
            console.error("Already have too many connections, not accepting any more incoming!")
            conn.close();
            return;
        }

        this.peers[conn.peer] = {
            state: "connected",
            conn: conn,
            initiator: false,
        }
        this._notifyPeerStatusChange(conn.peer, "connected");

        conn.on('close', () => {this._handlePeerClose(conn.peer)});
        conn.on('error', (err) => {this._handlePeerError(conn.peer, err)});
        conn.on('data', (data) => {this._handlePeerData(conn.peer, data)});
    }

    connectToPeer(peer_id) {
        console.log("Trying to connect to peer_id = " + peer_id)
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

        conn.on('close', () => {this._handlePeerClose(conn.peer)});
        conn.on('error', (err) => {this._handlePeerError(conn.peer, err)});
        conn.on('data', (data) => {this._handlePeerData(conn.peer, data)});
    }

    _handlePeerClose(peer_id) {
        console.log("The connection to " + peer_id + " is closed!");
        let prevState = this.peers[peer_id].state;

        // If we disconnected on purpose, just drop this connection from the list.
        if (prevState === "quitting") {
            delete this.peers[peer_id];
            this._notifyPeerStatusChange(peer_id, "deleted");
        }
        else {
            this._notifyPeerStatusChange(peer_id, "disconnected");
        }
    }

    _handlePeerError(peer_id, error) {
        if (this.peers[peer_id].initiator) {
            console.error("Got error connecting to " + peer_id + ": " + error);
        }
        else {
            console.error("Got error from connection to " + peer_id + ": " + error);
        }

        this._notifyPeerStatusChange(peer_id, "disconnected");
    }

    _handlePeerData(peer_id, data) {
        console.log("Data from " + peer_id + " = " + data.toString());
        this._updateNotifier.emit('data', peer_id, data);
    }

    disconnectPeer(peer_id) {
        if (peer_id in this.peers) {
            if (this.peers[peer_id].state !== "connected") {
                delete this.peers[peer_id];
                this._notifyPeerStatusChange(peer_id, "deleted");
            }
            else {
                this._notifyPeerStatusChange(peer_id, "quitting");
                this.peers[peer_id].conn.close();
            }
        }
    }

    broadcast(data) {
        let good_connections = Object.keys(this.peers).filter((p, i)=>(this.peers[p].state === "connected"));
        Object.keys(this.peers).forEach((p,i)=>{
            if (this.peers[p].state === "connected") {
                this.sendToPeer(p, data);
            }
        });
    }

    sendToPeer(peer_id, data) {
        if (peer_id in this.peers) {
            if (this.peers[peer_id].state !== "connected") {
                console.error("Tried to send to " + peer_id + " but they are not currently connected");
                return;
            }
            this.peers[peer_id].conn.send(data);
        }
    }
}




export class PeerApp extends React.Component {

    constructor(props) {
        super(props);

        this._conn = props.conn;
        this._conn.subscribeStatus(()=>this._syncConnectionState());

        this.state = {
            myId: '',
            myStatus: '',
            peerInfo: [],
            friendId: '',
        }
    }

    _syncConnectionState() {
        this.setState({
            myId: this._conn.myId,
            myStatus: this._conn.state,
            peerInfo: Object.keys(this._conn.peers).map((peer, i)=>{
                return {
                    id: peer,
                    state: this._conn.peers[peer].state,
                };
            }),
        });
    }

    _tryConnectPeer() {
        this._conn.connectToPeer(this.state.friendId);
    }

    componentDidMount() {
        this._conn.connectToServer();
    }

//    componentWillUnmount() {
//        this._conn.disconnectFromServer();
//    }

//    _send() {
//        this._conn.sendToPeer(this.state.friendId, this.state.message);
//        this.setState({message: ''});
//    }

    render() {
        return (
            <Stack spacing={1} sx={{p:1}}>
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
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                }}>
                    {
                        this.state.peerInfo.map((p, i)=>{
                            return (
                            <Chip
                                key={p.id}
                                label={p.id}
                                onClick={(p.state === "connected") ? undefined : ()=>{
                                    this._conn.connectToPeer(p.id);
                                }}
                                onDelete={()=>{
                                    this._conn.disconnectPeer(p.id);
                                }}
                                color={(p.state === "connected") ? "success" : undefined}
                            />)
                        })
                    }
                </Box>
            </Stack>
        );
    }
}

