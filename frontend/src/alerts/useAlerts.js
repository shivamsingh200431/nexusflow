import { useContext, useMemo } from 'react';
import { AlertsContext } from './alertsContext.js';

function useAlertsContext(hookName) {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error(`${hookName} must be used within an AlertsProvider`);
  }

  return context;
}

export function useAlerts() {
  return useAlertsContext('useAlerts');
}

export function useAlertsStatus() {
  return useAlertsContext('useAlertsStatus').status;
}

export function useAlertActions() {
  const { actions } = useAlertsContext('useAlertActions');

  return useMemo(
    () => ({
      acknowledge: actions.acknowledge,
      clear: actions.clear,
    }),
    [actions.acknowledge, actions.clear]
  );
}
