import { getAlertsStream } from './pipeline.js';

let subscription = null;
let listeners = [];

export function onAlert(callback) {
  listeners.push(callback);

  return function unsubscribe() {
    listeners = listeners.filter((l) => l !== callback);
  };
}

export async function startRuleEngine() {
  if (subscription) {
    return;
  }

  const alerts$ = await getAlertsStream();

  subscription = alerts$.subscribe((alert) => {
    listeners.forEach((callback) => callback(alert));
  });
}

export function stopRuleEngine() {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
}

// Exposed for testing only
export function _resetForTests() {
  stopRuleEngine();
  listeners = [];
}