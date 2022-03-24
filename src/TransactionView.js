// Peer-to-peer comms using peerjs
import * as React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
} from './util/RealBadCoin.tsx';

class TransactionView extends React.Component {
    constructor(props) {
        super(props);
    }

    static renderSmall(tx) {
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
            <Typography noWrap>TODO: Implement NFT Mint small view</Typography>
        }
        else if (d instanceof RealBadNftTransfer) {
            <Typography noWrap>TODO: Implement NFT Transfer small view</Typography>
        }
        else return null;
    }

    static renderTxData(d) {
        /* Available fields in txData:
        RealBadCoinTransfer
        destination = null; // Destination account ID (public key)
        amount = 0;         // Amount of RealBadCoin to transfer (floating point number)

        RealBadNftMint
        nftData = null;     // Any data we want to "mint" as an NFT. Can be a string, and object, whatever...
        nftId = null;       // The ID (hash) of the `nftData` object. Must a globally unique number on the block chain (so nftData must be unique).

        RealBadNftTransfer
        nftId = null;       // The ID (hash) of the NFT. Must already be minted before it can be transferred.
        nftNonce = 0;       // Incrementing number specifying transfer count for this NFT. Must be sequentually incrementing or the transaction will be ignored.
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
                    secondary={d.nftData.toString()}
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
                <ListItem>
                <ListItemText
                    primary="NFT Nonce"
                    secondary={d.nftNonce}
                />
                </ListItem>
                </>
            );
        }
        else return null;
    }

    render() {
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

        if (this.props.tx === undefined) return null;

        // Show the "preview size" unless it is "expanded"
        if (!this.props.expanded) return TransactionView.renderSmall(this.props.tx);

        return (
            <List component="div" disablePadding>
            <ListItem>
                <ListItemText
                    primary="Transaction ID"
                    secondary={this.props.tx.txId}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Transaction Time"
                    secondary={this.props.tx.timestamp.toLocaleString()}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Transaction Fee"
                    secondary={"\u211C " + this.props.tx.transactionFee.toString()}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Source"
                    secondary={this.props.tx.source}
                    secondaryTypographyProps={{variant: "hexblob"}}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary="Source Nonce"
                    secondary={this.props.tx.sourceNonce}
                />
            </ListItem>
            {TransactionView.renderTxData(this.props.tx.txData)}
            </List>
        );
    }
}

export default TransactionView;
