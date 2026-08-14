export const exampleFlowGraph = {
  nodes: [
    { id: 'sensor-1', type: 'sensor', data: { deviceId: 'turbine-001' } },
    { id: 'average-1', type: 'movingAverage', data: { metric: 'temperature', window: 5 } },
    { id: 'threshold-1', type: 'threshold', data: { metric: 'temperature', operator: '>', value: 80 } },
    { id: 'alert-1', type: 'alert', data: { channel: 'mock-sms' } },
  ],
  edges: [
    { source: 'sensor-1', target: 'average-1' },
    { source: 'average-1', target: 'threshold-1' },
    { source: 'threshold-1', target: 'alert-1' },
  ],
};