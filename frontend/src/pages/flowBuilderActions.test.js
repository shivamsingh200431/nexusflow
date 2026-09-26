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
    expect(addNodeToFlow([], newNode, null)).toEqual({
      action: 'add',
      nodes: [newNode],
    });
  });

  it('asks when adding to a saved flow without a confirmation decision', () => {
    expect(addNodeToFlow(existingNodes, newNode, null, true)).toEqual({
      action: 'confirm',
      node: newNode,
    });
  });

  it('does not ask on a new canvas even when multiple nodes exist', () => {
    expect(addNodeToFlow(existingNodes, newNode, null, false)).toEqual({
      action: 'add',
      nodes: [...existingNodes, newNode],
    });
  });

  it('clears the canvas when the user chooses clear', () => {
    expect(addNodeToFlow(existingNodes, newNode, true, true)).toEqual({
      action: 'clear-and-add',
      nodes: [newNode],
    });
  });

  it('adds to the existing canvas when the user chooses keep', () => {
    expect(addNodeToFlow(existingNodes, newNode, false, true)).toEqual({
      action: 'add',
      nodes: [...existingNodes, newNode],
    });
  });
});
