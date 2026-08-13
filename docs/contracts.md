# NexusFlow — Data & Integration Contracts

This document defines the data structures exchanged between NexusFlow
components.

These contracts allow frontend and backend modules to be developed
independently.

If a contract needs to change, discuss the change with the team before
modifying it.

---

## 1. Telemetry Contract

Telemetry represents a measurement received from an IoT device.

### Example

```json
{
  "timestamp": "2026-08-11T10:30:00.000Z",
  "deviceId": "turbine-001",
  "metrics": {
    "temperature": 82.4,
    "pressure": 14.2,
    "rpm": 3200
  }
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `timestamp` | ISO 8601 string | Yes | Time at which the measurement was recorded |
| `deviceId` | string | Yes | Identifier of the device producing the telemetry |
| `metrics` | object | Yes | Key-value collection of measurements |

### Metrics

The `metrics` object is intentionally flexible.

Example:

```json
{
  "temperature": 82.4,
  "pressure": 14.2,
  "rpm": 3200
}
```

Another device may provide:

```json
{
  "voltage": 240,
  "current": 12.5,
  "frequency": 50
}
```

The telemetry model should not require a fixed set of sensor measurements.

---

## 2. Flow Graph Contract

The Flow Graph represents a visual data-processing pipeline created
using React Flow.

The graph consists of:

- `nodes` — processing components
- `edges` — connections between components
- `data` — configuration for individual nodes

### Example

```json
{
  "nodes": [
    {
      "id": "sensor-1",
      "type": "sensor",
      "data": {
        "deviceId": "turbine-001"
      }
    },
    {
      "id": "average-1",
      "type": "movingAverage",
      "data": {
        "metric": "temperature",
        "window": 5
      }
    },
    {
      "id": "threshold-1",
      "type": "threshold",
      "data": {
        "metric": "temperature",
        "operator": ">",
        "value": 80
      }
    },
    {
      "id": "alert-1",
      "type": "alert",
      "data": {
        "channel": "mock-sms"
      }
    }
  ],
  "edges": [
    {
      "source": "sensor-1",
      "target": "average-1"
    },
    {
      "source": "average-1",
      "target": "threshold-1"
    },
    {
      "source": "threshold-1",
      "target": "alert-1"
    }
  ]
}
```

### Node Structure

Every node must contain:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier within the graph |
| `type` | string | Node type used by the compiler |
| `data` | object | Node-specific configuration |

### Edge Structure

Every edge must contain:

| Field | Type | Description |
|---|---|---|
| `source` | string | ID of the source node |
| `target` | string | ID of the destination node |

### Initial Node Types

The first version of NexusFlow will support:

```text
sensor
movingAverage
threshold
alert
```

Additional node types can be added later.

---

## 3. Live Event Contract

The backend may send real-time events to the frontend through WebSockets.

Each event contains a `type` field so the frontend can determine how
the event should be handled.

### Telemetry Event

```json
{
  "type": "telemetry",
  "timestamp": "2026-08-11T10:30:00.000Z",
  "deviceId": "turbine-001",
  "data": {
    "temperature": 82.4,
    "pressure": 14.2,
    "rpm": 3200
  }
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `type` | string | Event type |
| `timestamp` | ISO 8601 string | Event timestamp |
| `deviceId` | string | Device associated with the event |
| `data` | object | Event-specific telemetry data |

---

## 4. Alert Event Contract

An alert event is generated when a rule evaluates to true.

### Example

```json
{
  "type": "alert",
  "timestamp": "2026-08-11T10:30:01.000Z",
  "deviceId": "turbine-001",
  "ruleId": "threshold-1",
  "severity": "high",
  "message": "Temperature exceeded 80°C",
  "data": {
    "metric": "temperature",
    "value": 82.4,
    "threshold": 80
  }
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `type` | string | Always `alert` for alert events |
| `timestamp` | ISO 8601 string | Time the alert was generated |
| `deviceId` | string | Device that triggered the rule |
| `ruleId` | string | Node/rule that generated the alert |
| `severity` | string | Alert severity |
| `message` | string | Human-readable alert message |
| `data` | object | Values relevant to the triggered rule |

### Initial Severity Levels

```text
low
medium
high
critical
```

---

## 5. Contract Ownership

### Telemetry Contract

Primary owner:

**Shivam**

Used by:

- Ingestion API
- MongoDB Time-Series storage
- RxJS rule engine
- Dashboard

### Flow Graph Contract

Primary owners:

**Vimalesh + Sagar**

Used by:

- React Flow builder
- Graph serialization
- Stream compiler

### Live Event / Alert Contract

Primary owners:

**Shivam + Chizoba**

Used by:

- WebSocket server
- Dashboard
- Alert visualization

---

## 6. Contract Change Rules

These contracts are shared interfaces.

Before changing:

- field names
- field types
- required fields
- node types
- event types

the change should be discussed with the team.

A change to a contract may affect multiple branches.

When a contract changes:

1. Update this document.
2. Inform affected team members.
3. Update the relevant implementation.
4. Test the affected integration.

---

## 7. Development with Mock Data

Team members do not need to wait for the complete backend.

Frontend development may use mock telemetry and mock events that follow
the contracts defined above.

The rule engine may use mock telemetry streams.

The backend may initially use manually generated telemetry.

Once individual modules are complete, the mock sources can be replaced
with the real implementations.