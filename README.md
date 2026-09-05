# NexusFlow

NexusFlow is a visual IoT telemetry and rule engine that lets users build data-processing pipelines through a visual node-based interface.

The application connects device telemetry ingestion, persistent storage, real-time delivery, reactive rule processing, and alert generation in one workflow.

## Architecture

```text
Sensor / Mock Hardware
        ↓
Telemetry API
        ↓
MongoDB
        ↓
WebSocket
        ↓
RxJS Rule Pipeline
        ↓
Moving Average
        ↓
Threshold
        ↓
Alert
        ↓
React Dashboard
```

See [`docs/architecture.md`](docs/architecture.md) for the detailed architecture and data flow.

## Tech Stack

### Frontend

- React
- Vite
- React Flow
- React Router
- Recharts
- RxJS
- Axios

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas / MongoDB
- WebSocket (`ws`)
- Nodemon

## Features

### Visual Workflow Builder

- Node-based workflow editor using React Flow
- Sensor nodes
- Moving Average nodes
- Threshold nodes
- Alert nodes
- Validated node connections
- Node configuration panel
- Load saved workflows
- Save workflows through the backend API
- Saving publishes the workflow to the rule engine

### Device Monitoring

- Device list from the backend
- Device status, type, and identifier
- Device selection
- Loading, empty, and error states
- Responsive device interface

### Telemetry

- Telemetry ingestion through the backend API
- Persistent telemetry storage
- Live telemetry through WebSocket
- Dynamic metric rendering
- Recent telemetry history
- Timestamped readings
- Responsive telemetry tables
- Loading, empty, and error states
- Device filtering

Telemetry metrics are dynamic, so additional returned metrics can be displayed without hardcoding each metric into the interface.

### Rule Engine

The rule engine consumes the live telemetry stream through RxJS and processes workflow-defined rules.

Current pipeline:

```text
Sensor
   ↓
Moving Average
   ↓
Threshold
   ↓
Alert
```

Supported capabilities include:

- Real-time telemetry streams
- Moving-average processing
- Threshold evaluation
- Alert generation
- Alert severity and metadata
- Dynamic flow compilation from persisted workflows
- Automatic WebSocket reconnect in the telemetry stream

### Dashboard

The dashboard provides a concise system overview with device health, telemetry metrics, rule-flow context, and alerts. The visual design is intentionally restrained so status colors communicate meaningful system states rather than decorative effects.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/devices` | List devices |
| POST | `/api/devices` | Create a device |
| GET | `/api/devices/:id` | Get a device |
| GET | `/api/telemetry` | Retrieve telemetry |
| POST | `/api/telemetry` | Ingest and broadcast telemetry |
| GET | `/api/flows` | List saved flows |
| POST | `/api/flows` | Save a flow |
| WebSocket | `/ws` | Receive live telemetry events |

Detailed request/response information is documented in [`docs/api.md`](docs/api.md). Shared data shapes are documented in [`docs/contracts.md`](docs/contracts.md).

## Environment Configuration

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

## Running Locally

### Backend

From the repository root:

```bash
cd backend
npm install
npm run dev
```

The backend runs on port `5000` by default.

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will print the local frontend URL.

## Validation

From `frontend/`:

```bash
npm test
npm run build
npm run lint
```

The test suite validates frontend behavior and the build command verifies the production bundle.

## Project Structure

```text
nexusflow/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── rule-engine/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── ...
└── docs/
    ├── architecture.md
    ├── api.md
    ├── contracts.md
    ├── development.md
    └── demo.md
```

## End-to-End Verification

A complete alert-producing scenario is:

1. Submit telemetry for a registered device.
2. The backend validates and persists the reading.
3. The backend broadcasts the accepted reading over WebSocket.
4. The RxJS telemetry stream receives it.
5. The active flow calculates the moving average and evaluates the threshold.
6. A matching threshold produces an alert.
7. The alert is shown in the application.

For a repeatable presentation walkthrough, see [`docs/demo.md`](docs/demo.md).

## Current Scope

NexusFlow currently focuses on the core visual IoT telemetry and rule-processing workflow. The supported rule chain is Sensor → Moving Average → Threshold → Alert.

Features such as authentication, authorization, additional rule types, richer workflow validation, production deployment, and broader device-management capabilities are outside the current core scope and can be considered future extensions.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system architecture and data flow
- [`docs/api.md`](docs/api.md) — HTTP and WebSocket API reference
- [`docs/contracts.md`](docs/contracts.md) — shared telemetry, flow, WebSocket, and alert contracts
- [`docs/development.md`](docs/development.md) — local setup and development workflow
- [`docs/demo.md`](docs/demo.md) — presentation and end-to-end demo guide
