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
  if (!compare) {
    throw new Error(`Unsupported threshold operator: ${operator}`);
  }
  return filter((reading) => compare(reading.value, value));
}