import { useEffect, useRef, useState } from 'react';
import { fetchDevices, fetchDeviceTelemetry } from '../api/deviceApi.js';
import './Devices.css';

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
  return (
    <button
      className={`device-card ${selected ? 'device-card--selected' : ''}`}
      onClick={() => onSelect(device)}
    >
      <div className="device-card__top">
        <div>
          <h2>{device.name}</h2>
          <p>{device.deviceId}</p>
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
          <span className="telemetry-panel__label">
            Latest reading
          </span>
          <span className="telemetry-panel__device">
            {latest.deviceId}
          </span>
        </div>

        <time dateTime={latest.timestamp}>
          {new Date(latest.timestamp).toLocaleString()}
        </time>
      </div>

      <div className="telemetry-grid">
        {Object.entries(latest.metrics).map(([metric, value]) => (
          <div className="telemetry-card" key={metric}>
            <span className="telemetry-card__label">
              {metric}
            </span>

            <strong className="telemetry-card__value">
              {typeof value === 'number'
                ? value.toLocaleString()
                : value}
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
                <td>
                  {new Date(reading.timestamp).toLocaleString()}
                </td>

                {Object.keys(telemetry[0].metrics).map((metric) => (
                  <td key={metric}>
                    {reading.metrics[metric] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
  
  const telemetryRequestRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDevices() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDevices();

        if (!cancelled) {
          setDevices(data.devices || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load devices:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDevices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      telemetryRequestRef.current?.abort();
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSelectDevice = async (device) => {
    // Cancel the previous telemetry request
    telemetryRequestRef.current?.abort();

    const controller = new AbortController();
    telemetryRequestRef.current = controller;

    setSelectedDevice(device);
    setTelemetry([]);
    setTelemetryError(null);
    setTelemetryLoading(true);

    try {
      const data = await fetchDeviceTelemetry(
        device.deviceId,
        controller.signal
      );

      setTelemetry(data.telemetry || []);
    } catch (err) {
      // Aborted requests are expected when switching devices
      if (err.name === 'AbortError') {
        return;
      }

      console.error('Failed to load telemetry:', err);
      setTelemetryError(err.message);
    } finally {
      if (!controller.signal.aborted) {
        setTelemetryLoading(false);
      }
    }
  };

  return (
    <main className="devices-page">
      <header className="devices-page__header">
        <div>
          <span className="devices-page__eyebrow">NEXUSFLOW · EQUIPMENT</span>
          <h1>Devices</h1>
          <p>Monitor and manage connected equipment.</p>
        </div>

        {!loading && !error && (
          <div className="devices-page__count">
            <strong>{devices.length}</strong>
            <span>{devices.length === 1 ? 'device' : 'devices'}</span>
          </div>
        )}
      </header>

      {loading && (
        <section className="devices-grid" aria-label="Loading devices">
          {Array.from({ length: 6 }, (_, index) => (
            <DeviceSkeleton key={index} />
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="devices-state">
          <div className="devices-state__icon">!</div>
          <h2>Unable to load devices</h2>
          <p>{error}</p>
          <button className="nf-btn nf-btn--primary" onClick={handleRetry}>
            Try again
          </button>
        </section>
      )}

      {!loading && !error && devices.length === 0 && (
        <section className="devices-state">
          <div className="devices-state__icon">+</div>
          <h2>No devices found</h2>
          <p>
            There are no registered devices yet. Add a device to start
            monitoring equipment.
          </p>
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
            <div className="telemetry-state">
              <h3>Unable to load telemetry</h3>
              <p>{telemetryError}</p>
            </div>
          )}

          {!telemetryLoading &&
            !telemetryError &&
            telemetry.length === 0 && (
              <div className="telemetry-state">
                <h3>No telemetry available</h3>
                <p>
                  This device has not reported any telemetry data yet.
                </p>
              </div>
            )}

            {!telemetryLoading &&
              !telemetryError &&
              telemetry.length > 0 && (
                <>
                <TelemetryData telemetry={telemetry} />
                <TelemetryHistory telemetry={telemetry} />
                </>
              )}
          </section>
        )}
    </main>
  );
}

export default Devices;

