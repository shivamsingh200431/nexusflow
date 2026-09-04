import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchLatestFlow: vi.fn(),
  compileFlowGraph: vi.fn(),
}));

vi.mock('./flowApi.js', () => ({
  fetchLatestFlow: mocks.fetchLatestFlow,
}));

vi.mock('./compileFlowGraph.js', () => ({
  compileFlowGraph: mocks.compileFlowGraph,
}));

import { getAlertsStream } from './pipeline.js';

describe('getAlertsStream', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the latest flow and compiles it', async () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
        },
      ],
      edges: [],
    };

    const fakeStream = {
      subscribe: vi.fn(),
    };

    mocks.fetchLatestFlow.mockResolvedValue(flowGraph);
    mocks.compileFlowGraph.mockReturnValue(fakeStream);

    const result = await getAlertsStream();

    expect(mocks.fetchLatestFlow).toHaveBeenCalledTimes(1);

    expect(mocks.compileFlowGraph).toHaveBeenCalledTimes(1);
    expect(mocks.compileFlowGraph).toHaveBeenCalledWith(flowGraph);

    expect(result).toBe(fakeStream);
  });

  it('returns the stream produced by compileFlowGraph', async () => {
    const flowGraph = {
      nodes: [],
      edges: [],
    };

    const expectedStream = {
      subscribe: vi.fn(),
    };

    mocks.fetchLatestFlow.mockResolvedValue(flowGraph);
    mocks.compileFlowGraph.mockReturnValue(expectedStream);

    const result = await getAlertsStream();

    expect(result).toBe(expectedStream);
  });

  it('propagates errors from fetchLatestFlow', async () => {
    const error = new Error('Failed to fetch flow');

    mocks.fetchLatestFlow.mockRejectedValue(error);

    await expect(getAlertsStream())
      .rejects
      .toThrow('Failed to fetch flow');

    expect(mocks.compileFlowGraph).not.toHaveBeenCalled();
  });

  it('propagates errors from compileFlowGraph', async () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
        },
      ],
      edges: [],
    };

    const error = new Error('Failed to compile flow');

    mocks.fetchLatestFlow.mockResolvedValue(flowGraph);
    mocks.compileFlowGraph.mockImplementation(() => {
      throw error;
    });

    await expect(getAlertsStream())
      .rejects
      .toThrow('Failed to compile flow');

    expect(mocks.fetchLatestFlow).toHaveBeenCalledTimes(1);
    expect(mocks.compileFlowGraph).toHaveBeenCalledWith(flowGraph);
  });

});