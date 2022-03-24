// View contents of a single block
import React, { useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


// Show an accordion item with account ID and balance
function AccountBalance(props) {
    const {account, balance, nonce} = props;

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{width: 200, flexGrow: 1}}
                    justifyContent="space-between"
                >
                    <Typography noWrap variant="hexblob">{account}</Typography>
                    <Typography whiteSpace="nowrap">{"\u211C " + balance.toString()}</Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{p:0}}>
                <ListItem>
                    <ListItemText
                        primary="Account ID"
                        secondary={account}
                        secondaryTypographyProps={{variant: "hexblob"}}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary="Last Nonce"
                        secondary={nonce}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary="Balance"
                        secondary={"\u211C " + balance.toString()}
                    />
                </ListItem>
            </AccordionDetails>
        </Accordion>
    );
}


export default function BalanceSummary(props) {
    const {lstate} = props;

    // No valid state yet, so return "nothing"
    if (!lstate?.accounts) return null;

    return (
        <>
        {
            Object.keys(lstate.accounts).map(a=>(
                <AccountBalance
                    key={a}
                    account={a}
                    balance={lstate.accounts[a].balance}
                    nonce={lstate.accounts[a].nonce}
                />
            ))
        }
        </>
    );
}
