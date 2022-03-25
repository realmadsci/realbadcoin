// Show the history of an account - all balance-modifying events with links to blocks on the block chain
import React, { useState } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

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
    const {txId, delta, cache, onClick} = props;
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
                <Typography noWrap variant="hexblob">{tx.source}</Typography>
                <NavigateNextRoundedIcon />
                <Typography noWrap variant="hexblob">{tx.txData.destination}</Typography>
                <Typography whiteSpace="nowrap">{"\u211C " + delta.toString()}</Typography>
            </Stack>
        );
    }
    else if (tx.txData instanceof RealBadNftMint) {
        <Typography noWrap>TODO: Implement NFT Mint ledger view</Typography>
    }
    else if (tx.txData instanceof RealBadNftTransfer) {
        <Typography noWrap>TODO: Implement NFT Transfer ledger view</Typography>
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
                        onClick={onClick}
                        cache={cache}
                    />
                );
            }).reverse()
        }
        </Stack>
    );
}
