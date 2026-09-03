import { useEffect, useSyncExternalStore } from 'react';
import { AlertsContext } from './alertsContext.js';
import { alertStore } from './alertStore.js';
import { acquireRuleEngine } from '../rule-engine/alertService.js';

export function AlertsProvider({ children, store = alertStore }) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

 useEffect(() => {
  const release = acquireRuleEngine({
    onAlert: (alert) => {
      store.ingest(alert);
    },

    onStatusChange: (status) => {
      store.setStatus(status);
    },
  });

  return release;
}, [store]);

  const value = {
    ...snapshot,
    actions: {
      acknowledge: store.acknowledge,
      clear: store.clear,
    },
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
}