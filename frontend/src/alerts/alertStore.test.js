import { describe, it, expect, vi } from 'vitest';
import { createAlertStore, decorateAlert, MAX_ALERTS } from './alertStore.js';

/** A valid Alert Event as defined by docs/contracts.md section 4. */
function alertEvent(overrides = {}) {
  return {
    type: 'alert',
    timestamp: '2026-08-11T10:30:01.000Z',
    deviceId: 'turbine-001',
    ruleId: 'alert-1',
    severity: 'high',
    message: 'temperature > 80 (actual: 84.3)',
    data: {
      metric: 'temperature',
      value: 84.3,
      threshold: 80,
    },
    ...overrides,
  };
}

const CONTRACT_FIELDS = [
  'type',
  'timestamp',
  'deviceId',
  'ruleId',
  'severity',
  'message',
  'data',
];

describe('decorateAlert', () => {

  it('adds only the UI-only fields and leaves contract fields untouched', () => {
    const event = alertEvent();
    const decorated = decorateAlert(event, 'alert-1#1');

    for (const field of CONTRACT_FIELDS) {
      expect(decorated[field]).toEqual(event[field]);
    }

    expect(Object.keys(decorated).sort()).toEqual(
      [...CONTRACT_FIELDS, 'id', 'time', 'acknowledged'].sort()
    );
  });

  it('derives the display time from the contract timestamp', () => {
    const timestamp = new Date(2026, 7, 11, 14, 32, 11).toISOString();
    const decorated = decorateAlert(alertEvent({ timestamp }), 'x');

    expect(decorated.time).toBe('14:32:11');
  });

  it('falls back to a placeholder for an unparseable timestamp', () => {
    const decorated = decorateAlert(alertEvent({ timestamp: 'not-a-date' }), 'x');

    expect(decorated.time).toBe('--:--:--');
  });

});

describe('alertStore', () => {

  it('ingests alerts newest first and notifies subscribers', () => {
    const store = createAlertStore();
    const notified = vi.fn();

    const unsubscribe = store.subscribe(notified);

    store.ingest(alertEvent({ message: 'first' }));
    store.ingest(alertEvent({ message: 'second' }));

    expect(notified).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().alerts.map((a) => a.message)).toEqual([
      'second',
      'first',
    ]);

    unsubscribe();

    store.ingest(alertEvent({ message: 'third' }));

    expect(notified).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().alerts).toHaveLength(3);
  });

  it('gives every alert a unique id', () => {
    const store = createAlertStore();

    store.ingest(alertEvent());
    store.ingest(alertEvent());
    store.ingest(alertEvent());

    const ids = store.getSnapshot().alerts.map((alert) => alert.id);

    expect(new Set(ids).size).toBe(3);
  });

  it('returns a stable snapshot reference until something changes', () => {
    const store = createAlertStore();

    const before = store.getSnapshot();

    expect(store.getSnapshot()).toBe(before);

    store.ingest(alertEvent());

    const after = store.getSnapshot();

    expect(after).not.toBe(before);
    expect(store.getSnapshot()).toBe(after);
  });

  it('bounds the buffer so a long-running stream cannot grow it forever', () => {
    const store = createAlertStore({ maxAlerts: 3 });

    for (let index = 0; index < 10; index += 1) {
      store.ingest(alertEvent({ message: `alert-${index}` }));
    }

    expect(store.getSnapshot().alerts.map((a) => a.message)).toEqual([
      'alert-9',
      'alert-8',
      'alert-7',
    ]);
  });

  it('defaults the buffer bound to MAX_ALERTS', () => {
    const store = createAlertStore();

    for (let index = 0; index < MAX_ALERTS + 25; index += 1) {
      store.ingest(alertEvent());
    }

    expect(store.getSnapshot().alerts).toHaveLength(MAX_ALERTS);
  });

  it('acknowledges by id and ignores unknown ids', () => {
    const store = createAlertStore();

    store.ingest(alertEvent());

    const [alert] = store.getSnapshot().alerts;

    expect(store.acknowledge('does-not-exist')).toBe(false);
    expect(store.acknowledge(alert.id)).toBe(true);
    expect(store.getSnapshot().alerts[0].acknowledged).toBe(true);

    // Already acknowledged: no second state change.
    expect(store.acknowledge(alert.id)).toBe(false);
  });

  it('clears alerts and tracks engine status', () => {
    const store = createAlertStore();
    const error = new Error('flow fetch failed');

    store.ingest(alertEvent());
    store.setStatus({ state: 'error', error });

    expect(store.getSnapshot().status).toEqual({ state: 'error', error });

    store.clear();

    expect(store.getSnapshot().alerts).toEqual([]);
    // Clearing the list must not reset the engine status.
    expect(store.getSnapshot().status.state).toBe('error');
  });

  it('ignores empty ingests and keeps one listener failure contained', () => {
    const store = createAlertStore();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const healthy = vi.fn();

    store.subscribe(() => {
      throw new Error('listener blew up');
    });
    store.subscribe(healthy);

    store.ingest(null);

    expect(store.getSnapshot().alerts).toEqual([]);

    store.ingest(alertEvent());

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().alerts).toHaveLength(1);

    consoleError.mockRestore();
  });

  it('isolates stores created by the factory', () => {
    const first = createAlertStore();
    const second = createAlertStore();

    first.ingest(alertEvent());

    expect(first.getSnapshot().alerts).toHaveLength(1);
    expect(second.getSnapshot().alerts).toHaveLength(0);
  });

});
