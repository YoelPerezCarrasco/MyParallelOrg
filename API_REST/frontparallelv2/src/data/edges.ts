import { range } from 'd3-array';
import { GraphEdge } from 'reagraph';
import { random, clusterNodes } from './nodes';

export const clusterEdges: GraphEdge[] = range(random(5, 25)).map((i) => ({
  id: `e-${i}`,
  source: `n-${i}`,
  target: `n-${random(0, clusterNodes.length - 1)}`,
  label: '0-1',
}));
