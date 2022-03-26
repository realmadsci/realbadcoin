// View contents of a single block
import React, { useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Emoji } from 'emoji-mart';

// Show an accordion item with account ID and balance
function AccountBalance(props) {
    const {account, balance, nonce, lstate} = props;

    let nfts = [];
    if (lstate !== null) {
        nfts = Object.keys(lstate.nfts).filter(k=>(lstate.nfts[k].owner === account));
    }

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
                <List>
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
                { (!nfts?.length) ? null : (<>
                    <Divider variant="fullWidth" />
                    <ListItem>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            paddingTop: 1,
                            paddingBottom: 1,
                        }}>
                        {
                            nfts.map(nftId=>{
                                return (
                                    <Emoji
                                        key={nftId}
                                        size={48}
                                        emoji={lstate.nftPayloads[nftId].emoji}
                                    />
                                );
                            })
                        }
                        </Box>
                    </ListItem>
                </>)}
                </List>
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
                    lstate={lstate}
                />
            ))
        }
        </>
    );
}
