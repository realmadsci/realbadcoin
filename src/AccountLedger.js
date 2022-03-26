// Show the history of an account - all balance-modifying events with links to blocks on the block chain
import React, { useState } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

import { Emoji } from 'emoji-mart';

import {
    RealBadCoinTransfer,
    RealBadNftMint,
    RealBadNftTransfer,
    RealBadTransaction,
} from './util/RealBadCoin.tsx';

// Show an accordion item with account ID and balance
function BlockReward(props) {
    const {block, delta, onClick} = props;

    return (
        <Stack
            direction="row"
            spacing={1}
            justifyContent="space-between"
            onClick={()=>onClick(block)}
            sx={{
                cursor: "pointer",
            }}
        >
            <AccountTreeRoundedIcon />
            <Typography noWrap variant="hexblob">{block}</Typography>
            <Typography whiteSpace="nowrap">{"\u211C " + delta.toString()}</Typography>
        </Stack>
    );
}

function TransactionEvent(props) {
    const {txId, delta, lstate, cache, onClick} = props;
    const [blockHash, setBlockHash] = React.useState(null);
    const [tx, setTx] = React.useState(null);
    const [grabbingTx, setGrabbingTx] = React.useState(false);

    const grabTx = async ()=>{
        const blockHashes = await cache.getBlocksWithTransaction(txId);
        // Find which block has non-zero confirmations. That's the one we want!
        const blockConfirmations = await Promise.all(blockHashes.map(async h=>cache.getConfirmations(h)));
        const goodBlock = blockConfirmations.findIndex(c=>(c>0));
        if (goodBlock >= 0) {
            const goodHash = blockHashes[goodBlock];
            setBlockHash(goodHash);
            const b = (await cache.getBlocks([goodHash]))[0];
            setTx(RealBadTransaction.coerce(b.transactions.find(tx=>(tx.txId === txId))));
        }
    };

    if (!tx){
        if (!grabbingTx) {
            setGrabbingTx(true);
            grabTx();
        }
        return null;
    }

    if (tx.txData instanceof RealBadCoinTransfer) {
        return (
            <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                onClick={()=>onClick(blockHash)}
                sx={{
                    cursor: "pointer",
                }}
            >
                <AccountBalanceRoundedIcon />
                <Typography noWrap variant="hexblob">{tx.source}</Typography>
                <NavigateNextRoundedIcon />
                <Typography noWrap variant="hexblob">{tx.txData.destination}</Typography>
                <Typography whiteSpace="nowrap">{"\u211C " + delta.toString()}</Typography>
            </Stack>
        );
    }
    else if (tx.txData instanceof RealBadNftMint) {
        return (
            <Stack
                direction="row"
                spacing={1}
                onClick={()=>onClick(blockHash)}
                sx={{
                    cursor: "pointer",
                }}
                justifyContent="space-between"
            >
                <Emoji
                    size={24}
                    emoji={tx.txData.nftData.emoji}
                />
                <Typography noWrap variant="hexblob">{tx.txData.nftId}</Typography>
                <Typography whiteSpace="nowrap">{"\u211C " + delta.toString()}</Typography>
            </Stack>
        );
    }
    else if (tx.txData instanceof RealBadNftTransfer) {
        return (
            <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                onClick={()=>onClick(blockHash)}
                sx={{
                    cursor: "pointer",
                }}
            >
                <Emoji
                    size={24}
                    emoji={lstate.nftPayloads[tx.txData.nftId].emoji}
                />
                <Typography noWrap variant="hexblob">{tx.source}</Typography>
                <NavigateNextRoundedIcon />
                <Typography noWrap variant="hexblob">{tx.txData.destination}</Typography>
                <Typography whiteSpace="nowrap">{"\u211C " + delta.toString()}</Typography>
            </Stack>
        );
    }
    else return null;
}

export default function AccountLedger(props) {
    const {cache, lstate, onClick} = props;

    // No valid state yet, so return "nothing"
    if (!lstate?.accountLedger) return null;

    return (
        <Stack
            spacing={1}
            sx={{
                p:2,
                alignItems: "stretch",
            }}
        >
        {
            lstate.accountLedger.map(l=>{
                if ("block" in l) return (
                    <BlockReward
                        key={l.block}
                        block={l.block}
                        delta={l.delta}
                        onClick={onClick}
                    />
                );
                if ("txId" in l) return (
                    <TransactionEvent
                        key={l.txId}
                        txId={l.txId}
                        delta={l.delta}
                        lstate={lstate}
                        cache={cache}
                        onClick={onClick}
                    />
                );
            }).reverse()
        }
        </Stack>
    );
}
