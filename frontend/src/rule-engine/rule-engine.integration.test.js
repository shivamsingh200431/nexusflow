import { describe, it, expect } from 'vitest';
import { Subject } from 'rxjs';
import { movingAverage } from './movingAverage.js';
import { checkThreshold } from './threshold.js';
import { toAlert } from './alert.js';

describe('NexusFlow Rule Engine Integration', () => {

  it('converts telemetry into an alert when the rolling average exceeds the threshold', () => {
    const telemetry$ = new Subject();

    const pipeline$ = telemetry$.pipe(
      movingAverage('temperature', 5),
      checkThreshold('>', 80),
      toAlert('alert-1', 'temperature', '>', 80)
    );

    const alerts = [];

    const subscription = pipeline$.subscribe((alert) => {
      alerts.push(alert);
    });

    const readings = [70, 75, 80, 85, 90];

    readings.forEach((temperature) => {
      telemetry$.next({
        deviceId: 'turbine-001',
        timestamp: new Date().toISOString(),
        metrics: {
          temperature,
          pressure: 12,
          rpm: 3200,
        },
      });
    });

    // Average = (70 + 75 + 80 + 85 + 90) / 5 = 80
    // 80 > 80 is false, so no alert yet.

    expect(alerts).toHaveLength(0);

    telemetry$.next({
      deviceId: 'turbine-001',
      timestamp: new Date().toISOString(),
      metrics: {
        temperature: 95,
        pressure: 12,
        rpm: 3200,
      },
    });

    // Rolling average:
    // (75 + 80 + 85 + 90 + 95) / 5 = 85
    // 85 > 80 → alert

    expect(alerts).toHaveLength(1);

    expect(alerts[0]).toMatchObject({
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'alert-1',
      severity: 'high',
      data: {
        metric: 'temperature',
        value: 85,
        threshold: 80,
      },
    });

    subscription.unsubscribe();
  });

  it('does not generate an alert when the rolling average remains below the threshold', () => {
    const telemetry$ = new Subject();

    const pipeline$ = telemetry$.pipe(
      movingAverage('temperature', 5),
      checkThreshold('>', 80),
      toAlert('alert-1', 'temperature', '>', 80)
    );

    const alerts = [];

    const subscription = pipeline$.subscribe((alert) => {
      alerts.push(alert);
    });

    [60, 65, 70, 75, 70, 72].forEach((temperature) => {
      telemetry$.next({
        deviceId: 'turbine-001',
        timestamp: new Date().toISOString(),
        metrics: {
          temperature,
          pressure: 12,
          rpm: 3200,
        },
      });
    });

    expect(alerts).toHaveLength(0);

    subscription.unsubscribe();
  });

  it('maintains the correct rolling window', () => {
    const telemetry$ = new Subject();

    const pipeline$ = telemetry$.pipe(
      movingAverage('temperature', 3)
    );

    const values = [];

    const subscription = pipeline$.subscribe((reading) => {
      values.push(reading.value);
    });

    [60, 70, 80, 100].forEach((temperature) => {
      telemetry$.next({
        deviceId: 'turbine-001',
        timestamp: new Date().toISOString(),
        metrics: {
          temperature,
        },
      });
    });

    expect(values).toEqual([
      60,
      65,
      70,
      83.33333333333333,
    ]);

    subscription.unsubscribe();
  });

});