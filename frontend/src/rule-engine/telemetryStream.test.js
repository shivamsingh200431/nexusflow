import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { telemetry$ } from './telemetryStream.js';

class MockWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.listeners = new Map();
    this.close = vi.fn(() => this.emit('close'));
    MockWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe('telemetry$', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('connects to the configured WebSocket endpoint', () => {
    const subscription = telemetry$('turbine-001').subscribe();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:5000/ws');

    subscription.unsubscribe();
  });

  it('maps a telemetry WebSocket event to the rule-engine reading contract', () => {
    const received = [];
    const subscription = telemetry$('turbine-001').subscribe((reading) => {
      received.push(reading);
    });

    MockWebSocket.instances[0].emit('message', {
      data: JSON.stringify({
        type: 'telemetry',
        timestamp: '2026-09-05T09:00:00.000Z',
        deviceId: 'turbine-001',
        data: { temperature: 85, pressure: 14.2, rpm: 3200 },
      }),
    });

    expect(received).toEqual([
      {
        timestamp: '2026-09-05T09:00:00.000Z',
        deviceId: 'turbine-001',
        metrics: { temperature: 85, pressure: 14.2, rpm: 3200 },
      },
    ]);

    subscription.unsubscribe();
  });

  it('ignores telemetry for another device', () => {
    const received = [];
    const subscription = telemetry$('turbine-001').subscribe((reading) => {
      received.push(reading);
    });

    MockWebSocket.instances[0].emit('message', {
      data: JSON.stringify({
        type: 'telemetry',
        timestamp: '2026-09-05T09:00:00.000Z',
        deviceId: 'turbine-002',
        data: { temperature: 99 },
      }),
    });

    expect(received).toEqual([]);
    subscription.unsubscribe();
  });

  it('ignores non-telemetry events', () => {
    const received = [];
    const subscription = telemetry$('turbine-001').subscribe((reading) => {
      received.push(reading);
    });

    MockWebSocket.instances[0].emit('message', {
      data: JSON.stringify({
        type: 'alert',
        timestamp: '2026-09-05T09:00:00.000Z',
        deviceId: 'turbine-001',
        data: { temperature: 85 },
      }),
    });

    expect(received).toEqual([]);
    subscription.unsubscribe();
  });

  it('ignores malformed messages without breaking the stream', () => {
    const received = [];
    const subscription = telemetry$('turbine-001').subscribe((reading) => {
      received.push(reading);
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const socket = MockWebSocket.instances[0];

    socket.emit('message', { data: '{not-json' });
    socket.emit('message', {
      data: JSON.stringify({
        type: 'telemetry',
        timestamp: '2026-09-05T09:00:00.000Z',
        deviceId: 'turbine-001',
        data: { temperature: 85 },
      }),
    });

    expect(received).toHaveLength(1);
    expect(consoleError).toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('closes the WebSocket when the observable is unsubscribed', () => {
    const subscription = telemetry$('turbine-001').subscribe();
    const socket = MockWebSocket.instances[0];

    subscription.unsubscribe();

    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('reconnects after an unexpected WebSocket close', () => {
    vi.useFakeTimers();

    const subscription = telemetry$('turbine-001').subscribe();
    const firstSocket = MockWebSocket.instances[0];

    firstSocket.emit('close');
    vi.advanceTimersByTime(2000);

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(MockWebSocket.instances[1].url).toBe('ws://localhost:5000/ws');

    subscription.unsubscribe();
  });
});
