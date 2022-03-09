// View contents of a single block
import * as React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import {
    RealBadBlock
} from './util/RealBadCoin.tsx';

function BlockView(props) {
    /* Available fields in RealBadBlock:
    prevHash = '00'.repeat(32); // Hash of previous block. It is included in this block to form a block-chain.
    blockHeight = 0;            // How far we are "above" the genesis block. This is previous block's height + 1.
    timestamp = null;           // Time of last update to the block (prior to hash computation). This is mainly for display purposes.
    transactions = [];          // List of all transactions in the block
    miningReward = 100;         // Base reward claimed for mining this block
    rewardDestination = null;   // Miner's destination account ID (public key) for mining reward and transaction fees.
    difficulty = 256**2;        // Required difficulty for hash. Increasing this makes it harder to find a valid hash. For example, setting this to 256**N will require the top N bytes of the hash to be zeros.
    nonce = 0;                  // Number that can be changed to cause block's hash to vary
    */

    let hash = props.hash;
    let b = props.block;
    let s = props.lstate;
    // No block yet, so return "nothing"
    if (b === null || s === null) return (
        <List component="div" disablePadding>
        <ListItem>
            <ListItemText
                primary="waiting for first block"
            />
        </ListItem>
        </List>
    );

    return (
        <List component="div" disablePadding>
        <ListItem>
            <ListItemText
                primary={"Block " + b.blockHeight}
                secondary={hash}
                secondaryTypographyProps={{variant: "hexblob"}}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Previous Block"
                secondary={b.prevHash}
                secondaryTypographyProps={{variant: "hexblob"}}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Creation Time"
                secondary={b.timestamp.toLocaleString()}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Mined By"
                secondary={b.rewardDestination}
                secondaryTypographyProps={{variant: "hexblob"}}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Block Reward"
                secondary={"\u211C" + b.miningReward.toString()}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Nonce"
                secondary={b.nonce}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Target Difficulty"
                secondary={b.difficulty.toString()}
            />
        </ListItem>
        <ListItem>
            <ListItemText
                primary="Difficulty Metric"
                secondary={RealBadBlock.difficultyMetric(hash).toString()}
            />
        </ListItem>
        </List>
    );
}

export default BlockView;
