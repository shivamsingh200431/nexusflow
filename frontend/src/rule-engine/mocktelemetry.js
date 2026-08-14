import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

export const mockTelemetry$ = interval(1000).pipe(
  map(() => ({
    deviceId: 'turbine-001',
    timestamp: new Date().toISOString(),
    metrics: {
      temperature: 70 + Math.random() * 20,
      pressure: 10 + Math.random() * 5,
      rpm: 3000 + Math.random() * 400,
    },
  }))
);