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
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

import './emoji-mart.css';
import { Emoji, Picker } from 'emoji-mart';

import { hexToBytes } from '@noble/hashes/utils';

import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
} from './util/RealBadCoin.tsx';

function DisplayInvalidTransaction(props) {
    const { header, message, onBack } = props;

    return (
        <>
        <DialogTitle>{header}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {message}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onBack}>Back</Button>
        </DialogActions>
        </>
    );
}

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

const moneyPrefix = {
    startAdornment: (
        <InputAdornment position="start">
        {"\u211C"}
        </InputAdornment>
    ),
};

export function CoinTransferDialog(props) {
    /* Expected props:
    open    - Whether the dialog is "open" or not
    lstate  - Current Ledger State
    sendTx  - Callback for submitting the transaction
    onClose - Callback when dialog is closed
    */
    const { open, lstate, sendTx, onClose } = props;

    const [error, setError] = React.useState("");
    const [dest, setDest] = React.useState("");
    const [amount, setAmount] = React.useState(1);
    const [txFee, setTxFee] = React.useState(0);

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

        let tx = new RealBadTransaction();
        tx.txData = new RealBadCoinTransfer();
        tx.txData.destination = dest.toLowerCase(); // Hm... you can "burn" money pretty easily!
        tx.txData.amount = Number(amount);
        tx.transactionFee = Number(txFee);

        if (await sendTx(tx)) {
            onClose();
        }
        else setError("Transaction sendTx() call failed. That's all I got atm.");
    };

    const accountList = Object.keys(lstate?.accounts ?? {}).map(v=>v.toUpperCase());

    // Flip to full screen if we can't get at least "sm" width:
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));    

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="md"
            scroll="body"
            fullWidth={true}
        >
        { error ? (
            <DisplayInvalidTransaction
                header="Coin Transfer Failed"
                message={error}
                onBack={()=>setError("")}
            />
        ) : (
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Submit</Button>
            </DialogActions>
            </>
        )}
        </Dialog>
    );
}


export function MintNftDialog(props) {
    /* Expected props:
    open    - Whether the dialog is "open" or not
    lstate  - Current Ledger State
    sendTx  - Callback for submitting the transaction
    onClose - Callback when dialog is closed
    */
    const { open, lstate, sendTx, onClose } = props;

    const [error, setError] = React.useState("");
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const [emoji, setEmoji] = React.useState(":shrug:");
    const [txFee, setTxFee] = React.useState(0);

    const handleSubmit = async()=>{
        // Pre-check of transaction fields to rule out obvious nonsense and give good error messages.
        // NOTE: Check in order of the fields so we give the error for the FIRST thing that they got wrong in the top-down order.
        const nft = new RealBadNftMint();
        nft.nftData = {emoji: emoji}
        nft.nftId = nft.hash();

        // See if the NFT is already "minted". We can't do it again!
        if (nft.nftId in lstate.nfts) {
            setError("This NFT is already claimed!");
            return;
        }

        if (!validateFee(txFee)) {
            setError("Transaction fee must be a non-negative finite number");
            return;
        }

        let tx = new RealBadTransaction();
        tx.txData = nft;
        tx.transactionFee = Number(txFee);

        if (await sendTx(tx)) {
            onClose();
        }
        else setError("Transaction sendTx() call failed. That's all I got atm.");
    };

    // Flip to full screen if we can't get at least "sm" width:
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));    

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="sm"
            scroll="body"
            fullWidth={true}
        >
        { error ? (
            <DisplayInvalidTransaction
                header="NFT Mint Failed"
                message={error}
                onBack={()=>setError("")}
            />
        ) : (
            <>
            <DialogTitle>
                Mint NFT
            </DialogTitle>
            <DialogContent>
                <Stack
                    component="form"
                    autoComplete="off"
                    spacing={2}
                    sx={{
                        p:2,
                    }}
                >
                    {
                        pickerOpen ? (
                            <Picker
                                theme="auto"
                                style={{alignSelf: "center"}}
                                showSkinTones={false}
                                showPreview={false}
                                onSelect={(emoji)=>{
                                    setEmoji(emoji.colons);
                                    setPickerOpen(false);
                                }}
                            />
                        ) : (
                            <Emoji
                                size={64}
                                emoji={emoji}
                                onClick={()=>{
                                    setPickerOpen(true);
                                }}
                            />
                        )
                    }
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Submit</Button>
            </DialogActions>
            </>
        )}
        </Dialog>
    );
}


export function TransferNftDialog(props) {
    /* Expected props:
    open    - Whether the dialog is "open" or not
    nftId   - Which NFT to transfer
    emoji   - The emoji for this NFT
    lstate  - Current Ledger State
    sendTx  - Callback for submitting the transaction
    onClose - Callback when dialog is closed
    */
    const { open, nftId, emoji, lstate, sendTx, onClose } = props;

    const [error, setError] = React.useState("");
    const [dest, setDest] = React.useState("");
    const [txFee, setTxFee] = React.useState(0);

    const handleSubmit = async()=>{
        // Pre-check of transaction fields to rule out obvious nonsense and give good error messages.
        // NOTE: Check in order of the fields so we give the error for the FIRST thing that they got wrong in the top-down order.
        if (!validateDest(dest)) {
            setError("Destination must be a 32-byte hex number (64 characters)");
            return;
        }

        if (!validateFee(txFee)) {
            setError("Transaction fee must be a non-negative finite number");
            return;
        }

        let tx = new RealBadTransaction();
        tx.txData = new RealBadNftTransfer();
        tx.txData.nftId = nftId.toLowerCase();
        tx.txData.destination = dest.toLowerCase();
        tx.transactionFee = Number(txFee);

        if (await sendTx(tx)) {
            onClose();
        }
        else setError("Transaction sendTx() call failed. That's all I got atm.");
    };

    const accountList = Object.keys(lstate?.accounts ?? {}).map(v=>v.toUpperCase());

    // Flip to full screen if we can't get at least "sm" width:
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));    

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="md"
            scroll="body"
            fullWidth={true}
        >
        { error ? (
            <DisplayInvalidTransaction
                header="NFT Transfer Failed"
                message={error}
                onBack={()=>setError("")}
            />
        ) : (
            <>
            <DialogTitle>
                Send NFT
            </DialogTitle>
            <DialogContent>
            <Stack
                component="form"
                autoComplete="off"
                spacing={2}
                sx={{p:2}}
            >
                <Emoji
                    size={64}
                    emoji={emoji}
                    style={{alignSelf: "center"}}
                />
                <Autocomplete
                    freeSolo
                    options={accountList}
                    renderInput={(params)=>
                        <TextField
                            {...params}
                            label="Destination Wallet"
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
                    label="Transaction Fee"
                    type="number"
                    InputProps={moneyPrefix}
                    value={txFee}
                    onChange={e => setTxFee(e.target.value)}
                />
            </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Submit</Button>
            </DialogActions>
            </>
        )}
        </Dialog>
    );
}
