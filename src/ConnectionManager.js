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

        this._serverDisconnectCallback = this._handleServerDisconnect.bind(this);
    }

    // Add subscribe/unsub options for tracking when connection/disconnection events happen
    subscribeStatus(callback) {
        this._updateNotifier.addListener('status_change', callback);
    }
    unsubscribeStatus(callback) {
        this._updateNotifier.removeListener('status_change', callback);
    }

    subscribeNewPeer(callback) {
        this._updateNotifier.addListener('new_peer', callback);
    }
    unsubscribeNewPeer(callback) {
        this._updateNotifier.removeListener('new_peer', callback);
    }

    subscribeData(callback) {
        this._updateNotifier.addListener('data', callback);
    }
    unsubscribeData(callback) {
        this._updateNotifier.removeListener('data', callback);
    }

    _notifyStatusChange(newState) {
        this.state = newState;
        console.log(this.state);
        this._updateNotifier.emit('status_change');
    }

    _notifyPeerStatusChange(peer, newState, remove=false) {
        if (newState !== "deleted") {
            this.peers[peer].state = newState;
        }
        else if (remove) {
            // If the user specifically deleted the connection, then wipe it from the restart history:
            this.peerHistory = this.peerHistory.filter((e, i) => e !== peer);
            localStorage.setItem("peer_history", JSON.stringify(this.peerHistory));
        }
        if (newState === "connected") {
            // Keep track of previously connected peers so we can try to dial them up again next time!
            this.peerHistory.push(peer);
            // Only keep unique ones!
            this.peerHistory = this.peerHistory.filter((e, i) => this.peerHistory.indexOf(e) === i);
            localStorage.setItem("peer_history", JSON.stringify(this.peerHistory));

            this._updateNotifier.emit('new_peer', peer);
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

        this.myId = sessionStorage.getItem("peer_id") || ("realbadcoin_" + generateSlug(2).replace("-", "_"));
        this.peerHistory = JSON.parse(localStorage.getItem("peer_history") ?? sessionStorage.getItem("peer_history") ?? "[]");
        // Use the default PeerJS cloud server for brokering connections, but prepend "realbadcoin" to the names to avoid collisions
        this.server = new Peer(this.myId);

        // If it failed, try again in a little bit
        this.server.on('disconnected', this._serverDisconnectCallback);

        // If it works, then we keep track of the connection!
        this.server.on('open', (id) => {
            this._notifyStatusChange("connected");
            sessionStorage.setItem("peer_id", this.myId);

            // Now try and pull in our old friends!
            this.peerHistory.forEach(p=>{this.connectToPeer(p);});
        });

        this.server.on('connection', (conn) => {this.gotNewConnection(conn);});
    }

    _handleServerDisconnect() {
        let prevState = this.state;
        this._notifyStatusChange("disconnected");

        // See if we want to try and reconect:
        if (prevState === "connecting") {
            console.error("Initial connect attempt failed! Trying again in 10 seconds.");
            setTimeout(()=>{
                this.connectToServer();
            }, 10000);
        }
        else if (prevState !== "quitting") {
            // See if we want to try and reconect:
            console.log("Got disconnected. Trying to reconnect!");
            this.server.reconnect();
            this._notifyStatusChange("reconnecting");
        }
    }

    disconnectFromServer() {
        this.state = "quitting";

        // Disconnect all of the peers first!
        for (const peer_id of Object.keys(this.peers)) {
            this.disconnectPeer(peer_id, false);
        }

        if (this.server !== null) {
            this.server.destroy();
            this.server = null;
        }
    }

    gotNewConnection(conn) {
        console.log("I got connection. Reliable = " + conn.reliable);

        // Cap the incoming connection count
        let good_connections = Object.keys(this.peers).filter((p, i)=>(this.peers[p].state === "connected"));
        if (good_connections.length >= 10) {
            console.error("Already have too many connections, not accepting any more incoming!")
            conn.close();
            return;
        }

        conn.on('open', () => {
            this.peers[conn.peer] = {
                state: "connected",
                conn: conn,
                initiator: false,
            }
            console.log("Connection from " + conn.peer + " confirmed.");
            this._notifyPeerStatusChange(conn.peer, "connected");
        });

        conn.on('close', () => {this._handlePeerClose(conn.peer)});
        conn.on('error', (err) => {this._handlePeerError(conn.peer, err)});
        conn.on('data', (data) => {this._handlePeerData(conn.peer, data)});
    }

    connectToPeer(peer_id) {
        console.log("Trying to connect to peer_id = " + peer_id)
        const conn = this.server.connect(peer_id, { reliable: false });

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

        if (prevState === "quitting") {
            delete this.peers[peer_id];
            this._notifyPeerStatusChange(peer_id, "deleted", false);
        }
        else if (prevState === "removing") {
            // If we disconnected on purpose, just drop this connection from the list.
            delete this.peers[peer_id];
            this._notifyPeerStatusChange(peer_id, "deleted", true);
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
        //console.log("Data from " + peer_id + " = " + data.toString());
        this._updateNotifier.emit('data', peer_id, data);
    }

    disconnectPeer(peer_id, remove=false) {
        if (peer_id in this.peers) {
            if (this.peers[peer_id].state !== "connected") {
                delete this.peers[peer_id];
                this._notifyPeerStatusChange(peer_id, "deleted", remove);
            }
            else {
                this._notifyPeerStatusChange(peer_id, remove ? "removing" : "quitting");
                this.peers[peer_id].conn.close();
            }
        }
    }

    broadcast(data, excluded=[]) {
        let good_connections = Object.keys(this.peers).filter((p, i)=>(this.peers[p].state === "connected"));
        Object.keys(this.peers).forEach((p,i)=>{
            if (
                (this.peers[p].state === "connected") &&
                !excluded.includes(p)
            ) {
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

        this.state = {
            myId: '',
            myStatus: '',
            peerInfo: [],
            friendId: '',
        }

        this._syncConnectionCallback = this._syncConnectionState.bind(this);
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
        this._conn.connectToPeer("realbadcoin_" + this.state.friendId);
    }

    componentDidMount() {
        // Subscribe to updates in connection status
        this._conn.subscribeStatus(this._syncConnectionCallback);
        this._syncConnectionState();
    }

    componentWillUnmount() {
        this._conn.unsubscribeStatus(this._syncConnectionCallback);
    }

//    _send() {
//        this._conn.sendToPeer(this.state.friendId, this.state.message);
//        this.setState({message: ''});
//    }

    render() {
        return (
            <Stack spacing={2} sx={{p:2}}>
                <List component="div" disablePadding>
                    <ListItem>
                        <ListItemIcon>
                            <SensorsRoundedIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Network ID"
                            secondary={String(this.state.myId).replace("realbadcoin_","")}
                        />
                    </ListItem>
                </List>

                <TextField
                    label="Friend ID"
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
                                label={String(p.id).replace("realbadcoin_","")}
                                onClick={(p.state === "connected") ? undefined : ()=>{
                                    this._conn.connectToPeer(p.id);
                                }}
                                onDelete={()=>{
                                    this._conn.disconnectPeer(p.id, true);
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

