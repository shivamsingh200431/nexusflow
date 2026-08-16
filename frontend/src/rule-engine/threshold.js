import { filter } from 'rxjs/operators';

const OPERATORS = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
};

export function checkThreshold(operator = '>', value = 80) {
  const compare = OPERATORS[operator];
  return filter((reading) => compare(reading.value, value));
}