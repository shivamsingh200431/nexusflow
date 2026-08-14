import { scan } from 'rxjs/operators';

const WINDOW_SIZE = 5;

export function movingAverage(metric = 'temperature') {
  return scan((acc, reading) => {
    const rawValue = reading.metrics[metric];
    const history = [...acc.history, rawValue].slice(-WINDOW_SIZE);
    const avg = history.reduce((sum, v) => sum + v, 0) / history.length;

    return {
      ...reading,
      history,
      value: avg,
    };
  }, { history: [], value: null });
}