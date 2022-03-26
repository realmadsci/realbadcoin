// View contents of a single block
import React, { useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import TransactionView from './TransactionView';

export default function PendingView(props) {
    /* Expected Props:
    lstate - Most up-to-date state (top of the chain)
    txPool - Pool of transactions
    account - Which account we care about, to filter down the pending list (optional)
    */
    const {lstate, txPool} = props;

    if (!lstate || !txPool) return null;

    let transactions = Object.values(txPool);

    // Filter down the list to only transactions which affect _us_:
    if (props?.account) transactions = transactions.filter(tx=>{
        if (tx.source === props.account) return true;
        if (tx?.txData?.destination === props.account) return true;
        return false;
    });

    if (!transactions.length) return null;
    return (
        <>
        <Box sx={{
            paddingTop: 1,
            paddingBottom: 1,
            paddingRight: 2,
            paddingLeft: 2,
        }}>
            <Typography variant="h5">Pending</Typography>
        </Box>
        {
            transactions.map(tx=>(
                <Accordion key={tx.txId}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <TransactionView
                            tx={tx}
                            expanded={false}
                            lstate={lstate}
                        />
                    </AccordionSummary>
                    <AccordionDetails sx={{p:0}}>
                        <TransactionView
                            tx={tx}
                            expanded={true}
                            lstate={lstate}
                        />
                    </AccordionDetails>
                </Accordion>
            ))
        }
        </>
    );
}
