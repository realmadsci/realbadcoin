// Peer-to-peer comms using peerjs
import * as React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

import { Emoji } from 'emoji-mart';

import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
} from './util/RealBadCoin.tsx';

export default function TransactionView(props) {
    const {tx, expanded, lstate} = props;

    const renderSmall = (tx)=>{
        const d = tx.txData;
        if (d instanceof RealBadCoinTransfer) {
            return (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{width: 200, flexGrow: 1}}
                    justifyContent="space-between"
                >
                    <Typography noWrap variant="hexblob">{tx.source}</Typography>
                    <NavigateNextRoundedIcon />
                    <Typography noWrap variant="hexblob">{d.destination}</Typography>
                    <Typography whiteSpace="nowrap">{"\u211C " + d.amount.toString()}</Typography>
                </Stack>
            );
        }
        else if (d instanceof RealBadNftMint) {
            return (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{width: 200, flexGrow: 1}}
                    justifyContent="space-between"
                >
                    <Emoji
                        size={24}
                        emoji={d.nftData.emoji}
                    />
                    <Typography noWrap variant="hexblob">{d.nftId}</Typography>
                    <Typography whiteSpace="nowrap">{"\u211C " + tx.transactionFee.toString()}</Typography>
                </Stack>
            );
        }
        else if (d instanceof RealBadNftTransfer) {
            return (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{width: 200, flexGrow: 1}}
                    justifyContent="space-between"
                >
                    <Emoji
                        size={24}
                        emoji={lstate.nftPayloads[tx.txData.nftId].emoji}
                    />
                    <Typography noWrap variant="hexblob">{tx.source}</Typography>
                    <NavigateNextRoundedIcon />
                    <Typography noWrap variant="hexblob">{tx.txData.destination}</Typography>
                    <Typography whiteSpace="nowrap">{"\u211C " + tx.transactionFee.toString()}</Typography>
                </Stack>
            );
        }
        else return null;
    };

    const renderTxData = (d)=>{
        /* Available fields in txData:
        RealBadCoinTransfer
        destination = null; // Destination account ID (public key)
        amount = 0;         // Amount of RealBadCoin to transfer (floating point number)

        RealBadNftMint
        nftData = null;     // Any data we want to "mint" as an NFT. Can be a string, and object, whatever...
        nftId = null;       // The ID (hash) of the `nftData` object. Must a globally unique number on the block chain (so nftData must be unique).

        RealBadNftTransfer
        nftId = null;       // The ID (hash) of the NFT. Must already be minted before it can be transferred.
        destination = null; // Destination account ID (public key) for the new owner of the NFT.
        */
        if (d instanceof RealBadCoinTransfer) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="Destination"
                    secondary={d.destination}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Amount"
                    secondary={"\u211C " + d.amount.toString()}
                />
                </ListItem>
                </>
            );
        }
        else if (d instanceof RealBadNftMint) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="ID"
                    secondary={d.nftId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Content"
                    secondary={JSON.stringify(d.nftData)}
                />
                </ListItem>
                </>
            );
        }
        else if (d instanceof RealBadNftTransfer) {
            return (
                <>
                <ListItem>
                <ListItemText
                    primary="ID"
                    secondary={d.nftId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="Destination"
                    secondary={d.destination}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
                </ListItem>
                </>
            );
        }
        else return null;
    };

    /* Available fields in RealBadTransaction:
    source = null;          // Source account ID (public key)
    sourceNonce = 0;        // Source account transaction nonce. Used to ensure transactions (including transactionFees) apply IN ORDER.
                            // Must be sequentially incrementing or transaction will be ignored.
                            // nonce is NOT REQURIED and NOT UPDATED if no coins are spent (txFee or transfer).
    timestamp = null;       // Time when the transaction is created. Miners will only propagate and process transactions during a certain time window.
    transactionFee = 0;     // Fee to be paid to the miner if this transaction is accepted into a block. Miners _might_ not accept transactions without fees!
    txData = null;          // The data portion of the transaction. One of the valid transaction object types must go here.
    txId = null;            // Hash of `[source, timestamp, transactionFee, txData]`. This serves as the unique ID for the transaction.
    signature = null;       // Signature of `txId` using the `source` account.
    */

    if (tx === undefined) return null;

    // Show the "preview size" unless it is "expanded"
    if (!expanded) return renderSmall(tx);

    return (
        <List component="div" disablePadding>
        <ListItem>
            <ListItemText
                primary="Transaction ID"
                secondary={tx.txId}
                secondaryTypographyProps={{variant: "hexblob"}}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Transaction Time"
                secondary={tx.timestamp.toLocaleString()}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Transaction Fee"
                secondary={"\u211C " + tx.transactionFee.toString()}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Source"
                secondary={tx.source}
                secondaryTypographyProps={{variant: "hexblob"}}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Source Nonce"
                secondary={tx.sourceNonce}
            />
        </ListItem>
        {renderTxData(tx.txData)}
        </List>
    );
}
