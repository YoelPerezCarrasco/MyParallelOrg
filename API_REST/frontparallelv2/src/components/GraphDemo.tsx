import React from 'react';
import { GraphCanvas, lightTheme } from 'reagraph';
import {
  clusterNodes,
  singleNodeClusterNodes,
  imbalancedClusterNodes,
  manyClusterNodes,
  random,
} from '../data/nodes';
import { clusterEdges } from '../data/edges';

export const Simple: React.FC = () => (
  <GraphCanvas nodes={clusterNodes} draggable edges={[]} clusterAttribute="type" />
);

const clusterNodesWithSizes = clusterNodes.map((node) => ({
  ...node,
  size: random(0, 50),
}));

export const Sizes: React.FC = () => (
  <GraphCanvas nodes={clusterNodesWithSizes} draggable edges={[]} clusterAttribute="type" />
);

export const SingleNodeClusters: React.FC = () => (
  <GraphCanvas nodes={singleNodeClusterNodes} draggable edges={[]} clusterAttribute="type" />
);

export const ImbalancedClusters: React.FC = () => (
  <GraphCanvas nodes={imbalancedClusterNodes} draggable edges={[]} clusterAttribute="type" />
);

export const LargeDataset: React.FC = () => (
  <GraphCanvas nodes={manyClusterNodes} draggable edges={[]} clusterAttribute="type" />
);

export const Edges: React.FC = () => (
  <GraphCanvas nodes={clusterNodes} draggable edges={clusterEdges} clusterAttribute="type" />
);

export const Selections: React.FC = () => (
  <GraphCanvas nodes={clusterNodes} selections={[clusterNodes[0].id]} edges={clusterEdges} clusterAttribute="type" />
);

export const Events: React.FC = () => (
  <GraphCanvas
    nodes={clusterNodes}
    draggable
    edges={clusterEdges}
    clusterAttribute="type"
    onClusterPointerOut={(cluster) => console.log('cluster pointer out', cluster)}
    onClusterPointerOver={(cluster) => console.log('cluster pointer over', cluster)}
    onClusterClick={(cluster) => console.log('cluster click', cluster)}
  />
);

export const NoBoundary: React.FC = () => (
  <GraphCanvas
    theme={{
      ...lightTheme,
      cluster: undefined,
    }}
    nodes={clusterNodes}
    draggable
    edges={clusterEdges}
    clusterAttribute="type"
  />
);

export const NoLabels: React.FC = () => (
  <GraphCanvas
    theme={{
      ...lightTheme,
      cluster: {
        ...lightTheme.cluster,
      },
    }}
    nodes={clusterNodes}
    draggable
    edges={clusterEdges}
    clusterAttribute="type"
  />
);

export const LabelsOnly: React.FC = () => (
  <GraphCanvas
    theme={{
      ...lightTheme,
      cluster: {
        ...lightTheme.cluster,
        stroke: undefined,
      },
    }}
    nodes={clusterNodes}
    draggable
    edges={clusterEdges}
    clusterAttribute="type"
  />
);

export const ThreeDimensions: React.FC = () => (
  <GraphCanvas
    nodes={clusterNodesWithSizes}
    draggable
    edges={[]}
    layoutType="forceDirected3d"
    clusterAttribute="type"
  >
    <directionalLight position={[0, 5, -4]} intensity={1} />
  </GraphCanvas>
);

export const Partial: React.FC = () => (
  <GraphCanvas nodes={clusterNodes} draggable edges={[]} clusterAttribute="segment" />
);
