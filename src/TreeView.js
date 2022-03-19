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
        // nodeSelected = callback for new selected node
        // isFollowing = whether we are set to auto-follow or not
        // enableFollow = callback when the "auto sync" button is clicked

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
            const newData = await this._makeTreeFromBlock(parent, 30);
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

    async _makeTreeFromBlock(hash, depth) {
        const bi = await this.props.cache.getBlockInfo(hash);
        let cssClasses = "";
        if (await this.props.cache.getConfirmations(hash) > 3) cssClasses += " block-safe";
        else if (await this.props.cache.getConfirmations(hash)) cssClasses += " block-accepted";

        return {
            name: hash,
            attributes: {
                cssClasses: cssClasses,
            },
            children: (depth > 1) && bi.state.children.length ? await Promise.all(bi.state.children.map(async h=>this._makeTreeFromBlock(h, depth-1))) : undefined,
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
                    "& .rd3t-tree-container circle": {
                        stroke: theme=>theme.palette.text.primary,
                        fill: "transparent",
                        r: 12,
                        strokeWidth: 1.5,
                    },
                    "& .rd3t-tree-container path": {
                        stroke: theme=>theme.palette.text.primary,
                        strokeWidth: 1.5,
                    },
                    "& .block-safe circle": {
                        fill: theme=>theme.palette.primary.main,
                    },
                    "& .block-accepted circle": {
                        fill: theme=>theme.palette.primary.main,
                        opacity: 0.5,
                    },
                    "& .rd3t-node-selected circle": {
                        //stroke: theme=>theme.palette.secondary.dark,
                        strokeWidth: 5,
                    },
                    "& .rd3t-label": {
                        display: "none",
                    },
                }}
            >
                <ResizeDetector
                    targetDomEl={this.treeContainer.current} onResize={this.onResize}
                    handleWidth
                    handleHeight
                />
                <Tree
                    data={this.state.data}
                    nodeSize={{x: 8*6, y:8*6}}
                    selectedNode={this.props.selected}
                    separation={{siblings: 0.8, nonSiblings: 0.8}}
                    dimensions={{
                        height: this.state.height,
                        width: this.state.width,
                    }}
                    collapsible={false}
                    zoomable={false}
                    scrollable={false}
                    transitionDuration={0}
                    centeringTransitionDuration={500}
                    onNodeClick={(n,e)=>{
                        this.props.nodeSelected(n.data.name);
                    }}
                >
                </Tree>
                {this.props.isFollowing ? null : (
                    <Fab
                    size="small"
                    aria-label="follow"
                    color="primary"
                    onClick={this.props.enableFollow}
                    sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                    }}
                    >
                        <AutorenewRoundedIcon />
                    </Fab>
                )}
            </Box>
        );
    }
}

export default TreeView;
