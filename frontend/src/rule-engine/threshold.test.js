import { describe, it, expect } from 'vitest';
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { checkThreshold } from './threshold.js';

describe('checkThreshold', () => {

  it('allows values greater than the threshold', async () => {
    const readings = [
      { value: 90 },
      { value: 75 },
      { value: 100 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold('>', 80),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 90 },
      { value: 100 },
    ]);
  });

  it('supports less than operator', async () => {
    const readings = [
      { value: 50 },
      { value: 80 },
      { value: 90 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold('<', 80),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 50 },
    ]);
  });

  it('supports greater than or equal operator', async () => {
    const readings = [
      { value: 79 },
      { value: 80 },
      { value: 81 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold('>=', 80),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 80 },
      { value: 81 },
    ]);
  });

  it('supports less than or equal operator', async () => {
    const readings = [
      { value: 79 },
      { value: 80 },
      { value: 81 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold('<=', 80),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 79 },
      { value: 80 },
    ]);
  });

  it('supports equality operator', async () => {
    const readings = [
      { value: 79 },
      { value: 80 },
      { value: 81 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold('==', 80),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 80 },
    ]);
  });

  it('uses greater than 80 as the default', async () => {
    const readings = [
      { value: 70 },
      { value: 80 },
      { value: 81 },
    ];

    const result = await of(...readings)
      .pipe(
        checkThreshold(),
        toArray()
      )
      .toPromise();

    expect(result).toEqual([
      { value: 81 },
    ]);
  });

  it('throws an error for an unsupported operator', () => {
    expect(() => checkThreshold('!=', 80))
      .toThrow('Unsupported threshold operator: !=');
  });

});