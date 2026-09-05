import { describe, expect, it } from 'vitest';
import { addNodeToFlow, deleteNodeFromFlow } from './flowBuilderActions.js';

const existingNodes = [
  { id: 'sensor-1', type: 'sensor' },
  { id: 'average-1', type: 'movingAverage' },
];

const existingEdges = [
  { id: 'e1', source: 'sensor-1', target: 'average-1' },
  { id: 'e2', source: 'average-1', target: 'threshold-1' },
];

const newNode = { id: 'threshold-2', type: 'threshold' };

describe('Flow Builder actions', () => {
  it('deletes a node and every edge connected to it', () => {
    expect(deleteNodeFromFlow(existingNodes, existingEdges, 'average-1')).toEqual({
      nodes: [{ id: 'sensor-1', type: 'sensor' }],
      edges: [],
    });
  });

  it('adds a node to an empty canvas without confirmation', () => {
    expect(addNodeToFlow([], newNode, false)).toEqual({
      action: 'add',
      nodes: [newNode],
    });
  });

  it('asks only when the confirmation decision has not been made', () => {
    expect(addNodeToFlow(existingNodes, newNode, null)).toEqual({
      action: 'confirm',
      node: newNode,
    });
  });

  it('clears the canvas when the user chooses clear', () => {
    expect(addNodeToFlow(existingNodes, newNode, true)).toEqual({
      action: 'clear-and-add',
      nodes: [newNode],
    });
  });

  it('adds to the existing canvas when the user chooses keep', () => {
    expect(addNodeToFlow(existingNodes, newNode, false)).toEqual({
      action: 'add',
      nodes: [...existingNodes, newNode],
    });
  });
});
