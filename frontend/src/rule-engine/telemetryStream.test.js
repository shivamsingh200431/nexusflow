import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { telemetry$ } from './telemetryStream.js';

class MockWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;

    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;

    MockWebSocket.instances.push(this);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;

    if (this.onclose) {
      this.onclose();
    }
  }

  open() {
    this.readyState = MockWebSocket.OPEN;

    if (this.onopen) {
      this.onopen();
    }
  }

  sendMessage(message) {
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify(message),
      });
    }
  }
}

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

describe('telemetry$', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('connects to the telemetry WebSocket', () => {
    const subscription = telemetry$('turbine-002').subscribe();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(
      'ws://localhost:5000/ws'
    );

    subscription.unsubscribe();
  });

  it('emits telemetry for the requested device', () => {
    const next = vi.fn();

    const subscription = telemetry$('turbine-002').subscribe({
      next,
    });

    const socket = MockWebSocket.instances[0];

    socket.open();

    socket.sendMessage({
      type: 'telemetry',
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-002',
      data: {
        temperature: 85,
        pressure: 14,
      },
    });

    expect(next).toHaveBeenCalledWith({
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-002',
      metrics: {
        temperature: 85,
        pressure: 14,
      },
    });

    subscription.unsubscribe();
  });

  it('ignores telemetry from another device', () => {
    const next = vi.fn();

    const subscription = telemetry$('turbine-002').subscribe({
      next,
    });

    const socket = MockWebSocket.instances[0];

    socket.open();

    socket.sendMessage({
      type: 'telemetry',
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-001',
      data: {
        temperature: 90,
      },
    });

    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('ignores non-telemetry WebSocket events', () => {
    const next = vi.fn();

    const subscription = telemetry$('turbine-002').subscribe({
      next,
    });

    const socket = MockWebSocket.instances[0];

    socket.open();

    socket.sendMessage({
      type: 'alert',
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-002',
      data: {},
    });

    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('reconnects after the WebSocket closes', () => {
    const subscription = telemetry$('turbine-002').subscribe();

    const firstSocket = MockWebSocket.instances[0];

    firstSocket.open();
    firstSocket.close();

    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(2000);

    expect(MockWebSocket.instances).toHaveLength(2);

    subscription.unsubscribe();
  });

  it('closes the WebSocket when unsubscribed', () => {
    const subscription = telemetry$('turbine-002').subscribe();

    const socket = MockWebSocket.instances[0];

    subscription.unsubscribe();

    expect(socket.readyState).toBe(MockWebSocket.CLOSED);

    vi.advanceTimersByTime(2000);

    expect(MockWebSocket.instances).toHaveLength(1);
  });
});