import { useEffect, useRef, useState } from 'react';
import { createDevice, fetchDevices, fetchDeviceTelemetry } from '../api/deviceApi.js';
import { createLiveTelemetryConnection } from '../api/liveTelemetry.js';
import { toDevicePayload, validateDeviceForm } from './deviceActions.js';
import './Devices.css';

const EMPTY_FORM = {
  deviceId: '',
  name: '',
  type: '',
  location: '',
};

function DeviceSkeleton() {
  return (
    <div className="device-card device-card--skeleton" aria-hidden="true">
      <div className="device-card__top">
        <div>
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--id" />
        </div>
        <div className="skeleton skeleton--status" />
      </div>
      <div className="device-card__details">
        <div className="skeleton skeleton--label" />
        <div className="skeleton skeleton--value" />
      </div>
    </div>
  );
}

function DeviceCard({ device, selected, onSelect }) {
  const location = device.metadata?.location;

  return (
    <button
      className={`device-card ${selected ? 'device-card--selected' : ''}`}
      onClick={() => onSelect(device)}
    >
      <div className="device-card__top">
        <div className="device-card__identity">
          <span className="device-card__type-mark" aria-hidden="true">▦</span>
          <div>
            <h2>{device.name}</h2>
            <p>{device.deviceId}</p>
          </div>
        </div>

        <span className={`device-status device-status--${device.status}`}>
          <span className="device-status__dot" />
          {device.status}
        </span>
      </div>

      <div className="device-card__details">
        <div>
          <span>Type</span>
          <strong>{device.type}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{location || 'Not specified'}</strong>
        </div>
      </div>

      <div className="device-card__footer">
        <span>View telemetry</span>
        <span aria-hidden="true">→</span>
      </div>
    </button>
  );
}

function TelemetrySkeleton() {
  return (
    <section className="telemetry-panel">
      <div className="telemetry-panel__header">
        <div className="skeleton skeleton--telemetry-title" />
        <div className="skeleton skeleton--telemetry-time" />
      </div>
      <div className="telemetry-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="telemetry-card telemetry-card--skeleton" key={index}>
            <div className="skeleton skeleton--metric-label" />
            <div className="skeleton skeleton--metric-value" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TelemetryData({ telemetry }) {
  const latest = telemetry[0];

  return (
    <div className="telemetry-panel">
      <div className="telemetry-panel__header">
        <div>
          <span className="telemetry-panel__label">Latest reading</span>
          <span className="telemetry-panel__device">{latest.deviceId}</span>
        </div>
        <time dateTime={latest.timestamp}>
          {new Date(latest.timestamp).toLocaleString()}
        </time>
      </div>

      <div className="telemetry-grid">
        {Object.entries(latest.metrics).map(([metric, value]) => (
          <div className="telemetry-card" key={metric}>
            <span className="telemetry-card__label">{metric}</span>
            <strong className="telemetry-card__value">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelemetryHistory({ telemetry }) {
  return (
    <section className="telemetry-history">
      <div className="telemetry-history__header">
        <div>
          <span className="devices-page__eyebrow">RECENT READINGS</span>
          <h3>Telemetry history</h3>
        </div>
        <span className="telemetry-history__count">
          {telemetry.length} {telemetry.length === 1 ? 'reading' : 'readings'}
        </span>
      </div>

      <div className="telemetry-history__table-wrap">
        <table className="telemetry-history__table">
          <thead>
            <tr>
              <th>Time</th>
              {Object.keys(telemetry[0].metrics).map((metric) => (
                <th key={metric}>{metric}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {telemetry.map((reading) => (
              <tr key={reading._id}>
                <td>{new Date(reading.timestamp).toLocaleString()}</td>
                {Object.keys(telemetry[0].metrics).map((metric) => (
                  <td key={metric}>{reading.metrics[metric] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AddDeviceModal({ form, errors, submitting, onChange, onSubmit, onClose }) {
  return (
    <div className="device-modal__backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="device-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-device-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="device-modal__header">
          <div>
            <span className="devices-page__eyebrow">DEVICE REGISTRY</span>
            <h2 id="add-device-title">Add Device</h2>
            <p>Register equipment so it can be monitored and used in flows.</p>
          </div>
          <button className="device-modal__close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="device-modal__fields">
            <label>
              Device ID
              <input
                value={form.deviceId}
                onChange={(event) => onChange('deviceId', event.target.value)}
                placeholder="pump-002"
                autoFocus
              />
            </label>
            <label>
              Device Name
              <input
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="Cooling Pump"
              />
            </label>
            <label>
              Device Type
              <input
                value={form.type}
                onChange={(event) => onChange('type', event.target.value)}
                placeholder="Pump"
              />
            </label>
            <label>
              Location <span>Optional</span>
              <input
                value={form.location}
                onChange={(event) => onChange('location', event.target.value)}
                placeholder="Factory Floor 2"
              />
            </label>
          </div>

          {errors.length > 0 && (
            <div className="device-modal__error" role="alert">
              {errors.map((error) => <div key={error}>{error}</div>)}
            </div>
          )}

          <div className="device-modal__actions">
            <button className="nf-btn" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="nf-btn nf-btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceForm, setDeviceForm] = useState(EMPTY_FORM);
  const [deviceFormErrors, setDeviceFormErrors] = useState([]);
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);

  const telemetryRequestRef = useRef(null);
  const selectedDeviceRef = useRef(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDevices();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDevices() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDevices();
        if (!cancelled) setDevices(data.devices || []);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load devices:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialDevices();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const connection = createLiveTelemetryConnection({
      onTelemetry: (event) => {
        setTelemetry((currentTelemetry) => {
          const selected = selectedDeviceRef.current;
          if (!selected || event.deviceId !== selected.deviceId) return currentTelemetry;

          const reading = {
            _id: `live-${event.timestamp}-${event.deviceId}`,
            timestamp: event.timestamp,
            deviceId: event.deviceId,
            metrics: event.data,
          };
          return [reading, ...currentTelemetry].slice(0, 100);
        });
      },
      onError: (connectionError) => console.error('Live telemetry connection failed:', connectionError),
      onClose: () => console.log('Live telemetry connection closed'),
    });

    return () => connection.close();
  }, []);

  useEffect(() => () => telemetryRequestRef.current?.abort(), []);

  const handleSelectDevice = async (device) => {
    selectedDeviceRef.current = device;
    const controller = new AbortController();
    telemetryRequestRef.current?.abort();
    telemetryRequestRef.current = controller;

    setSelectedDevice(device);
    setTelemetry([]);
    setTelemetryError(null);
    setTelemetryLoading(true);

    try {
      const data = await fetchDeviceTelemetry(device.deviceId, controller.signal);
      setTelemetry((currentTelemetry) => {
        const history = data.telemetry || [];
        const historyIds = new Set(history.map((reading) => reading._id));
        const liveReadings = currentTelemetry.filter(
          (reading) => reading._id?.startsWith('live-') && !historyIds.has(reading._id)
        );
        return [...liveReadings, ...history].slice(0, 100);
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load telemetry:', err);
      setTelemetryError(err.message);
    } finally {
      if (!controller.signal.aborted) setTelemetryLoading(false);
    }
  };

  const handleFormChange = (key, value) => {
    setDeviceForm((current) => ({ ...current, [key]: value }));
    setDeviceFormErrors([]);
  };

  const closeAddDevice = () => {
    if (deviceSubmitting) return;
    setShowAddDevice(false);
    setDeviceForm(EMPTY_FORM);
    setDeviceFormErrors([]);
  };

  const handleAddDevice = async (event) => {
    event.preventDefault();
    const validationErrors = validateDeviceForm(deviceForm);
    if (validationErrors.length > 0) {
      setDeviceFormErrors(validationErrors);
      return;
    }

    try {
      setDeviceSubmitting(true);
      setDeviceFormErrors([]);
      await createDevice(toDevicePayload(deviceForm));
      closeAddDevice();
      await loadDevices();
    } catch (err) {
      console.error('Failed to create device:', err);
      setDeviceFormErrors([err.message]);
    } finally {
      setDeviceSubmitting(false);
    }
  };

  const activeCount = devices.filter((device) => device.status === 'active').length;
  const inactiveCount = devices.filter((device) => device.status === 'inactive').length;

  return (
    <main className="devices-page">
      <header className="devices-page__header">
        <div>
          <span className="devices-page__eyebrow">NEXUSFLOW · EQUIPMENT</span>
          <h1>Devices</h1>
          <p>Register, monitor, and inspect connected equipment.</p>
        </div>

        <div className="devices-page__header-actions">
          {!loading && !error && (
            <div className="devices-page__count">
              <strong>{devices.length}</strong>
              <span>{devices.length === 1 ? 'device' : 'devices'}</span>
            </div>
          )}
          <button className="nf-btn nf-btn--primary devices-page__add" type="button" onClick={() => setShowAddDevice(true)}>
            <span aria-hidden="true">+</span> Add Device
          </button>
        </div>
      </header>

      {!loading && !error && (
        <section className="devices-overview" aria-label="Device overview">
          <div><span>Total devices</span><strong>{devices.length}</strong></div>
          <div><span>Active</span><strong>{activeCount}</strong></div>
          <div><span>Inactive</span><strong>{inactiveCount}</strong></div>
          <div><span>Live telemetry</span><strong>{selectedDevice ? 'Connected' : 'Select a device'}</strong></div>
        </section>
      )}

      {loading && (
        <section className="devices-grid" aria-label="Loading devices">
          {Array.from({ length: 6 }, (_, index) => <DeviceSkeleton key={index} />)}
        </section>
      )}

      {!loading && error && (
        <section className="devices-state">
          <div className="devices-state__icon">!</div>
          <h2>Unable to load devices</h2>
          <p>{error}</p>
          <button className="nf-btn nf-btn--primary" onClick={loadDevices}>Try again</button>
        </section>
      )}

      {!loading && !error && devices.length === 0 && (
        <section className="devices-state devices-state--empty">
          <div className="devices-state__icon">+</div>
          <h2>No devices registered</h2>
          <p>Add your first device to make it available for monitoring and Flow Builder sensor configuration.</p>
          <button className="nf-btn nf-btn--primary" onClick={() => setShowAddDevice(true)}>Add Device</button>
        </section>
      )}

      {!loading && !error && devices.length > 0 && (
        <section className="devices-grid" aria-label="Devices">
          {devices.map((device) => (
            <DeviceCard
              key={device._id}
              device={device}
              selected={selectedDevice?._id === device._id}
              onSelect={handleSelectDevice}
            />
          ))}
        </section>
      )}

      {selectedDevice && (
        <section className="telemetry-section">
          <div className="telemetry-section__heading">
            <div>
              <span className="devices-page__eyebrow">LIVE TELEMETRY</span>
              <h2>{selectedDevice.name}</h2>
            </div>
          </div>

          {telemetryLoading && <TelemetrySkeleton />}
          {!telemetryLoading && telemetryError && (
            <div className="telemetry-state"><h3>Unable to load telemetry</h3><p>{telemetryError}</p></div>
          )}
          {!telemetryLoading && !telemetryError && telemetry.length === 0 && (
            <div className="telemetry-state"><h3>No telemetry available</h3><p>This device has not reported any telemetry data yet.</p></div>
          )}
          {!telemetryLoading && !telemetryError && telemetry.length > 0 && (
            <><TelemetryData telemetry={telemetry} /><TelemetryHistory telemetry={telemetry} /></>
          )}
        </section>
      )}

      {showAddDevice && (
        <AddDeviceModal
          form={deviceForm}
          errors={deviceFormErrors}
          submitting={deviceSubmitting}
          onChange={handleFormChange}
          onSubmit={handleAddDevice}
          onClose={closeAddDevice}
        />
      )}
    </main>
  );
}

export default Devices;
