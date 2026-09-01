import { describe, it, expect } from 'vitest';
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { movingAverage } from './movingAverage.js';

describe('movingAverage', () => {

  it('calculates the average of incoming readings', async () => {
    const readings = [
      { id: 1, metrics: { temperature: 10 } },
      { id: 2, metrics: { temperature: 20 } },
      { id: 3, metrics: { temperature: 30 } },
    ];

    const result = await of(...readings)
      .pipe(
        movingAverage('temperature', 3),
        toArray()
      )
      .toPromise();

    expect(result.map(r => r.value)).toEqual([
      10,
      15,
      20,
    ]);
  });

  it('keeps only the specified number of readings in the window', async () => {
    const readings = [
      { id: 1, metrics: { temperature: 10 } },
      { id: 2, metrics: { temperature: 20 } },
      { id: 3, metrics: { temperature: 30 } },
      { id: 4, metrics: { temperature: 40 } },
    ];

    const result = await of(...readings)
      .pipe(
        movingAverage('temperature', 3),
        toArray()
      )
      .toPromise();

    expect(result[3].history).toEqual([
      20,
      30,
      40,
    ]);

    expect(result[3].value).toBe(30);
  });

  it('preserves properties from the original reading', async () => {
    const reading = {
      id: 'sensor-001',
      timestamp: 123456,
      metrics: {
        temperature: 80,
      },
    };

    const result = await of(reading)
      .pipe(
        movingAverage('temperature', 5),
        toArray()
      )
      .toPromise();

    expect(result[0]).toMatchObject({
      id: 'sensor-001',
      timestamp: 123456,
      metrics: {
        temperature: 80,
      },
      value: 80,
    });
  });

  it('supports a custom metric', async () => {
    const readings = [
      { metrics: { humidity: 40 } },
      { metrics: { humidity: 60 } },
      { metrics: { humidity: 80 } },
    ];

    const result = await of(...readings)
      .pipe(
        movingAverage('humidity', 3),
        toArray()
      )
      .toPromise();

    expect(result.map(r => r.value)).toEqual([
      40,
      50,
      60,
    ]);
  });

  it('uses the default temperature metric and window of 5', async () => {
    const readings = [
      { metrics: { temperature: 10 } },
      { metrics: { temperature: 20 } },
    ];

    const result = await of(...readings)
      .pipe(
        movingAverage(),
        toArray()
      )
      .toPromise();

    expect(result.map(r => r.value)).toEqual([
      10,
      15,
    ]);
  });

  it('calculates the rolling average correctly after the window is full', async () => {
    const readings = [
      { metrics: { temperature: 10 } },
      { metrics: { temperature: 20 } },
      { metrics: { temperature: 30 } },
      { metrics: { temperature: 40 } },
      { metrics: { temperature: 50 } },
    ];

    const result = await of(...readings)
      .pipe(
        movingAverage('temperature', 3),
        toArray()
      )
      .toPromise();

    expect(result.map(r => r.value)).toEqual([
      10,
      15,
      20,
      30,
      40,
    ]);
  });

});