import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { telemetry$ } from './telemetryStream.js';

class MockWebSocket {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.closed = false;
    MockWebSocket.instances.push(this);
  }
  send() {}
  close() {
    this.closed = true;
  }
  emit(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('telemetry$', () => {
  it('connects to the ws endpoint', () => {
    const sub = telemetry$('turbine-002').subscribe();
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain('/ws');
    sub.unsubscribe();
  });

  it('emits telemetry only for the requested device', () => {
    const next = vi.fn();
    const sub = telemetry$('turbine-002').subscribe({ next });
    const socket = MockWebSocket.instances[0];

    socket.emit({
      type: 'telemetry',
      timestamp: '2026-09-05T10:00:00.000Z',
      deviceId: 'turbine-001',
      data: { temperature: 100 },
    });
    socket.emit({
      type: 'telemetry',
      timestamp: '2026-09-05T10:00:01.000Z',
      deviceId: 'turbine-002',
      data: { temperature: 85 },
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith({
      timestamp: '2026-09-05T10:00:01.000Z',
      deviceId: 'turbine-002',
      metrics: { temperature: 85 },
    });

    sub.unsubscribe();
  });

  it('closes the socket on unsubscribe', () => {
    const sub = telemetry$('turbine-002').subscribe();
    const socket = MockWebSocket.instances[0];
    sub.unsubscribe();
    expect(socket.closed).toBe(true);
  });
});