// Peer-to-peer comms using peerjs
import * as React from 'react';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import Peer from 'peerjs';

// Random slug generator to simplify connection to server
const { generateSlug } = require("random-word-slugs");


class PeerApp extends React.Component {

    state = {
        myId: '',
        friendId: '',
        peer: {},
        message: '',
        messages: []
    }

    componentDidMount() {
        //https://anseki.github.io/gnirts/
        const a = (388).toString(36).toLowerCase() + (function () { var Z = Array.prototype.slice.call(arguments), H = Z.shift(); return Z.reverse().map(function (Q, P) { return String.fromCharCode(Q - H - 7 - P) }).join('') })(29, 140, 147, 144, 144) + (28210).toString(36).toLowerCase() + (1203767).toString(36).toLowerCase().split('').map(function (r) { return String.fromCharCode(r.charCodeAt() + (-39)) }).join('') + (596).toString(36).toLowerCase() + (function () { var o = Array.prototype.slice.call(arguments), i = o.shift(); return o.reverse().map(function (L, H) { return String.fromCharCode(L - i - 38 - H) }).join('') })(0, 101, 104, 101, 99, 97, 151, 149, 151, 151, 157, 154, 147, 147) + (7482579).toString(36).toLowerCase() + (function () { var L = Array.prototype.slice.call(arguments), w = L.shift(); return L.reverse().map(function (c, N) { return String.fromCharCode(c - w - 39 - N) }).join('') })(4, 153, 146);
        const id = sessionStorage.getItem("peer_id") || generateSlug(2);
        const peer = new Peer(id, {
            secure: true,
            debug: 3,
            config: {
                'iceServers': [
                    { url: 'stun:coinpeers.realmadsci.com' },
                    { url: 'turn:coinpeers.realmadsci.com', username: 'coin', credential: a }
                ]
            }
        });

        peer.on('open', (id) => {
            sessionStorage.setItem("peer_id", id);
            this.setState({
                myId: id,
                peer: peer
            });
        });

        peer.on('connection', (conn) => {
            console.log("I got connection. Reliable = " + conn.reliable);

            conn.on('data', (data) => {
                this.setState({
                    messages: [...this.state.messages, data]
                });
            });
        });

        peer.on('disconnected', () => {
            console.log("Got disconnected. Trying to reconnect!");
            this.state.peer.reconnect();
        });
    }

    send = () => {
        const conn = this.state.peer.connect(this.state.friendId, { reliable: true });

        conn.on('open', () => {
            console.log("I opened a connection. Reliable = " + conn.reliable);

            const msgObj = {
                sender: this.state.myId,
                message: this.state.message
            };

            console.log("I'm going to send. I'll let you know how it goes! msg = " + msgObj);
            conn.send(msgObj);
            console.log("Sent!");

            this.setState({
                messages: [msgObj, ...this.state.messages],
                message: ''
            });

        });

        conn.on('close', () => {
            console.log("The connection to " + conn.peer + " is closed!");
        });

        conn.on('error', (err) => {
            console.log("Got error = " + err);
        });

    }

    render() {
        return (
            <div className="wrapper">
                <div className="col">
                    <h1>My ID: {this.state.myId}</h1>

                    <Box
                        component="form"
                        sx={{
                            '& > :not(style)': { m: 1, width: '25ch' },
                        }}
                        noValidate
                        autoComplete="off"
                    >
                        <TextField
                            label="Friend ID"
                            variant="filled"
                            InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <AccountCircle />
                                  </InputAdornment>
                                ),
                            }}
                            value={this.state.friendId}
                            onChange={e => { this.setState({ friendId: e.target.value }); }} />

                        <TextField
                            label="Message"
                            variant="filled"
                            value={this.state.message}
                            onChange={e => { this.setState({ message: e.target.value }); }} />

                        <Button variant="contained" onClick={this.send}>Send</Button>

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
