# NexusFlow API Reference

Base URL for local development: `http://localhost:5000/api`

## Health

### `GET /api/health`

Returns the backend health status.

## Devices

### `GET /api/devices`

Returns the available devices.

### `POST /api/devices`

Creates a device.

The exact accepted request fields are defined by the backend device model/controller.

### `GET /api/devices/:id`

Returns a single device by identifier.

## Telemetry

### `GET /api/telemetry`

Returns telemetry records. Telemetry can be filtered by device and time range.

Example:

```text
GET /api/telemetry?deviceId=turbine-001
```

### `POST /api/telemetry`

Accepts telemetry for a registered device, persists it, and broadcasts the accepted reading to connected WebSocket clients.

Example request:

```json
{
  "timestamp": "2026-09-05T10:00:00.000Z",
  "deviceId": "turbine-001",
  "metrics": {
    "temperature": 85,
    "pressure": 14.2,
    "rpm": 3200
  }
}
```

The WebSocket event uses the following normalized shape:

```json
{
  "type": "telemetry",
  "timestamp": "2026-09-05T10:00:00.000Z",
  "deviceId": "turbine-001",
  "data": {
    "temperature": 85,
    "pressure": 14.2,
    "rpm": 3200
  }
}
```

## Flows

### `GET /api/flows`

Returns persisted workflow definitions.

### `POST /api/flows`

Persists a workflow graph containing nodes and edges.

## WebSocket

### `ws://localhost:5000/ws`

The backend exposes a WebSocket endpoint for live telemetry events.

Clients should ignore messages whose `type` is not `telemetry`.

## Configuration

The frontend API base URL is configured with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The frontend WebSocket base URL can be configured with:

```env
VITE_WS_URL=ws://localhost:5000/ws
```

