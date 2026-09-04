/**
 * Application-level store for consumed Alert Events.
 *
 * This module deliberately contains no React and no RxJS: the rule engine
 * pushes Alert Events in through `ingest()`, and any UI layer reads them back
 * out through `subscribe()` / `getSnapshot()`. That keeps the alert consumption
 * logic testable on its own, without a renderer or a live stream.
 *
 * Alert Event Contract (docs/contracts.md section 4) is treated as read-only.
 * `id`, `time` and `acknowledged` are UI-only additions layered on top of the
 * contract fields - the same convention Dashboard.jsx already documents. No
 * contract field is renamed, removed or overwritten.
 */

/** Newest alerts are kept; older ones fall off the end of the buffer. */
export const MAX_ALERTS = 100;

function pad(value) {
  return String(value).padStart(2, '0');
}

/**
 * Derives the `HH:MM:SS` display label the alert list renders, from the
 * contract's ISO `timestamp`.
 */
export function formatAlertTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '--:--:--';
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Adds the UI-only fields the alert views need, without touching any field
 * defined by the Alert Event Contract.
 */
export function decorateAlert(alert, fallbackId) {
  return {
    ...alert,
    id: alert.id ?? fallbackId,
    time: alert.time ?? formatAlertTime(alert.timestamp),
    acknowledged: alert.acknowledged ?? false,
  };
}

const IDLE_STATUS = { state: 'idle', error: null };

export function createAlertStore({ maxAlerts = MAX_ALERTS } = {}) {
  const listeners = new Set();

  let alerts = [];
  let status = IDLE_STATUS;
  // `useSyncExternalStore` compares snapshots by identity, so this reference is
  // replaced only when something actually changed - never rebuilt per read.
  let snapshot = { alerts, status };
  let sequence = 0;

  function publish() {
    snapshot = { alerts, status };

    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        console.error('[alerts] store listener failed:', error);
      }
    }
  }

  /** Registers a change listener. Returns an idempotent unsubscribe function. */
  function subscribe(listener) {
    listeners.add(listener);

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return snapshot;
  }

  /** Consumes one Alert Event emitted by the rule engine. */
  function ingest(alert) {
    if (!alert) {
      return;
    }

    sequence += 1;

    const decorated = decorateAlert(alert, `${alert.ruleId ?? 'alert'}#${sequence}`);

    // Newest first, and bounded: the engine emits for every telemetry reading,
    // so an unbounded list would grow for as long as the tab stays open.
    alerts = [decorated, ...alerts].slice(0, maxAlerts);

    publish();
  }

  function setStatus(next) {
    const resolved = next ?? IDLE_STATUS;

    if (resolved.state === status.state && resolved.error === status.error) {
      return;
    }

    status = resolved;
    publish();
  }

  function acknowledge(id) {
    const target = alerts.find((alert) => alert.id === id);

    if (!target || target.acknowledged) {
      return false;
    }

    alerts = alerts.map((alert) =>
      alert.id === id ? { ...alert, acknowledged: true } : alert
    );

    publish();

    return true;
  }

  function clear() {
    if (alerts.length === 0) {
      return;
    }

    alerts = [];
    publish();
  }

  /** Test helper: drops all alerts and returns the status to idle. */
  function reset() {
    alerts = [];
    status = IDLE_STATUS;
    sequence = 0;
    publish();
  }

  return {
    subscribe,
    getSnapshot,
    ingest,
    setStatus,
    acknowledge,
    clear,
    reset,
    get listenerCount() {
      return listeners.size;
    },
  };
}

/** The store the application uses. Tests build isolated ones with the factory. */
export const alertStore = createAlertStore();
