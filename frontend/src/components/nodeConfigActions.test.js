import { describe, expect, it } from 'vitest';
import { getDeviceOptions } from './nodeConfigActions.js';

describe('Node config device options', () => {
  it('uses registered devices for sensor selection', () => {
    expect(getDeviceOptions([
      { deviceId: 'pump-002', name: 'Cooling Pump' },
      { deviceId: 'motor-003', name: 'Main Motor' },
    ], 'pump-002')).toEqual([
      { value: 'pump-002', label: 'Cooling Pump · pump-002' },
      { value: 'motor-003', label: 'Main Motor · motor-003' },
    ]);
  });

  it('keeps an existing unregistered device selectable for compatibility', () => {
    expect(getDeviceOptions([{ deviceId: 'pump-002', name: 'Cooling Pump' }], 'legacy-001')).toEqual([
      { value: 'legacy-001', label: 'legacy-001 · not registered' },
      { value: 'pump-002', label: 'Cooling Pump · pump-002' },
    ]);
  });
});
