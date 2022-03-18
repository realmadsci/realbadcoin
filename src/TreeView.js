// View contents of a single block
import * as React from 'react';

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';

import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';

import Tree from './components/react-d3-tree/Tree/index.tsx';

import ResizeDetector from 'react-resize-detector';

import {
    RealBadBlock
} from './util/RealBadCoin.tsx';


class TreeView extends React.Component {
    constructor(props) {
        super(props);

        // Props we expect:
        // cache = connection to the CacheWorker for block cache updates.
        // selected = hash of "selected" block
        // newBlockCounter = counter that increments whenever new blocks arrive.

        this.state = {
            data: {},
            height: 100,
            width: 100,
        };

        // Need to connect a resize detector down to the child Tree so it can
        this.treeContainer = React.createRef();
        this.onResize = (w, h)=>{
            this.setState({
                height: h,
                width: w,
            });
        };

        this._alreadyUpdating = false;
        this._needToUpdate = false;
    }

    async _updateTree() {
        if (!this.props.cache) return;

        // If we're in the middle of updating, just signal ourselves to update
        // again when it's done.
        if (this._alreadyUpdating) {
            this._needToUpdate = true;
            return;
        }

        this._alreadyUpdating = true;
        try {
            // From whatever node is selected, walk up to its parent node and then show a few layers of children
            const sel = this.props.selected;

            // Walk up to N parents above me!
            const parentChain = await this.props.cache.getChain(sel, null, 15);

            // If there _is_ no chain returned, then this block is invalid!
            if (parentChain.length === 0) {
                this.setState({data: {}});
                return;
            }
            const parent = parentChain[0];

            // Recursively grab children and build a tree
            const newData = await this._makeTreeFromBlock(parent, sel, 30);
            this.setState({
                data: newData,
            });
        }
        finally {
            this._alreadyUpdating = false;
        }

        // If we got another call to _updateTree() while we were running, trigger it to be started.
        if (this._needToUpdate) {
            this._needToUpdate = false;
            setTimeout(()=>{this._updateTree()}, 0);
        }
    }

    async _makeTreeFromBlock(hash, selected, depth) {
        const bi = await this.props.cache.getBlockInfo(hash);
        return {
            name: "..." + RealBadBlock.coerce(bi.block).hash.slice(-4),
            attributes: {
                confirm: await this.props.cache.getConfirmations(hash),
                miner: bi.block.rewardDestination.slice(0,4),
                selected: (hash === selected) ? true : undefined,
            },
            children: (depth > 1) && bi.state.children.length ? await Promise.all(bi.state.children.map(async h=>this._makeTreeFromBlock(h, selected, depth-1))) : undefined,
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if ((this.state.data === {}) ||
            (this.props.selected !== prevProps.selected) ||
            (this.props.newBlockCounter !== prevProps.newBlockCounter)
        ) {
            //TODO: Maybe find a way to track and/or cancel these updates???
            this._updateTree();
        }
    }

    componentDidMount() {
        //TODO: Maybe find a way to track and/or cancel these updates???
        this._updateTree();
    }

    render() {
        // Make a tree of nodes based on the actual cache info
        return (
            <Box
                ref={this.treeContainer}
                sx={{
                    position: "relative",
                    height: 1,
                    width: 1,
                    p: 1,
                }}
            >
                <ResizeDetector
                    targetDomEl={this.treeContainer.current} onResize={this.onResize}
                    handleWidth
                    handleHeight
                />
                <Tree
                    data={this.state.data}
                    nodeSize={{x: 100, y:100}}
                    separation={{siblings: 0.6, nonSiblings: 0.6}}
                    dimensions={{
                        height: this.state.height,
                        width: this.state.width,
                    }}
                    collapsible={false}
                    zoomable={false}
                    scrollable={false}
                    onNodeClick={(n,e)=>{
                        console.log("Node clicked");
                    }}
                >
                </Tree>
                <Fab
                    size="small"
                    aria-label="follow"
                    sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                    }}
                >
                    <AutorenewRoundedIcon />
                </Fab>
            </Box>
        );
    }
}

export default TreeView;
