// View contents of a single block
import * as React from 'react';

import Tree from 'react-d3-tree';

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
        };
    }

    async _updateTree() {
        if (!this.props.cache) return;

        // From whatever node is selected, walk up to its parent node and then show a few layers of children
        const sel = this.props.selected;

        // Walk up to N parents above me!
        const parentChain = await this.props.cache.getChain(sel, null, 4);

        // If there _is_ no chain returned, then this block is invalid!
        if (parentChain.length === 0) {
            this.setState({data: {}});
            return;
        }
        console.log("length = " + parentChain.length.toString());
        const parent = parentChain[0];

        // Recursively grab children and build a tree
        const newData = await this._makeTreeFromBlock(parent, 4);
        this.setState({
            data: newData,
        });
        console.log(newData);
    }

    async _makeTreeFromBlock(hash, depth) {
        const bi = await this.props.cache.getBlockInfo(hash);
        return {
            name: RealBadBlock.coerce(bi.block).hash,
            attributes: {
                height: bi.block.blockHeight,
                confirmations: await this.props.cache.getConfirmations(hash),
                miner: bi.block.rewardDestination,
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

    render() {
        // Make a tree of nodes based on the actual cache info
        return (
            <Tree
                data={this.state.data}
            />
        );
    }
}

export default TreeView;
