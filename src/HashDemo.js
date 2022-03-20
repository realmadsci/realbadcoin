// Imports from paulmillr.github.io demo:
import * as React from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export class HashDemo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            message: 'hello world',
            hash: null,
        };
    }

    onMsgChange(event) {
        const message = event.target.value ?? "";
        this.setState({ message });
        this.updateHash(message);
    }

    updateHash(msg) {
        this.setState(prevState=>({
            hash: bytesToHex(sha256(prevState.message)),
        }));
    }

    componentDidMount() {
        this.updateHash(this.state.message);
    }

    render() {
        return (
            <Stack
                component="form"
                autoComplete="off"
                spacing={2}
                sx={{p:2}}
            >
                <TextField
                    label="Hash Demo"
                    maxLength="512"
                    value={this.state.message}
                    onChange={this.onMsgChange.bind(this)}
                    onKeyUp={this.onMsgChange.bind(this)}
                />
                <Typography variant="hexblob">{this.state.hash}</Typography>
            </Stack>
        );
    }
}

export default HashDemo;
