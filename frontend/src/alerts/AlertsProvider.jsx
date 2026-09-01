import { createContext, useEffect, useState } from 'react';
import {
  startRuleEngine,
  stopRuleEngine,
  onAlert,
} from '../rule-engine/alertService.js';

export const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAlert((alert) => {
      if (!mounted) return;

      setAlerts((current) => [alert, ...current]);
    });
    
    startRuleEngine();

    return () => {
      mounted = false;
      unsubscribe();
      stopRuleEngine();
    };
  }, []);

  return (
    <AlertsContext.Provider value={alerts}>
      {children}
    </AlertsContext.Provider>
  );
}