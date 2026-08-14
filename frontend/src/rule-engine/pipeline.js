import { mockTelemetry$ } from './mockTelemetry.js';
import { movingAverage } from './movingAverage.js';
import { aboveThreshold } from './threshold.js';
import { toAlert } from './alert.js';

export const alerts$ = mockTelemetry$.pipe(
  movingAverage('temperature'),
  aboveThreshold(),
  toAlert('threshold-1')
);