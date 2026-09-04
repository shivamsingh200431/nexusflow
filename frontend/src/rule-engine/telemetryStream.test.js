import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { telemetry$ } from './telemetryStream.js';

describe('telemetry$', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              telemetry: [],
            }),
        })
      )
    );

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('requests telemetry for the configured device', async () => {
    const subscription = telemetry$('turbine-002').subscribe();

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/telemetry?deviceId=turbine-002'
      );
    });

    subscription.unsubscribe();
  });

  it('emits telemetry returned for the requested device', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        telemetry: [
          {
            _id: 'telemetry-1',
            timestamp: '2026-09-05T10:00:00.000Z',
            deviceId: 'turbine-002',
            metrics: {
              temperature: 85,
            },
          },
        ],
      }),
  });

  const next = vi.fn();

  const subscription = telemetry$('turbine-002').subscribe({
    next,
  });

  await vi.waitFor(() => {
    expect(next).toHaveBeenCalledWith({
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-002',
      metrics: {
        temperature: 85,
      },
    });
  });

  expect(next.mock.calls[0][0].deviceId).toBe('turbine-002');

  subscription.unsubscribe();
    });
});