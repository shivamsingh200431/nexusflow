/**
 * Context wiring test for the alerts layer.
 *
 * Rendered with `react-dom/server`, which needs no DOM and no extra test
 * dependency. Effects do not run during a server render, so this covers the
 * snapshot / context plumbing only - the subscription lifecycle it sets up
 * is covered directly in ../rule-engine/alertService.test.js.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AlertsProvider } from './AlertsProvider.jsx';
import { useAlerts, useAlertActions } from './useAlerts.js';
import { createAlertStore } from './alertStore.js';

function alertEvent() {
  return {
    type: 'alert',
    timestamp: '2026-08-11T10:30:01.000Z',
    deviceId: 'turbine-001',
    ruleId: 'alert-1',
    severity: 'high',
    message: 'temperature > 80 (actual: 84.3)',
    data: { metric: 'temperature', value: 84.3, threshold: 80 },
  };
}

function Probe({ onRender }) {
  const { alerts, status, actions } = useAlerts();

  onRender({ alerts, status, actions });

  return <span>{alerts.length} alerts</span>;
}

function ActionsProbe({ onRender }) {
  const actions = useAlertActions();

  onRender(actions);

  return <span>actions</span>;
}

describe('alerts context', () => {
  it('exposes the store snapshot and the actions to the tree', () => {
    const store = createAlertStore();

    store.ingest(alertEvent());
    store.setStatus({ state: 'running', error: null });

    let seen = null;

    const html = renderToString(
      <AlertsProvider store={store}>
        <Probe onRender={(value) => { seen = value; }} />
      </AlertsProvider>
    );

    expect(html).toContain('alerts');
    // The array is handed over as-is, not copied per render.
    expect(seen.alerts).toBe(store.getSnapshot().alerts);
    expect(seen.status).toEqual({ state: 'running', error: null });
    expect(seen.actions.acknowledge).toBe(store.acknowledge);
    expect(seen.actions.clear).toBe(store.clear);
  });

  it('exposes alert actions through the dedicated hook', () => {
    const store = createAlertStore();
    let seen = null;

    renderToString(
      <AlertsProvider store={store}>
        <ActionsProbe onRender={(value) => { seen = value; }} />
      </AlertsProvider>
    );

    expect(seen.acknowledge).toBe(store.acknowledge);
    expect(seen.clear).toBe(store.clear);
  });

  it('fails loudly when a hook is used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderToString(<Probe onRender={() => {}} />)).toThrow(
      /useAlerts must be used within an AlertsProvider/
    );

    consoleError.mockRestore();
  });
});
