import { createContext } from 'react';

/**
 * Kept in its own module so AlertsProvider.jsx exports nothing but the
 * component: mixing a context export into a component file breaks Vite's fast
 * refresh (and trips react-refresh/only-export-components).
 *
 * Consumers should use the hooks in useAlerts.js rather than this context.
 */
export const AlertsContext = createContext(null);
