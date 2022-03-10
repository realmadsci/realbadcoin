// Send "coins" to target destinations
import * as React from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

import {
    RealBadCoinTransfer,
    RealBadTransaction,
} from './util/RealBadCoin.tsx';


class CoinTransfer extends React.Component {
    constructor(props) {
        super(props);

        /* Expected props:
        lstate  - Current Ledger State
        id      - Account ID for signing transactions
        submit  - Callback for submitting the transaction
        */

        this.state = {
            dest: "",   // Public key of destination for transfer
            amount: 0,  // Number of coins to transfer
            txFee: 0,   // Fee to pay the miners for processing the transfer
        };
    }

    componentDidMount() {
    }

    async handleSubmit() {
        const myId = await this.props.id.getPubKeyHex();
        // If my account isn't already in the ledger, we can't send money anyway, but our "nonce" would be 0.
        let balance = 0;
        let nextNonce = 0;
        const accounts = this.props.lstate?.accounts ?? {};
        if (myId in accounts) {
            nextNonce = accounts[myId].nonce + 1;
            balance = accounts[myId].balance;
        }
        console.log("I've got " + balance.toString() + " to spend!");

        let tx = new RealBadTransaction();
        tx.txData = new RealBadCoinTransfer();
        tx.txData.destination = this.state.dest.toLowerCase(); // Hm... you can "burn" money pretty easily!
        tx.txData.amount = Number(this.state.amount);
        tx.transactionFee = Number(this.state.txFee);
        tx.sourceNonce = nextNonce;
        await tx.seal(this.props.id);

        console.log("Submitting! tx=" + JSON.stringify(tx));
        if (await tx.isValid()) {
            // TODO: Maybe use tryTransaction() to see if this transaction would "take" as well???
            this.props.submit(tx);
        }
        else console.error("Invalid!");
    }

    render() {
        const moneyPrefix = {
            startAdornment: (
                <InputAdornment position="start">
                {"\u211C"}
                </InputAdornment>
            ),
        };

        const accountList = Object.keys(this.props.lstate?.accounts ?? {});

        return (
            <Stack
                component="form"
                autoComplete="off"
                spacing={1}
                sx={{p:1}}
            >
                <Autocomplete
                    freeSolo
                    options={accountList}
                    renderInput={(params)=>
                        <TextField
                            {...params}
                            label="Destination Wallet"
                            //variant="filled"
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                    <AccountBalanceWalletRoundedIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    }
                    inputValue={this.state.dest}
                    onInputChange={(e, newValue) => { this.setState({ dest: newValue }); }}
                />
                <TextField
                    label="Amount to Transfer"
                    variant="filled"
                    type="number"
                    InputProps={moneyPrefix}
                    value={this.state.amount}
                    onChange={e => { this.setState({ amount: e.target.value }); }}
                />
                <TextField
                    label="Transaction Fee"
                    variant="filled"
                    type="number"
                    InputProps={moneyPrefix}
                    value={this.state.txFee}
                    onChange={e => { this.setState({ txFee: e.target.value }); }}
                />
                <Button variant="contained" onClick={()=>this.handleSubmit()}>
                    Send
                </Button>
            </Stack>
        );
    }
}

export default CoinTransfer;
