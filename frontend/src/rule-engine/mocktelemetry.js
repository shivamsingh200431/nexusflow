import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

// Emits a fake temperature reading every 1 second
export const mockTelemetry$ = interval(1000).pipe(
  map(() => ({
    deviceId: 'turbine-01',
    metric: 'temperature',
    value: 70 + Math.random() * 20, // random value between 70–90
    unit: 'C',
    timestamp: new Date().toISOString(),
  }))
);