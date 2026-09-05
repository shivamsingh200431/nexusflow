import { describe, expect, it, vi } from 'vitest';
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

  it('adds a node to an empty canvas without asking for confirmation', () => {
    const confirm = vi.fn();

    expect(addNodeToFlow([], newNode, confirm)).toEqual([newNode]);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before replacing a non-empty canvas and clears it when confirmed', () => {
    const confirm = vi.fn(() => true);

    expect(addNodeToFlow(existingNodes, newNode, confirm)).toEqual([newNode]);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('keeps the existing canvas when replacement is declined', () => {
    const confirm = vi.fn(() => false);

    expect(addNodeToFlow(existingNodes, newNode, confirm)).toBeNull();
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
