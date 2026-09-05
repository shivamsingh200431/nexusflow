import { describe, it, expect, vi } from 'vitest';
import { Subject } from 'rxjs';

const telemetrySubject = new Subject();

vi.mock('./telemetryStream.js', () => ({
  telemetry$: vi.fn(() => telemetrySubject),
}));

import { compileFlowGraph } from './compileFlowGraph.js';

describe('compileFlowGraph integration', () => {
  it('runs a persisted Flow Builder graph through the RxJS alert pipeline', () => {
    const flowGraph = {
      nodes: [
        {
          id: 'sensor-1',
          type: 'sensor',
          data: { deviceId: 'turbine-001' },
        },
        {
          id: 'average-1',
          type: 'movingAverage',
          data: { metric: 'temperature', window: 5 },
        },
        {
          id: 'threshold-1',
          type: 'threshold',
          data: { metric: 'temperature', operator: '>', value: 80 },
        },
        {
          id: 'alert-1',
          type: 'alert',
          data: { channel: 'mock-sms' },
        },
      ],
      edges: [
        { source: 'sensor-1', target: 'average-1' },
        { source: 'average-1', target: 'threshold-1' },
        { source: 'threshold-1', target: 'alert-1' },
      ],
    };

    const alerts = [];
    const pipeline$ = compileFlowGraph(flowGraph);
    const subscription = pipeline$.subscribe((alert) => alerts.push(alert));

    [70, 75, 80, 85, 95].forEach((temperature, index) => {
      telemetrySubject.next({
        timestamp: `2026-09-05T10:0${index}:00.000Z`,
        deviceId: 'turbine-001',
        metrics: { temperature, pressure: 14.2, rpm: 3200 },
      });
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: 'alert',
      deviceId: 'turbine-001',
      ruleId: 'alert-1',
      severity: 'high',
      data: {
        metric: 'temperature',
        value: 81,
        threshold: 80,
      },
    });
    expect(alerts[0].message).toContain('temperature > 80');

    subscription.unsubscribe();
  });
});
