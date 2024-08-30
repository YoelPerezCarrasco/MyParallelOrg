import { range } from 'd3-array';
import { GraphNode } from 'reagraph';
import demonSvg from './demon.svg';
import computerSvg from './computer.svg';

export const random = (floor: number, ceil: number) => Math.floor(Math.random() * ceil) + floor;

const types = ['IP', 'URL', 'Email', 'MD5'] as const;
const colors = ['#3730a3', '#c2410c', '#166534', '#075985'];

export const clusterNodes: GraphNode[] = range(25).map((i) => {
  const idx = random(0, types.length);
  const type = types[idx];
  
  return {
    id: `n-${i}`,
    label: `${types[i]} ${i}`,
    fill: colors[idx],
    size: i % 2 === 0 ? 50 : 25,
    icon: i % 2 === 0 ? computerSvg : demonSvg,
    data: {
      type ,
      segment: i % 2 === 0 ? 'A' : undefined,
    },
  };
});

export const computerNodes: GraphNode[] = range(12).map((i) => {
  const idx = random(0, types.length);
  const type = types[idx];
  
  return {
    id: `comp-${i}`,
    label: `${types[i]} ${i}`,
    fill: colors[idx],
    size: 50,
    icon: computerSvg,
    data: {
      type,
      segment: 'ComputerCluster',
    },
  };
});

// Generar nodos con demonSvg
export const demonNodes: GraphNode[] = range(13).map((i) => {
  const idx = random(0, types.length);
  const type = types[idx];
  
  return {
    id: `demon-${i}`,
    label: `${types[i]} ${i}`,
    fill: colors[idx],
    size: 25,
    icon: demonSvg,
    data: {
      type,
      segment: 'DemonCluster',
    },
  };
});

export const singleNodeClusterNodes: GraphNode[] = range(2).map((i) => ({
  id: `n-${i}`,
  label: `${types[i]} ${i}`,
  fill: colors[i],
  data: { type: types[i] },
}));

export const imbalancedClusterNodes: GraphNode[] = range(20).map((i) => {
  const idx = i === 0 ? 2 : i % 2;
  const type = types[idx];

  return {
    id: `n-${i}`,
    label: `${type} ${i}`,
    fill: colors[idx],
    data: { type },
  };
});

const manyTypes = ['IPV4', 'URL', 'Email', 'MD5', 'SHA256', 'Domain', 'IPV6', 'CRC32', 'SHA512'];

export const manyClusterNodes: GraphNode[] = range(500).map((i) => {
  const idx = random(0, manyTypes.length);
  const type = manyTypes[idx];

  return {
    id: `n-${i}`,
    label: `${type} ${i}`,
    fill: colors[idx % colors.length],
    data: { type },
  };
});

export const iconNodes: GraphNode[] = range(5).map((i) => ({
  id: `n-${i}`,
  label: `Node ${i}`,
  size: i % 2 === 0 ? 50 : 25,
  icon: i % 2 === 0 ? computerSvg : demonSvg,
  data: { priority: random(0, 10) },
}));
