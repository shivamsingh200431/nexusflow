import { describe, it, expect, vi } from 'vitest';

vi.mock('./telemetryStream.js', () => ({
  telemetry$: vi.fn(() => ({
    pipe: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
}));

import { telemetry$ } from './telemetryStream.js';
import { compileFlowGraph } from './compileFlowGraph.js';

describe('compileFlowGraph', () => {

  it('throws an error when the graph has no sensor node', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'threshold-1',
          type: 'threshold',
          data: {
            metric: 'temperature',
            operator: '>',
            value: 80,
          },
        },
      ],
      edges: [],
    };

    expect(() => compileFlowGraph(flowGraph))
      .toThrow('Flow Graph must contain a sensor node');
  });

  it('throws an error for an unknown node type', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: {},
        },
        {
          id: 'unknown-1',
          type: 'somethingUnknown',
          data: {},
        },
      ],
      edges: [
        {
          source: 'sensor-1',
          target: 'unknown-1',
        },
      ],
    };

    expect(() => compileFlowGraph(flowGraph))
      .toThrow('Unknown node type: somethingUnknown');
  });

  it('compiles a sensor-only graph', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: {},
        },
      ],
      edges: [],
    };

    const pipeline$ = compileFlowGraph(flowGraph);

    expect(pipeline$).toBeDefined();
    expect(typeof pipeline$.subscribe).toBe('function');
  });

  it('passes the sensor deviceId to telemetry$', () => {
  const flowGraph = {
    nodes: [
      {
        id: 'sensor-1',
        type: 'sensor',
        data: {
          deviceId: 'turbine-002',
        },
      },
    ],
    edges: [],
  };

  compileFlowGraph(flowGraph);

  expect(telemetry$).toHaveBeenCalledWith('turbine-002');
});

  it('compiles a sensor to threshold graph', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: {},
        },
        {
          id: 'threshold-1',
          type: 'threshold',
          data: {
            metric: 'temperature',
            operator: '>',
            value: 80,
          },
        },
      ],
      edges: [
        {
          source: 'sensor-1',
          target: 'threshold-1',
        },
      ],
    };

    const pipeline$ = compileFlowGraph(flowGraph);

    expect(pipeline$).toBeDefined();
    expect(typeof pipeline$.subscribe).toBe('function');
  });

  it('compiles a complete sensor -> movingAverage -> threshold -> alert graph', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: {},
        },
        {
          id: 'average-1',
          type: 'movingAverage',
          data: {
            metric: 'temperature',
            window: 5,
          },
        },
        {
          id: 'threshold-1',
          type: 'threshold',
          data: {
            metric: 'temperature',
            operator: '>',
            value: 80,
          },
        },
        {
          id: 'alert-1',
          type: 'alert',
          data: {},
        },
      ],
      edges: [
        {
          source: 'sensor-1',
          target: 'average-1',
        },
        {
          source: 'average-1',
          target: 'threshold-1',
        },
        {
          source: 'threshold-1',
          target: 'alert-1',
        },
      ],
    };

    const pipeline$ = compileFlowGraph(flowGraph);

    expect(pipeline$).toBeDefined();
    expect(typeof pipeline$.subscribe).toBe('function');
  });

  it('compiles a graph using a custom threshold operator', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: {},
        },
        {
          id: 'threshold-1',
          type: 'threshold',
          data: {
            metric: 'pressure',
            operator: '>=',
            value: 12,
          },
        },
        {
          id: 'alert-1',
          type: 'alert',
          data: {},
        },
      ],
      edges: [
        {
          source: 'sensor-1',
          target: 'threshold-1',
        },
        {
          source: 'threshold-1',
          target: 'alert-1',
        },
      ],
    };

    const pipeline$ = compileFlowGraph(flowGraph);

    expect(pipeline$).toBeDefined();
    expect(typeof pipeline$.subscribe).toBe('function');
  });

});