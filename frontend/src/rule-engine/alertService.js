import { getAlertsStream } from './pipeline.js';

let subscription = null;
let startingPromise = null;

let listeners = [];
let consumers = new Map();

let streamSource = getAlertsStream;

let status = {
  state: 'idle',
  error: null,
};

let stoppedDuringStartup = false;
let restartRequested = false;

export function configureRuleEngine({ streamSource: source } = {}) {
  if (source) {
    streamSource = source;
  }
}

export function onAlert(callback) {
  listeners.push(callback);

  return function unsubscribe() {
    listeners = listeners.filter((listener) => listener !== callback);
  };
}

function notifyStatus() {
  consumers.forEach(({ onStatusChange }) => {
    if (!onStatusChange) return;

    try {
      onStatusChange(status);
    } catch (error) {
      console.error('Rule engine status listener failed:', error);
    }
  });
}

function emitAlert(alert) {
  listeners.forEach((callback) => {
    try {
      callback(alert);
    } catch (error) {
      console.error('Alert listener failed:', error);
    }
  });

  consumers.forEach(({ onAlert: callback }) => {
    if (!callback) return;

    try {
      callback(alert);
    } catch (error) {
      console.error('Alert consumer failed:', error);
    }
  });
}

export function startRuleEngine() {
  if (subscription) {
    return Promise.resolve(status);
  }

  if (startingPromise) {
    if (stoppedDuringStartup) {
      restartRequested = true;
    }

    return startingPromise;
  }

  stoppedDuringStartup = false;

  status = {
    state: 'starting',
    error: null,
  };

  notifyStatus();

  const startupPromise = Promise.resolve()
    .then(() => streamSource())
    .then((alerts$) => {
      if (stoppedDuringStartup) {
        status = {
          state: 'idle',
          error: null,
        };

        notifyStatus();

        if (restartRequested) {
          restartRequested = false;
          stoppedDuringStartup = false;

          // Allow the completed startup to be replaced by a fresh one.
          startingPromise = null;

          return startRuleEngine();
        }

        return status;
      }

      subscription = alerts$.subscribe({
        next: emitAlert,

        error: (error) => {
          subscription = null;

          status = {
            state: 'error',
            error,
          };

          notifyStatus();
        },

        complete: () => {
          subscription = null;

          status = {
            state: 'idle',
            error: null,
          };

          notifyStatus();
        },
      });

      status = {
        state: 'running',
        error: null,
      };

      notifyStatus();

      return status;
    })
    .catch((error) => {
      status = {
        state: 'error',
        error,
      };

      console.error('Failed to build rule engine:', error);
      notifyStatus();

      return status;
    })
    .finally(() => {
      if (startingPromise === startupPromise) {
        startingPromise = null;
      }
    });

  startingPromise = startupPromise;

  return startupPromise;
}

export function stopRuleEngine() {
  stoppedDuringStartup = true;

  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }

  if (!startingPromise) {
    restartRequested = false;
  }

  consumers.clear();

  status = {
    state: 'idle',
    error: null,
  };

  notifyStatus();
}

export function acquireRuleEngine({
  onAlert: alertCallback,
  onStatusChange,
} = {}) {
  const consumerId = Symbol('rule-engine-consumer');

  consumers.set(consumerId, {
    onAlert: alertCallback,
    onStatusChange,
  });

  // Tell a late consumer the current state immediately.
  if (onStatusChange) {
    try {
      onStatusChange(status);
    } catch (error) {
      console.error('Rule engine status listener failed:', error);
    }
  }

  const startPromise = startRuleEngine();

  startPromise.catch((error) => {
    console.error('Failed to start rule engine:', error);
  });

  let released = false;

  return function release() {
    if (released) return;

    released = true;
    consumers.delete(consumerId);

    if (consumers.size === 0) {
      stopRuleEngine();
    }
  };
}

export function restartRuleEngine() {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }

  if (startingPromise) {
    stoppedDuringStartup = true;
    restartRequested = true;

    return startingPromise;
  }

  startingPromise = null;
  stoppedDuringStartup = false;
  restartRequested = false;

  status = {
    state: 'idle',
    error: null,
  };

  notifyStatus();

  return startRuleEngine();
}

export function getRuleEngineStatus() {
  return status;
}

export function getRuleEngineRefCount() {
  return consumers.size;
}

export function _resetForTests() {
  if (subscription) {
    subscription.unsubscribe();
  }

  subscription = null;
  startingPromise = null;

  listeners = [];
  consumers.clear();

  streamSource = getAlertsStream;

  stoppedDuringStartup = false;
  restartRequested = false;

  status = {
    state: 'idle',
    error: null,
  };
}