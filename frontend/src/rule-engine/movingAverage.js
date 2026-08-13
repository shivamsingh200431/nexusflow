import { scan } from 'rxjs/operators';

const WINDOW_SIZE = 5; // average over the last 5 readings

export function movingAverage() {
  return scan((history, reading) => {
    const updatedHistory = [...history, reading.value].slice(-WINDOW_SIZE);
    const avg = updatedHistory.reduce((sum, v) => sum + v, 0) / updatedHistory.length;

    return { ...reading, value: avg, history: updatedHistory };
  }, { history: [] });
}