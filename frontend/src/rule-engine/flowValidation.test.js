import { describe, expect, it } from 'vitest';
import { validateFlow } from './flowValidation.js';

const validNodes = [
  { id: 'sensor-1', type: 'sensor', data: { deviceId: 'turbine-001' } },
  { id: 'average-1', type: 'movingAverage', data: { metric: 'temperature', window: 5 } },
  { id: 'threshold-1', type: 'threshold', data: { metric: 'temperature', operator: '>', value: 80 } },
  { id: 'alert-1', type: 'alert', data: { channel: 'mock-sms' } },
];

const validEdges = [
  { id: 'e1', source: 'sensor-1', target: 'average-1' },
  { id: 'e2', source: 'average-1', target: 'threshold-1' },
  { id: 'e3', source: 'threshold-1', target: 'alert-1' },
];

const makeFlow = (nodes = validNodes, edges = validEdges) => ({ nodes, edges });

describe('validateFlow', () => {
  it('accepts a complete supported flow', () => {
    expect(validateFlow(makeFlow())).toEqual({ valid: true, errors: [] });
  });

  it('accepts multiple nodes of the same supported type', () => {
    const nodes = [
      ...validNodes,
      { id: 'average-2', type: 'movingAverage', data: { metric: 'pressure', window: 3 } },
    ];
    const edges = [
      ...validEdges,
      { id: 'e4', source: 'sensor-1', target: 'average-2' },
    ];

    expect(validateFlow(makeFlow(nodes, edges))).toEqual({ valid: true, errors: [] });
  });

  it('rejects an empty flow', () => {
    expect(validateFlow({ nodes: [], edges: [] })).toEqual({
      valid: false,
      errors: ['Add a Sensor, Moving Average, Threshold, and Alert node.'],
    });
  });

  it('requires each supported node type to be present', () => {
    const nodes = validNodes.filter((node) => node.type !== 'threshold');

    expect(validateFlow(makeFlow(nodes, validEdges.slice(0, 2)))).toEqual({
      valid: false,
      errors: ['Flow must contain at least one Threshold node.'],
    });
  });

  it('rejects an invalid connection order', () => {
    const edges = [
      { id: 'e1', source: 'sensor-1', target: 'threshold-1' },
      { id: 'e2', source: 'threshold-1', target: 'average-1' },
      { id: 'e3', source: 'average-1', target: 'alert-1' },
    ];

    expect(validateFlow(makeFlow(validNodes, edges))).toEqual({
      valid: false,
      errors: ['Connect nodes in this order: Sensor → Moving Average → Threshold → Alert.'],
    });
  });

  it('rejects incomplete node configuration', () => {
    const nodes = validNodes.map((node) =>
      node.type === 'sensor'
        ? { ...node, data: { deviceId: '   ' } }
        : node
    );

    expect(validateFlow(makeFlow(nodes))).toEqual({
      valid: false,
      errors: ['Sensor: Device ID is required.'],
    });
  });

  it('rejects an invalid moving average window', () => {
    const nodes = validNodes.map((node) =>
      node.type === 'movingAverage'
        ? { ...node, data: { ...node.data, window: 0 } }
        : node
    );

    expect(validateFlow(makeFlow(nodes))).toEqual({
      valid: false,
      errors: ['Moving Average: Window must be a whole number from 1 to 100.'],
    });
  });

  it('rejects an invalid threshold value', () => {
    const nodes = validNodes.map((node) =>
      node.type === 'threshold'
        ? { ...node, data: { ...node.data, value: Number.NaN } }
        : node
    );

    expect(validateFlow(makeFlow(nodes))).toEqual({
      valid: false,
      errors: ['Threshold: Value must be a valid number.'],
    });
  });
});
