import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Observable, Subject } from 'rxjs';

const mockAlerts$ = new Subject();

vi.mock('./pipeline.js', () => ({
  getAlertsStream: vi.fn(() => Promise.resolve(mockAlerts$)),
}));

import {
  startRuleEngine,
  stopRuleEngine,
  restartRuleEngine,
  acquireRuleEngine,
  configureRuleEngine,
  getRuleEngineStatus,
  getRuleEngineRefCount,
  onAlert,
  _resetForTests,
} from './alertService.js';

describe('alertService', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('delivers emitted alerts to registered listeners', async () => {
    const received = [];

    onAlert((alert) => {
      received.push(alert);
    });

    await startRuleEngine();

    const fakeAlert = {
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'threshold-1',
    };

    mockAlerts$.next(fakeAlert);

    expect(received).toEqual([fakeAlert]);
  });

  it('stops delivering alerts after stopRuleEngine is called', async () => {
    const received = [];

    onAlert((alert) => {
      received.push(alert);
    });

    await startRuleEngine();
    stopRuleEngine();

    mockAlerts$.next({
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'threshold-1',
    });

    expect(received).toEqual([]);
  });

  it('does not create duplicate subscriptions when started twice', async () => {
    const received = [];

    onAlert((alert) => {
      received.push(alert);
    });

    await startRuleEngine();
    await startRuleEngine();

    const fakeAlert = {
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'threshold-1',
    };

    mockAlerts$.next(fakeAlert);

    expect(received).toEqual([fakeAlert]);
  });

  it('does not create duplicate subscriptions when started concurrently', async () => {
    const received = [];

    onAlert((alert) => {
      received.push(alert);
    });

    const firstStart = startRuleEngine();
    const secondStart = startRuleEngine();

    await Promise.all([firstStart, secondStart]);

    const fakeAlert = {
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'threshold-1',
    };

    mockAlerts$.next(fakeAlert);

    expect(received).toEqual([fakeAlert]);
  });

  it('unsubscribe from onAlert stops that specific listener', async () => {
    const received = [];

    const unsubscribe = onAlert((alert) => {
      received.push(alert);
    });

    await startRuleEngine();

    unsubscribe();

    mockAlerts$.next({
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'threshold-1',
    });

    expect(received).toEqual([]);
  });
});

/**
 * A stand-in for the compiled pipeline that records how often it was subscribed
 * to and torn down, so "no duplicate subscriptions" and "no leaks" can be
 * asserted directly rather than inferred from the alerts that came out.
 */
function createFakeAlertStream() {
  const subscribers = new Set();

  const state = {
    subscribeCount: 0,
    unsubscribeCount: 0,
    get active() {
      return subscribers.size;
    },
    emit(alert) {
      for (const subscriber of [...subscribers]) subscriber.next(alert);
    },
    fail(error) {
      for (const subscriber of [...subscribers]) subscriber.error(error);
    },
    finish() {
      for (const subscriber of [...subscribers]) subscriber.complete();
    },
  };

  state.stream = new Observable((subscriber) => {
    state.subscribeCount += 1;
    subscribers.add(subscriber);

    return () => {
      state.unsubscribeCount += 1;
      subscribers.delete(subscriber);
    };
  });

  return state;
}

/** Lets a test hold the stream promise open and settle it on demand. */
function createDeferred() {
  let resolve;
  let reject;

  const promise = new Promise((settle, fail) => {
    resolve = settle;
    reject = fail;
  });

  return { promise, resolve, reject };
}

describe('alertService lifecycle', () => {

  let fake;
  let consoleError;

  beforeEach(() => {
    _resetForTests();
    fake = createFakeAlertStream();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    configureRuleEngine({ streamSource: () => Promise.resolve(fake.stream) });
  });

  afterEach(() => {
    _resetForTests();
    consoleError.mockRestore();
  });

  it('shares one subscription between concurrent starts', async () => {
    const first = startRuleEngine();
    const second = startRuleEngine();

    // Same in-flight promise: the second caller cannot open a second stream.
    expect(second).toBe(first);

    await Promise.all([first, second]);

    expect(fake.subscribeCount).toBe(1);
    expect(fake.active).toBe(1);
    expect(getRuleEngineStatus().state).toBe('running');
  });

  it('never subscribes if it is stopped while the stream is still compiling', async () => {
    const deferred = createDeferred();

    configureRuleEngine({ streamSource: () => deferred.promise });

    const starting = startRuleEngine();

    expect(getRuleEngineStatus().state).toBe('starting');

    stopRuleEngine();

    // The stream only becomes available after the engine was told to stop.
    deferred.resolve(fake.stream);

    await starting;

    expect(fake.subscribeCount).toBe(0);
    expect(fake.active).toBe(0);
    expect(getRuleEngineStatus().state).toBe('idle');
  });

  it('starts once for many consumers and stops when the last one releases', async () => {
    const first = acquireRuleEngine({ onAlert: vi.fn() });
    const second = acquireRuleEngine({ onAlert: vi.fn() });

    await startRuleEngine();

    expect(getRuleEngineRefCount()).toBe(2);
    expect(fake.subscribeCount).toBe(1);

    first();

    expect(getRuleEngineRefCount()).toBe(1);
    // One consumer left, so the stream must stay open.
    expect(fake.active).toBe(1);

    second();

    expect(getRuleEngineRefCount()).toBe(0);
    expect(fake.active).toBe(0);
    expect(fake.unsubscribeCount).toBe(1);
    expect(getRuleEngineStatus().state).toBe('idle');
  });

  it('treats a release as idempotent so a repeated cleanup cannot leak', async () => {
    const first = acquireRuleEngine({ onAlert: vi.fn() });
    const second = acquireRuleEngine({ onAlert: vi.fn() });

    await startRuleEngine();

    first();
    first();

    // The repeated release must not consume the other consumer's reference.
    expect(getRuleEngineRefCount()).toBe(1);
    expect(fake.active).toBe(1);

    second();

    expect(getRuleEngineRefCount()).toBe(0);
    expect(fake.active).toBe(0);
  });

  it('resubscribes on restart and keeps live consumers attached', async () => {
    const received = [];

    const release = acquireRuleEngine({
      onAlert: (alert) => received.push(alert),
    });

    await startRuleEngine();

    fake.emit({ ruleId: 'before-restart' });

    await restartRuleEngine();

    expect(fake.subscribeCount).toBe(2);
    expect(fake.unsubscribeCount).toBe(1);
    expect(fake.active).toBe(1);
    // Ref counts survive a restart, so the consumer stays registered.
    expect(getRuleEngineRefCount()).toBe(1);
    expect(getRuleEngineStatus().state).toBe('running');

    fake.emit({ ruleId: 'after-restart' });

    expect(received.map((alert) => alert.ruleId)).toEqual([
      'before-restart',
      'after-restart',
    ]);

    release();
  });

  it('reports a stream failure as an error status and recovers on restart', async () => {
    const statuses = [];
    const failure = new Error('stream blew up');

    const release = acquireRuleEngine({
      onStatusChange: (next) => statuses.push(next.state),
    });

    await startRuleEngine();

    fake.fail(failure);

    expect(getRuleEngineStatus()).toEqual({ state: 'error', error: failure });
    expect(fake.active).toBe(0);
    // A late consumer is told where the engine already is, hence the leading
    // 'idle' before the transitions.
    expect(statuses).toEqual(['idle', 'starting', 'running', 'error']);

    await restartRuleEngine();

    expect(getRuleEngineStatus().state).toBe('running');
    expect(fake.subscribeCount).toBe(2);

    release();
  });

  it('resolves instead of rejecting when the stream cannot be built', async () => {
    const failure = new Error('flow fetch failed');

    configureRuleEngine({ streamSource: () => Promise.reject(failure) });

    // An unhandled rejection here would escape from inside a React effect.
    await expect(startRuleEngine()).resolves.toEqual({
      state: 'error',
      error: failure,
    });

    expect(consoleError).toHaveBeenCalled();
  });

  it('keeps the stream alive when one alert listener throws', async () => {
    const healthy = [];

    const release = acquireRuleEngine({
      onAlert: () => {
        throw new Error('consumer blew up');
      },
    });
    const releaseHealthy = acquireRuleEngine({
      onAlert: (alert) => healthy.push(alert.ruleId),
    });

    await startRuleEngine();

    fake.emit({ ruleId: 'first' });
    fake.emit({ ruleId: 'second' });

    expect(healthy).toEqual(['first', 'second']);
    expect(fake.active).toBe(1);
    expect(getRuleEngineStatus().state).toBe('running');

    release();
    releaseHealthy();
  });

  it('tells a consumer that arrives late where the engine already is', async () => {
    const early = acquireRuleEngine({ onAlert: vi.fn() });

    await startRuleEngine();

    const seen = [];
    const late = acquireRuleEngine({
      onStatusChange: (next) => seen.push(next.state),
    });

    expect(seen).toEqual(['running']);
    expect(fake.subscribeCount).toBe(1);

    late();
    early();
  });

  it('stops on request even while consumers are still attached', async () => {
    const release = acquireRuleEngine({ onAlert: vi.fn() });

    await startRuleEngine();

    stopRuleEngine();

    expect(getRuleEngineRefCount()).toBe(0);
    expect(fake.active).toBe(0);

    // Releasing after a hard stop must not push the count below zero.
    release();

    expect(getRuleEngineRefCount()).toBe(0);
  });

});