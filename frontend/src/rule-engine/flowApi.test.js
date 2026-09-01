import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLatestFlow } from './flowApi.js';

describe('fetchLatestFlow', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches flows and returns the latest flow', async () => {
    const responseData = {
      flows: [
        {
          _id: 'flow-new',
          name: 'Temperature Alert',
          nodes: [
            {
              id: 'sensor-1',
              type: 'sensor',
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
        },
        {
          _id: 'flow-old',
          name: 'Old Flow',
          nodes: [],
          edges: [],
        },
      ],
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    const result = await fetchLatestFlow();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/flows'
    );

    expect(result).toEqual({
      nodes: responseData.flows[0].nodes,
      edges: responseData.flows[0].edges,
    });
  });

  it('throws an error when the backend returns a failed response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchLatestFlow())
      .rejects
      .toThrow('Failed to fetch flows: 500');
  });

  it('throws an error when no flows are returned', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        flows: [],
      }),
    });

    await expect(fetchLatestFlow())
      .rejects
      .toThrow('No flows found in the database');
  });

  it('throws an error when the flows property is missing', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(fetchLatestFlow())
      .rejects
      .toThrow('No flows found in the database');
  });

  it('returns only nodes and edges from the latest flow', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        flows: [
          {
            _id: 'flow-123',
            name: 'My Flow',
            createdAt: '2026-08-29',
            nodes: [
              {
                id: 'sensor-1',
                type: 'sensor',
              },
            ],
            edges: [],
          },
        ],
      }),
    });

    const result = await fetchLatestFlow();

    expect(result).toEqual({
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
        },
      ],
      edges: [],
    });

    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('name');
    expect(result).not.toHaveProperty('createdAt');
  });
});
