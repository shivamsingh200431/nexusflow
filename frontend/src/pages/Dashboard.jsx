import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlerts } from "../alerts/useAlerts.js";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Dashboard.css";

// ---------------------------------------------------------------------------
// Mock data — shaped to match docs/contracts.md exactly:
//   Telemetry Contract:  { timestamp, deviceId, metrics: { ... } }
//   Alert Event Contract: { type, timestamp, deviceId, ruleId, severity, message, data }
// `time` (display label) and `acknowledged` are local UI-only additions layered
// on top — they don't rename or replace any required contract field.
// ---------------------------------------------------------------------------

function isoAt(hh, mm, ss) {
  const d = new Date();
  d.setHours(hh, mm, ss, 0);
  return d.toISOString();
}

const seedTelemetry = [
  { timestamp: isoAt(9, 0, 0), time: "09:00", deviceId: "turbine-001", metrics: { temperature: 72.2, pressure: 48.8, rpm: 2910, vibration: 1.8 } },
  { timestamp: isoAt(9, 10, 0), time: "09:10", deviceId: "turbine-001", metrics: { temperature: 73.4, pressure: 49.4, rpm: 2960, vibration: 1.9 } },
  { timestamp: isoAt(9, 20, 0), time: "09:20", deviceId: "turbine-001", metrics: { temperature: 75.1, pressure: 50.2, rpm: 3010, vibration: 2.0 } },
  { timestamp: isoAt(9, 30, 0), time: "09:30", deviceId: "turbine-001", metrics: { temperature: 76.8, pressure: 51.0, rpm: 3075, vibration: 2.1 } },
  { timestamp: isoAt(9, 40, 0), time: "09:40", deviceId: "turbine-001", metrics: { temperature: 78.6, pressure: 52.1, rpm: 3150, vibration: 2.4 } },
  { timestamp: isoAt(9, 50, 0), time: "09:50", deviceId: "turbine-001", metrics: { temperature: 80.4, pressure: 52.8, rpm: 3190, vibration: 2.6 } },
  { timestamp: isoAt(10, 0, 0), time: "10:00", deviceId: "turbine-001", metrics: { temperature: 82.1, pressure: 53.5, rpm: 3220, vibration: 2.8 } },
  { timestamp: isoAt(10, 10, 0), time: "10:10", deviceId: "turbine-001", metrics: { temperature: 84.2, pressure: 54.2, rpm: 3250, vibration: 3.1 } },
];

const deviceSeed = [
  { deviceId: "turbine-001", assetId: "TRB-01", name: "Turbine Alpha", type: "Gas Turbine", location: "Bay A-3", status: "online", uptime: "14d 6h", lastSeen: "just now", metrics: { temperature: 78.6, pressure: 12.4, rpm: 3150, vibration: 2.4 } },
  { deviceId: "turbine-002", assetId: "TRB-02", name: "Turbine Beta", type: "Gas Turbine", location: "Bay A-4", status: "warning", uptime: "7d 2h", lastSeen: "2s ago", metrics: { temperature: 84.3, pressure: 13.1, rpm: 3214, vibration: 3.7 } },
  { deviceId: "compressor-001", assetId: "CMP-01", name: "Compressor 1", type: "Air Compressor", location: "Bay B-1", status: "online", uptime: "21d 14h", lastSeen: "just now", metrics: { temperature: 69.8, pressure: 12.8, rpm: 2840, vibration: 1.7 } },
  { deviceId: "compressor-002", assetId: "CMP-02", name: "Compressor 2", type: "Air Compressor", location: "Bay B-2", status: "offline", uptime: "—", lastSeen: "18m ago", metrics: { temperature: null, pressure: null, rpm: null, vibration: null } },
  { deviceId: "pump-001", assetId: "PMP-01", name: "Pump Gamma", type: "Hydraulic Pump", location: "Bay C-1", status: "online", uptime: "12d 8h", lastSeen: "just now", metrics: { temperature: 63.5, pressure: 10.9, rpm: 2480, vibration: 2.1 } },
  { deviceId: "pump-002", assetId: "PMP-02", name: "Pump Delta", type: "Hydraulic Pump", location: "Bay C-2", status: "warning", uptime: "9d 4h", lastSeen: "4s ago", metrics: { temperature: 76.2, pressure: 11.7, rpm: 2590, vibration: 5.1 } },
];

const alertSeed = [
  { id: "AL-001", type: "alert", timestamp: isoAt(14, 32, 11), time: "14:32:11", deviceId: "turbine-002", ruleId: "threshold-1", severity: "critical", message: "Temperature exceeded 80°C (moving average)", data: { metric: "temperature", value: 84.3, threshold: 80 }, acknowledged: false },
  { id: "AL-002", type: "alert", timestamp: isoAt(14, 28, 44), time: "14:28:44", deviceId: "pump-002", ruleId: "threshold-vibration-1", severity: "high", message: "Vibration exceeded 4.5 mm/s", data: { metric: "vibration", value: 5.1, threshold: 4.5 }, acknowledged: false },
  { id: "AL-003", type: "alert", timestamp: isoAt(14, 15, 2), time: "14:15:02", deviceId: "compressor-001", ruleId: "threshold-pressure-1", severity: "low", message: "Pressure spike detected in incoming telemetry", data: { metric: "pressure", value: 12.8, threshold: 12 }, acknowledged: true },
  { id: "AL-004", type: "alert", timestamp: isoAt(13, 58, 17), time: "13:58:17", deviceId: "turbine-001", ruleId: "rpm-drift-1", severity: "low", message: "RPM drift exceeded 2% monitoring band", data: { metric: "rpm", value: 3214, threshold: 3150 }, acknowledged: true },
];


function severityClass(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high" || severity === "medium") return "warning";
  return "info";
}

const metricConfig = {
  temperature: { label: "Temperature", unit: "°C", color: "#22d3ee" },
  pressure: { label: "Pressure", unit: "bar", color: "#60a5fa" },
  rpm: { label: "RPM", unit: "RPM", color: "#a78bfa" },
  vibration: { label: "Vibration", unit: "mm/s", color: "#34d399" },
};

const navItems = ["Overview", "Devices", "Pipeline", "Telemetry", "Alerts"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function movingAverage(telemetry, metric, window = 5) {
  const values = telemetry.slice(-window).map((point) => point.metrics[metric]).filter((v) => v != null);
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function nextTelemetryPoint(previous, deviceId) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const prevMetrics = previous.metrics;
  return {
    timestamp: now.toISOString(),
    time,
    deviceId,
    metrics: {
      temperature: clamp(prevMetrics.temperature + (Math.random() - 0.46) * 1.5, 65, 95),
      pressure: clamp(prevMetrics.pressure + (Math.random() - 0.5) * 0.35, 45, 60),
      rpm: Math.round(clamp(prevMetrics.rpm + (Math.random() - 0.5) * 50, 2700, 3400)),
      vibration: clamp(prevMetrics.vibration + (Math.random() - 0.5) * 0.45, 0.8, 6),
    },
  };
}

function StatusDot({ status = "online" }) {
  return <span className={`status-dot ${status}`} aria-label={status} />;
}

function formatValue(metric, value) {
  if (value === null || value === undefined) return "—";
  if (metric === "rpm") return Math.round(value).toLocaleString();
  return Number(value).toFixed(1);
}

function MetricCard({ metric, value, selected, onClick, activeMetric }) { // <-- ADD activeMetric here
  const config = metricConfig[metric];
  return (
    <button className={`metric-button ${selected? "selected" : ""}`} onClick={onClick}>
      <article className="metric-card glass-card">
        <div className="metric-top">
          <span className="metric-icon">{metric === "temperature"? "°" : metric === "pressure"? "P" : metric === "rpm"? "R" : "V"}</span>
          <span className="live-pill"><StatusDot /> LIVE</span>
        </div>
        <div className="metric-label">{config.label}</div>
        <div className="metric-value">{formatValue(metric, value)}<span>{config.unit}</span></div>

        <div className={`metric-spark spark-${metric}`} aria-hidden="true">
            {Array.from({ length: 7 }).map((_, index) =>
            <i key={index} style={{ height: `${18 + ((index + Math.round(value || 0)) % 5) * 7}px` }} />
          )}
        </div>

        <div className="metric-footer"><span>Streaming now</span><strong>Live telemetry</strong></div>
      </article>
    </button>
  );
}

function FactoryVisualization({ device, telemetry }) {
  const latest = telemetry[telemetry.length - 1];
  const m = latest.metrics;
  return (
    <section className="factory-card glass-card" id="overview">
      <div className="factory-header">
        <div>
          <div className="eyebrow"><span className="pulse-ring" /> LIVE FACTORY TELEMETRY</div>
          <h2>{device.name}</h2>
          <p>{device.type} · {device.location} · device ID {device.deviceId}</p>
        </div>
        <div className="factory-status"><StatusDot status={device.status} /> {device.status === "warning" ? "Attention required" : device.status === "offline" ? "Device offline" : "Connected"}</div>
      </div>
      <div className="factory-stage">
        <img src="/nexusflow-factory.png" alt="Industrial machinery monitored by NexusFlow" />
        <div className="image-vignette" />
        <div className="sensor-marker marker-one"><span /><b>TEMP</b><small>{formatValue("temperature", m.temperature)}°C</small></div>
        <div className="sensor-marker marker-two"><span /><b>PRESS</b><small>{formatValue("pressure", m.pressure)} bar</small></div>
        <div className="sensor-marker marker-three"><span /><b>RPM</b><small>{formatValue("rpm", m.rpm)}</small></div>
        <div className="sensor-marker marker-four"><span /><b>VIB</b><small>{formatValue("vibration", m.vibration)} mm/s</small></div>
        <div className="telemetry-chip chip-one"><StatusDot /> Temperature <strong>{formatValue("temperature", m.temperature)}°C</strong></div>
        <div className="telemetry-chip chip-two"><StatusDot /> RPM <strong>{formatValue("rpm", m.rpm)}</strong></div>
        <div className="factory-overlay-note"><span>IoT SENSOR STREAM</span><strong>{device.deviceId}</strong><small>Telemetry received just now</small></div>
      </div>
    </section>
  );
}

function RulePipeline({ device, latest, telemetry }) {
  const temp = latest.metrics.temperature;
  const avg = telemetry ? movingAverage(telemetry, "temperature", 5) : null;
  const triggered = avg != null && avg > 80;
  const nodes = [
    { title: "Sensor", subtitle: device.deviceId, accent: "cyan", value: `${formatValue("temperature", temp)}°C`, icon: "◉" },
    { title: "Moving Average", subtitle: "window: 5", accent: "violet", value: avg != null ? `${avg.toFixed(1)}°C` : "—", icon: "≈" },
    { title: "Threshold", subtitle: "temp > 80°C", accent: "orange", value: "> 80°C", icon: "⊘" },
    { title: "Alert", subtitle: "webhook action", accent: triggered ? "red" : "green", value: triggered ? "TRIGGERED" : "ARMED", icon: "!" },
  ];
  return (
    <section className="rule-card glass-card" id="pipeline">
      <div className="section-heading">
        <div><span className="eyebrow">ACTIVE RULE PIPELINE · {device.name}</span><h2>Visual telemetry rule</h2></div>
        <span className="rule-running"><StatusDot status={triggered ? "warning" : "online"} /> {triggered ? "Triggered" : "Running"}</span>
      </div>
      <div className="rule-flow">
        {nodes.map((node, index) => (
          <div className="rule-step-wrap" key={node.title}>
            <div className={`rule-node ${node.accent}`}>
              <div className="node-icon">{node.icon}</div>
              <div><span>{node.title}</span><small>{node.subtitle}</small></div>
              <strong>{node.value}</strong>
            </div>
            {index < nodes.length - 1 && <div className="flow-connector"><i /><i /><i /></div>}
          </div>
        ))}
      </div>
      <div className="rule-caption"><span>Sensor</span><span>→</span><span>Moving Average</span><span>→</span><span>Threshold &gt; 80°C</span><span>→</span><span>Alert</span></div>
      <pre className="graph-json">{JSON.stringify({
        nodes: [
          { id: "sensor-1", type: "sensor", data: { deviceId: device.deviceId, metric: "temperature" } },
          { id: "average-1", type: "movingAverage", data: { metric: "temperature", window: 5 } },
          { id: "threshold-1", type: "threshold", data: { metric: "temperature", operator: ">", value: 80 } },
          { id: "alert-1", type: "alert", data: { channel: "mock-sms" } },
        ],
        edges: [
          { source: "sensor-1", target: "average-1" },
          { source: "average-1", target: "threshold-1" },
          { source: "threshold-1", target: "alert-1" },
        ],
      }, null, 2)}</pre>
    </section>
  );
}

function TelemetryChart({ metric, telemetry }) {
  const config = metricConfig[metric];
  const latestPoint = telemetry[telemetry.length - 1];
  const latestValue = latestPoint?.metrics?.[metric];
  const gradientId = `fill-${metric}`;
  return (
    <div className="chart-panel glass-card">
      <div className="chart-header">
        <div><span className="eyebrow">{config.label.toUpperCase()}</span><div className="chart-value">{formatValue(metric, latestValue)}<small>{config.unit}</small></div></div>
        <span className="chart-live"><StatusDot /> Live</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={telemetry.slice(-30)}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={config.color} stopOpacity={0.32} /><stop offset="100%" stopColor={config.color} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 7" stroke="rgba(100,116,139,.14)" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} width={45} />
            <Tooltip contentStyle={{ background: "rgba(10,18,32,.96)", border: "1px solid rgba(103,232,249,.25)", borderRadius: 12, color: "#fff" }} formatter={(value) => [`${value} ${config.unit}`, config.label]} />
            <Area type="monotone" dataKey={(d) => d.metrics[metric]} stroke="none" fill={`url(#${gradientId})`} />
            <Line type="monotone" dataKey={(d) => d.metrics[metric]} stroke={config.color} strokeWidth={2.7} dot={{ r: 2.2, fill: config.color, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#fff", stroke: config.color, strokeWidth: 3 }} isAnimationActive animationDuration={900} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeviceCard({ device, selected, onSelect }) {
  const m = device.metrics;
  return (
    <button className={`device-card ${selected ? "selected" : ""}`} onClick={() => onSelect(device.deviceId)}>
      <div className={`device-card-orb ${device.status}`}><span /></div>
      <div className="device-card-head"><div><strong>{device.name}</strong><small>{device.type}</small></div><StatusDot status={device.status} /></div>
      <div className="device-meta"><span>DEVICE ID<strong>{device.deviceId} · {device.assetId || "—"}</strong></span><span>LOCATION<strong>{device.location}</strong></span></div>
      <div className="device-meta"><span>UPTIME<strong>{device.uptime}</strong></span><span>LAST SEEN<strong>{device.lastSeen}</strong></span></div>
      <div className={`device-status-band ${device.status}`}>{device.status.toUpperCase()}</div>
      <div className="device-readings-grid">
        <span>Temp <b>{formatValue("temperature", m.temperature)}°C</b></span>
        <span>Pressure <b>{formatValue("pressure", m.pressure)} bar</b></span>
        <span>RPM <b>{formatValue("rpm", m.rpm)}</b></span>
        <span>Vibration <b>{formatValue("vibration", m.vibration)} mm/s</b></span>
      </div>
    </button>
  );
}

function DevicesView({ devices, selectedId, onSelect }) {
  const counts = {
    online: devices.filter((d) => d.status === "online").length,
    warning: devices.filter((d) => d.status === "warning").length,
    offline: devices.filter((d) => d.status === "offline").length,
  };
  return (
    <section className="page-card glass-card" id="devices-page">
      <div className="page-title-row"><div><span className="eyebrow">DEVICE FLEET</span><h2>Connected machines</h2><p>{counts.online} online · {counts.warning} warning · {counts.offline} offline</p></div><span className="fleet-live"><StatusDot /> LIVE</span></div>
      <div className="device-grid-large">{devices.map((device) => <DeviceCard key={device.deviceId} device={device} selected={device.deviceId === selectedId} onSelect={onSelect} />)}</div>
    </section>
  );
}

function DeviceDetail({ device, telemetry, alerts, onBack }) {
  const latest = telemetry[telemetry.length - 1];
  const deviceAlerts = alerts.filter((alert) => alert.deviceId === device.deviceId);
  return (
    <section className="device-detail-page glass-card">
      <div className="detail-header"><button className="back-button" onClick={onBack}>← Devices</button><div className="detail-status"><StatusDot status={device.status} /> {device.status.toUpperCase()}</div></div>
      <div className="detail-title"><div><span className="eyebrow">DEVICE DETAIL · {device.deviceId}</span><h2>{device.name}</h2><p>{device.type} · {device.location} · uptime {device.uptime}</p></div><span className="last-seen">LAST SEEN <strong>{device.lastSeen}</strong></span></div>
      <div className="detail-metrics">
        {Object.keys(metricConfig).map((metric) => <article key={metric} className="detail-metric"><span>{metricConfig[metric].label}</span><strong>{formatValue(metric, metric === "temperature" ? latest.metrics.temperature : device.metrics[metric])} <small>{metricConfig[metric].unit}</small></strong><em><StatusDot /> LIVE</em></article>)}
      </div>
      <div className="detail-grid">
        <TelemetryChart metric="temperature" telemetry={telemetry} />
        <TelemetryChart metric="pressure" telemetry={telemetry} />
        <TelemetryChart metric="rpm" telemetry={telemetry} />
        <TelemetryChart metric="vibration" telemetry={telemetry} />
      </div>
      <div className="device-alert-history"><div className="section-heading"><div><span className="eyebrow">DEVICE EVENTS</span><h3>Alerts for {device.name}</h3></div><span>{deviceAlerts.length} event(s)</span></div>{deviceAlerts.length ? deviceAlerts.map((alert) => <AlertRow key={alert.id} alert={alert} compact />) : <div className="empty-state">No alerts recorded for this device.</div>}</div>
    </section>
  );
}

function AlertRow({ alert, onAcknowledge, onOpenDevice }) {
  const cls = severityClass(alert.severity);
  return (
    <div className={`alert-row detailed ${cls} ${alert.acknowledged ? "acknowledged" : ""}`} onClick={() => onOpenDevice?.(alert.deviceId)} role={onOpenDevice ? "button" : undefined} tabIndex={onOpenDevice ? 0 : undefined} onKeyDown={(event) => { if (onOpenDevice && (event.key === "Enter" || event.key === " ")) onOpenDevice(alert.deviceId); }}>
      <div className="alert-symbol">{cls === "info" ? "i" : "!"}</div>
      <div className="alert-copy"><strong>{alert.message}</strong><span>{alert.deviceId} · Measured: <b>{alert.data.value} {metricConfig[alert.data.metric]?.unit ?? ""}</b></span><small>Rule {alert.ruleId} · threshold {alert.data.threshold ?? "—"}</small></div>
      <div className="alert-time"><strong>{alert.time}</strong><span className={`severity ${cls}`}>{alert.acknowledged ? "ACKNOWLEDGED" : alert.severity.toUpperCase()}</span>{!alert.acknowledged && onAcknowledge && <button className="ack-button" onClick={(event) => { event.stopPropagation(); onAcknowledge(alert.id); }}>Acknowledge</button>}</div>
    </div>
  );
}

function AlertsView({ alerts, onAcknowledge, onOpenDevice }) {
  const active = alerts.filter((a) => !a.acknowledged);
  return (
    <section className="page-card glass-card alert-center" id="alerts-page">
      <div className="page-title-row"><div><span className="eyebrow">ALERT CENTER</span><h2>Telemetry events</h2><p>{active.length} active · {alerts.length - active.length} acknowledged</p></div><span className="alert-center-count">{active.length} active</span></div>
      <div className="detailed-alert-list">{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} onAcknowledge={onAcknowledge} onOpenDevice={onOpenDevice} />)}</div>
    </section>
  );
}

function Navbar({ alertCount, devices, selectedId, currentView, onNavigate, onDeviceSelect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const selectedDevice = devices.find((device) => device.deviceId === selectedId) || devices[0];
  const navigate = (view) => { setMenuOpen(false); onNavigate(view); };
  return (
    <>
      <header className="navbar">
        <button className="brand" onClick={() => navigate("Overview")}><div className="brand-mark"><span>N</span></div><strong>Nexus<span>Flow</span></strong></button>
        <nav>
          {navItems.map((item) => item === "Devices" ? (
            <div className="nav-dropdown" key={item} >
              <button className="nav-link" onClick={() => { onNavigate("Devices"); setDeviceMenuOpen((open) => !open); }}>{item} <span style={{color:'black', fontSize:'15px'}}>⌄</span></button>
              {deviceMenuOpen && <div className="device-dropdown">{devices.map((device) => <button key={device.deviceId} onClick={() => { onDeviceSelect(device.deviceId); setDeviceMenuOpen(false); }}>{device.name}<small>{device.deviceId} · {device.status}</small></button>)}</div>}
            </div>
          ) : <button className={`nav-link ${currentView === item ? "active" : ""}`} onClick={() => navigate(item)} key={item}>{item}{item === "Alerts" && alertCount > 0 ? <b className="nav-badge">{alertCount}</b> : null}</button>)}
        </nav>
        <div className="nav-actions">
          <button className="device-selector" onClick={() => { onNavigate("Devices"); onDeviceSelect(selectedDevice.deviceId); }}><span>{selectedDevice.deviceId}</span><strong>{selectedDevice.name}</strong><span>⌄</span></button>
          <button className="icon-button notification" aria-label="Notifications" onClick={() => navigate("Alerts")}>◌{alertCount > 0 && <i />}</button>
          <div className="live-clock"><StatusDot /> LIVE</div>
          <div className="user"><div className="avatar">FM</div><div><strong>Factory Manager</strong><span>Admin</span></div></div>
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><span /><span /></button>
        </div>
      </header>
      {menuOpen && <div className="mobile-menu"><button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>×</button>{navItems.map((item) => <button key={item} onClick={() => navigate(item)}>{item}</button>)}<div className="mobile-device-list">{devices.map((device) => <button key={device.deviceId} onClick={() => { onDeviceSelect(device.deviceId); setMenuOpen(false); }}>{device.name} · {device.deviceId}</button>)}</div></div>}
    </>
  );
}

export default function Dashboard() {
  const [view, setView] = useState("Overview");
  const [selectedDeviceId, setSelectedDeviceId] = useState("turbine-001");
  const [activeMetric, setActiveMetric] = useState("temperature");
  const [telemetry, setTelemetry] = useState(seedTelemetry);
  const [devices, setDevices] = useState(deviceSeed);
  const [alerts, setAlerts] = useState(alertSeed);
  const ruleEngineAlerts = useAlerts();

const displayedAlerts = useMemo(
  () => [...ruleEngineAlerts, ...alerts],
  [ruleEngineAlerts, alerts]
);

  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId) || devices[0];
  const selectedTelemetry = useMemo(() => {
    if (selectedDevice.deviceId === "turbine-001") return telemetry;
    const base = selectedDevice.metrics;
    return telemetry.map((point, index) => ({
      timestamp: point.timestamp,
      time: index === telemetry.length - 1 ? "LIVE" : point.time,
      deviceId: selectedDevice.deviceId,
      metrics: {
        temperature: base.temperature == null ? null : Number(clamp(base.temperature - 3.2 + (point.metrics.temperature - 78.6) * 0.45, 45, 95).toFixed(1)),
        pressure: base.pressure == null ? null : Number(clamp(base.pressure + (point.metrics.pressure - 52.1) * 0.3, 0, 20).toFixed(1)),
        rpm: base.rpm == null ? null : Math.round(clamp(base.rpm + (point.metrics.rpm - 3150) * 0.45, 0, 5000)),
        vibration: base.vibration == null ? null : Number(clamp(base.vibration + (point.metrics.vibration - 2.4) * 0.45, 0, 10).toFixed(1)),
      },
    }));
  }, [selectedDevice, telemetry]);
  const latest = selectedTelemetry[selectedTelemetry.length - 1];
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged).length;
  const metrics = useMemo(() => Object.keys(metricConfig), []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTelemetry((current) => [...current, nextTelemetryPoint(current[current.length - 1], "turbine-001")].slice(-60));
      setDevices((current) => current.map((device) => {
        if (device.deviceId === "compressor-002") return device; // offline device: stays offline, no fake readings
        const delta = (Math.random() - 0.5);
        const m = device.metrics;
        return {
          ...device,
          metrics: {
            temperature: m.temperature === null ? null : Number(clamp(m.temperature + delta * 0.45, 55, 92).toFixed(1)),
            pressure: m.pressure === null ? null : Number(clamp(m.pressure + delta * 0.18, 8, 15).toFixed(1)),
            rpm: m.rpm === null ? null : Math.round(clamp(m.rpm + delta * 22, 1800, 3400)),
            vibration: m.vibration === null ? null : Number(clamp(m.vibration + delta * 0.08, 0.5, 6).toFixed(1)),
          },
          lastSeen: device.status === "offline" ? device.lastSeen : "just now",
        };
      }));
    }, 1500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setDevices((current) => current.map((device) => device.deviceId === "turbine-001" ? { ...device, metrics: latest.metrics } : device));
  }, [latest]);

  const openDevice = useCallback((deviceId) => { setSelectedDeviceId(deviceId); setView("Devices"); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const acknowledgeAlert = useCallback((id) => setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, acknowledged: true } : alert)), []);
  const navigate = useCallback((nextView) => { setView(nextView); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const overviewContent = (
    <>
      <section className="welcome-row">
        <div><span className="eyebrow">NEXUSFLOW / OPERATIONS CENTER</span><h1>{selectedDevice.name}, <em>in real time.</em></h1><p>Monitor live telemetry, visualize rules, and respond to machine anomalies before they become downtime.</p></div>
        <div className="system-health"><span className="health-orb"><i /></span><div><strong>{selectedDevice.name}</strong><span>{selectedDevice.deviceId} · {selectedDevice.location}</span></div></div>
      </section>
      {/* <div className="metric-grid">{metrics.map((metric) => <MetricCard key={metric} metric={metric} value={metric === "temperature" ? latest.metrics.temperature : selectedDevice.metrics[metric]} selected={activeMetric === metric} onClick={() => setActiveMetric(metric)} />)}</div> */}
      <div className="metric-grid">
        {metrics.map((metric) =>
          <MetricCard
            key={metric}
            metric={metric}
            value={metric === "temperature"? latest.metrics.temperature : selectedDevice.metrics[metric]}
            selected={activeMetric === metric}
            onClick={() => setActiveMetric(metric)}
            activeMetric={activeMetric} // <-- ADD THIS
          />
        )}
      </div>
      <div className="main-grid"><FactoryVisualization device={selectedDevice} telemetry={selectedTelemetry} /><RulePipeline device={selectedDevice} latest={latest} telemetry={selectedTelemetry} /></div>
      <section className="analytics-section" id="telemetry"><div className="section-heading analytics-title"><div><span className="eyebrow">LIVE TELEMETRY · {selectedDevice.deviceId}</span><h2>Machine performance</h2></div><div className="range-pills">{metrics.map((metric) => <button className={activeMetric === metric ? "active" : ""} onClick={() => setActiveMetric(metric)} key={metric}>{metricConfig[metric].label}</button>)}</div></div><div className="charts-grid"><TelemetryChart metric={activeMetric} telemetry={selectedTelemetry} /><AlertsView alerts={alerts.slice(0, 3)} onAcknowledge={acknowledgeAlert} onOpenDevice={openDevice} /></div></section>
      <section className="system-strip glass-card"><span><StatusDot /> Ingestion API</span><span><StatusDot /> Rule Engine</span><span><StatusDot /> WebSocket</span><span><StatusDot /> MongoDB Time-Series</span></section>
    </>
  );

  return (
    <main className="dashboard-shell">
      <Navbar alertCount={activeAlerts} devices={devices} selectedId={selectedDeviceId} currentView={view} onNavigate={navigate} onDeviceSelect={openDevice} />
      <div className="ambient ambient-a" /><div className="ambient ambient-b" />
      <div className="dashboard-content">
        {view === "Overview" && overviewContent}
        {view === "Devices" && <>{<DevicesView devices={devices} selectedId={selectedDeviceId} onSelect={openDevice} />}<DeviceDetail device={selectedDevice} telemetry={selectedTelemetry} alerts={alerts} onBack={() => navigate("Overview")} /></>}
        {view === "Pipeline" && <RulePipeline device={selectedDevice} latest={latest} telemetry={selectedTelemetry} />}
        {view === "Telemetry" && <section className="page-card glass-card"><div className="page-title-row"><div><span className="eyebrow">LIVE TELEMETRY · {selectedDevice.deviceId}</span><h2>{selectedDevice.name} telemetry</h2><p>Temperature, pressure, RPM and vibration from the selected machine.</p></div><span className="fleet-live"><StatusDot /> LIVE</span></div><div className="detail-grid">{metrics.map((metric) => <TelemetryChart key={metric} metric={metric} telemetry={telemetry} />)}</div></section>}
        {view === "Alerts" && <AlertsView alerts={alerts} onAcknowledge={acknowledgeAlert} onOpenDevice={openDevice} />}
      </div>
    </main>
  );
}