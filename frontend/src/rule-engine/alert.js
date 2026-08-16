import { map } from 'rxjs/operators';

export function toAlert(ruleId) {
  return map((reading) => ({
    type: 'alert',
    timestamp: new Date().toISOString(),
    deviceId: reading.deviceId,
    ruleId,
    severity: 'high',
    message: 'Temperature exceeded 80°C',
    data: {
      metric: 'temperature',
      value: Number(reading.value.toFixed(1)),
      threshold: 80,
    },
  }));
}