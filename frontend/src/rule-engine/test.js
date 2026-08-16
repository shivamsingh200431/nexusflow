import { mockTelemetry$ } from './mockTelemetry.js';

mockTelemetry$.subscribe((reading) => {
  console.log(reading);
});
