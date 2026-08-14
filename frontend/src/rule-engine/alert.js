import { map } from 'rxjs/operators';

export function toAlert(ruleId, metric, operator, thresholdValue) {
  return map((reading) => ({
    type: 'alert',
    timestamp: new Date().toISOString(),
    deviceId: reading.deviceId,
    ruleId,
    severity: 'high',
    message: `${metric} ${operator} ${thresholdValue} (actual: ${reading.value.toFixed(1)})`,
    data: {
      metric,
      value: Number(reading.value.toFixed(1)),
      threshold: thresholdValue,
    },
  }));
}