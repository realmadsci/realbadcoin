import React from 'react';
import { CustomNodeElementProps, SyntheticEventHandler } from '../types/common';

const DEFAULT_NODE_CIRCLE_RADIUS = 16;

const textLayout = {
  title: {
    textAnchor: 'start',
    x: 40,
  },
  attribute: {
    x: 40,
    dy: '1.2em',
  },
};

export interface DefaultNodeElementProps extends CustomNodeElementProps {}

const DefaultNodeElement: React.FunctionComponent<DefaultNodeElementProps> = ({
  nodeDatum,
  toggleNode,
  onNodeClick,
  onNodeMouseOver,
  onNodeMouseOut,
}) => (
  <>
    <rect
      rx={DEFAULT_NODE_CIRCLE_RADIUS/4}
      ry={DEFAULT_NODE_CIRCLE_RADIUS/4}
      width={2*DEFAULT_NODE_CIRCLE_RADIUS}
      height={2*DEFAULT_NODE_CIRCLE_RADIUS}
      onClick={evt => {
        toggleNode();
        onNodeClick(evt);
      }}
      onMouseOver={onNodeMouseOver}
      onMouseOut={onNodeMouseOut}
    ></rect>
    <g className="rd3t-label">
      <text className="rd3t-label__title" {...textLayout.title}>
        {nodeDatum.name}
      </text>
      <text className="rd3t-label__attributes">
        {nodeDatum.attributes &&
          Object.entries(nodeDatum.attributes).map(([labelKey, labelValue], i) => (
            <tspan key={`${labelKey}-${i}`} {...textLayout.attribute}>
              {labelKey}: {typeof labelValue === 'boolean' ? labelValue.toString() : labelValue}
            </tspan>
          ))}
      </text>
    </g>
  </>
);

export default DefaultNodeElement;
