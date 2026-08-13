import { filter } from 'rxjs/operators';

const THRESHOLD = 80;

export function aboveThreshold() {
  return filter((reading) => reading.value > THRESHOLD);
}