import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

import { hexToBytes } from '@noble/hashes/utils';

import {
    RealBadCoinTransfer,
    RealBadTransaction,
} from './util/RealBadCoin.tsx';

function DisplayInvalidTransaction(props) {
    /* Expected props:
    message - Error Message
    lstate  - Current Ledger State
    id      - Account ID for signing transactions
    sendTx  - Callback for submitting the transaction
    */
    const { header, message, onCancel, onBack } = props;

    return (
        <>
        <DialogTitle>{header}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {message}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={onBack}>Back</Button>
        </DialogActions>
        </>
    );
}

function CoinTransferForm(props) {
    /* Expected props:
    lstate  - Current Ledger State
    id      - Account ID for signing transactions
    sendTx  - Callback for submitting the transaction
    onCancel- Callback to avoid making transaction
    */
    const { lstate, id, sendTx, onCancel } = props;

    const [error, setError] = React.useState("");
    const [dest, setDest] = React.useState("");
    const [amount, setAmount] = React.useState(1);
    const [txFee, setTxFee] = React.useState(0);

    const validateAmount = (amount)=>{
        try {
            const amountNum = Number(amount);
            if (Number.isFinite(amountNum) && (amountNum > 0)) return true;
        }
        catch {}
        return false;
    }

    const validateFee = (fee)=>{
        try {
            const feeNum = Number(fee);
            if (Number.isFinite(feeNum) && (feeNum >= 0)) return true;
        }
        catch {}
        return false;
    }

    const validateDest = (dest)=>{
        try {
            if (hexToBytes(dest).length === 32) return true;
        }
        catch {}
        return false;
    }

    const handleSubmit = async()=>{
        // Pre-check of transaction fields to rule out obvious nonsense and give good error messages.
        // NOTE: Check in order of the fields so we give the error for the FIRST thing that they got wrong in the top-down order.
        if (!validateDest(dest)) {
            setError("Destination must be a 32-byte hex number (64 characters)");
            return;
        }

        if (!validateAmount(amount)) {
            setError("Amount must be a nonzero positive finite number");
            return;
        }

        if (!validateFee(txFee)) {
            setError("Transaction fee must be a non-negative finite number");
            return;
        }

        const myId = await id.getPubKeyHex();
        // If my account isn't already in the ledger, we can't send money anyway, but our "nonce" would be 0.
        let balance = 0;
        let nextNonce = 0;
        const accounts = lstate?.accounts ?? {};
        if (myId in accounts) {
            nextNonce = accounts[myId].nonce + 1;
            balance = accounts[myId].balance;
        }
        console.log("I've got " + balance.toString() + " to spend!");

        let tx = new RealBadTransaction();
        tx.txData = new RealBadCoinTransfer();
        tx.txData.destination = dest.toLowerCase(); // Hm... you can "burn" money pretty easily!
        tx.txData.amount = Number(amount);
        tx.transactionFee = Number(txFee);
        tx.sourceNonce = nextNonce;
        await tx.seal(id);

        console.log("Submitting! tx=" + JSON.stringify(tx));
        if (await tx.isValid()) {
            // TODO: Maybe use tryTransaction() to see if this transaction would "take" as well???
            sendTx(tx);
        }
        else setError("Transaction isValid() call failed. That's all I got atm.");
    };

    const moneyPrefix = {
        startAdornment: (
            <InputAdornment position="start">
            {"\u211C"}
            </InputAdornment>
        ),
    };

    const accountList = Object.keys(lstate?.accounts ?? {}).map(v=>v.toUpperCase());

    if (error) return (
        <DisplayInvalidTransaction
            header="Coin Transfer Failed"
            message={error}
            onCancel={onCancel}
            onBack={()=>setError("")}
        />
    );
    else return (
        <>
        <DialogTitle>
            Send Coins
        </DialogTitle>
        <DialogContent>
        <Stack
            component="form"
            autoComplete="off"
            spacing={2}
            sx={{p:2}}
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
                inputValue={dest}
                onInputChange={(e, newValue) => setDest(newValue)}
            />
            <TextField
                label="Amount to Transfer"
                type="number"
                InputProps={moneyPrefix}
                value={amount}
                onChange={e => setAmount(e.target.value)}
            />
            <TextField
                label="Transaction Fee"
                type="number"
                InputProps={moneyPrefix}
                value={txFee}
                onChange={e => setTxFee(e.target.value)}
            />
        </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
        </>
    );
}


export default function TransactionDialog(props) {
    /* Expected props:
    onClose - Callback when dialog is closed
    open    - Whether the dialog is "open" or not
    lstate  - Current Ledger State
    id      - Account ID for signing transactions
    sendTx  - Callback for submitting the transaction
    */
    const { onClose, open, lstate, id, sendTx } = props;

    const handleClose = () => {
        onClose();
    };

    const handleSendTx = () => {
        sendTx();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth={true}
        >
            <CoinTransferForm lstate={lstate} id={id} sendTx={handleSendTx} onCancel={handleClose} />
        </Dialog>
    );
}
