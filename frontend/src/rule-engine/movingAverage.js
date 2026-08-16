import { scan } from 'rxjs/operators';

export function movingAverage(metric = 'temperature', window = 5) {
  return scan((acc, reading) => {
    const rawValue = reading.metrics[metric];
    const history = [...acc.history, rawValue].slice(-window);
    const avg = history.reduce((sum, v) => sum + v, 0) / history.length;

    return { ...reading, history, value: avg };
  }, { history: [], value: null });
}