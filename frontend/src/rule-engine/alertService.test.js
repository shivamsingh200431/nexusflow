import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';

const mockAlerts$ = new Subject();

vi.mock('./pipeline.js', () => ({
  getAlertsStream: vi.fn(() => Promise.resolve(mockAlerts$)),
}));

import {
  startRuleEngine,
  stopRuleEngine,
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