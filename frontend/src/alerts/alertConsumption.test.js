/**
 * End-to-end test for the alert consumption flow.
 *
 * Only the two edges of the system are faked: the Flow API (so no network) and
 * the telemetry Observable (so readings can be pushed synchronously). Everything
 * between them is the real thing - the real `getAlertsStream()`, the real
 * `compileFlowGraph()`, the real operators, the real service lifecycle and the
 * real store - which is what makes this a check on the acceptance criteria
 * rather than on a re-implementation of the pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { createAlertStore } from './alertStore.js';
import {
  acquireRuleEngine,
  startRuleEngine,
  getRuleEngineStatus,
  getRuleEngineRefCount,
  _resetForTests,
} from '../rule-engine/alertService.js';

const mocks = vi.hoisted(() => ({
  fetchLatestFlow: vi.fn(),
  telemetry: { subject: null },
}));

vi.mock('../rule-engine/flowApi.js', () => ({
  fetchLatestFlow: mocks.fetchLatestFlow,
  saveFlow: vi.fn(),
  fetchFlows: vi.fn(),
}));

vi.mock('../rule-engine/telemetryStream.js', () => ({
  telemetry$: () => mocks.telemetry.subject,
}));

/** The shape `fetchLatestFlow()` returns: the flow saved by the builder. */
const FLOW_GRAPH = {
  nodes: [
    { id: 'sensor-1', type: 'sensor', data: { deviceId: 'turbine-001' } },
    { id: 'avg-1', type: 'movingAverage', data: { metric: 'temperature', window: 5 } },
    {
      id: 'threshold-1',
      type: 'threshold',
      data: { metric: 'temperature', operator: '>', value: 80 },
    },
    { id: 'alert-1', type: 'alert', data: {} },
  ],
  edges: [
    { source: 'sensor-1', target: 'avg-1' },
    { source: 'avg-1', target: 'threshold-1' },
    { source: 'threshold-1', target: 'alert-1' },
  ],
};

/** Alert Event Contract fields (docs/contracts.md section 4). */
const CONTRACT_FIELDS = [
  'type',
  'timestamp',
  'deviceId',
  'ruleId',
  'severity',
  'message',
  'data',
];

function reading(temperature) {
  return {
    deviceId: 'turbine-001',
    timestamp: new Date().toISOString(),
    metrics: { temperature, pressure: 12, rpm: 3200 },
  };
}

function feed(temperatures) {
  for (const temperature of temperatures) {
    mocks.telemetry.subject.next(reading(temperature));
  }
}

/** Wires a store to the engine exactly the way AlertsProvider does. */
function connect(store) {
  return acquireRuleEngine({
    onAlert: store.ingest,
    onStatusChange: store.setStatus,
  });
}

describe('alert consumption', () => {

  beforeEach(() => {
    _resetForTests();
    mocks.telemetry.subject = new Subject();
    mocks.fetchLatestFlow.mockReset();
    mocks.fetchLatestFlow.mockResolvedValue(FLOW_GRAPH);
  });

  afterEach(() => {
    _resetForTests();
  });

  it('turns a flow fetched from the API into stored Alert Events', async () => {
    const store = createAlertStore();
    const release = connect(store);

    await startRuleEngine();

    expect(mocks.fetchLatestFlow).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status.state).toBe('running');

    // Average = (70 + 75 + 80 + 85 + 90) / 5 = 80, and 80 > 80 is false.
    feed([70, 75, 80, 85, 90]);

    expect(store.getSnapshot().alerts).toHaveLength(0);

    // Average = (75 + 80 + 85 + 90 + 95) / 5 = 85 > 80.
    feed([95]);

    const alerts = store.getSnapshot().alerts;

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'alert-1',
      severity: 'high',
      message: 'temperature > 80 (actual: 85.0)',
      data: { metric: 'temperature', value: 85, threshold: 80 },
    });
    expect(typeof alerts[0].timestamp).toBe('string');

    // Contract untouched: consumption only layers id / time / acknowledged on top.
    expect(Object.keys(alerts[0]).sort()).toEqual(
      [...CONTRACT_FIELDS, 'id', 'time', 'acknowledged'].sort()
    );
    expect(alerts[0].acknowledged).toBe(false);

    release();
  });

  it('fetches the flow once and subscribes once for two consumers', async () => {
    const first = createAlertStore();
    const second = createAlertStore();

    const releaseFirst = connect(first);
    const releaseSecond = connect(second);

    await startRuleEngine();

    expect(mocks.fetchLatestFlow).toHaveBeenCalledTimes(1);
    expect(getRuleEngineRefCount()).toBe(2);

    feed([70, 75, 80, 85, 90, 95]);

    // A second subscription would carry its own moving-average state and so
    // deliver a second alert for the same reading.
    expect(first.getSnapshot().alerts).toHaveLength(1);
    expect(second.getSnapshot().alerts).toHaveLength(1);
    expect(first.getSnapshot().alerts[0].data.value).toBe(85);

    releaseFirst();
    releaseSecond();
  });

  it('stops consuming once the last consumer releases', async () => {
    const store = createAlertStore();
    const release = connect(store);

    await startRuleEngine();

    feed([70, 75, 80, 85, 90, 95]);

    expect(store.getSnapshot().alerts).toHaveLength(1);

    release();

    expect(getRuleEngineStatus().state).toBe('idle');

    const snapshot = store.getSnapshot();

    feed([100, 100, 100]);

    // Identical snapshot reference: the store was not touched at all.
    expect(store.getSnapshot()).toBe(snapshot);
    expect(store.getSnapshot().alerts).toHaveLength(1);
  });

  it('reports a failed flow fetch to the store instead of throwing', async () => {
    const failure = new Error('Failed to fetch flows: 500');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    mocks.fetchLatestFlow.mockRejectedValueOnce(failure);

    const store = createAlertStore();
    const release = connect(store);

    await startRuleEngine();

    expect(store.getSnapshot().status).toEqual({ state: 'error', error: failure });
    expect(store.getSnapshot().alerts).toEqual([]);

    release();
    consoleError.mockRestore();
  });

});
