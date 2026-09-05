import { describe, expect, it } from 'vitest';
import { validateDeviceForm, toDevicePayload } from './deviceActions.js';

describe('Device form actions', () => {
  it('requires a device ID, name, and type', () => {
    expect(validateDeviceForm({ deviceId: '', name: '', type: '' })).toEqual([
      'Device ID is required.',
      'Device name is required.',
      'Device type is required.',
    ]);
  });

  it('accepts a complete device form', () => {
    expect(validateDeviceForm({
      deviceId: 'pump-002',
      name: 'Cooling Pump',
      type: 'Pump',
      location: 'Factory Floor 2',
    })).toEqual([]);
  });

  it('creates the API payload with optional location metadata', () => {
    expect(toDevicePayload({
      deviceId: 'pump-002',
      name: 'Cooling Pump',
      type: 'Pump',
      location: 'Factory Floor 2',
    })).toEqual({
      deviceId: 'pump-002',
      name: 'Cooling Pump',
      type: 'Pump',
      metadata: { location: 'Factory Floor 2' },
    });
  });
});
