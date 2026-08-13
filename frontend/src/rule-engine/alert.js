import { map } from 'rxjs/operators';

export function toAlert() {
  return map((reading) => ({
    type: 'ALERT',
    deviceId: reading.deviceId,
    metric: reading.metric,
    value: reading.value.toFixed(1),
    message: `${reading.metric} exceeded threshold: ${reading.value.toFixed(1)}${reading.unit}`,
    timestamp: new Date().toISOString(),
  }));
}