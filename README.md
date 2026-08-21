# NexusFlow

NexusFlow is a visual IoT telemetry and rule engine that allows users to build
data-processing pipelines through a visual node-based interface.

The project combines a visual workflow builder with device telemetry,
rule-based processing, and alert generation.

## Tech Stack

### Frontend

- React
- Vite
- React Flow
- React Router
- Recharts

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- Nodemon

## Current Features

### Visual Workflow Builder

- Node-based workflow editor using React Flow
- Sensor nodes
- Moving average nodes
- Threshold nodes
- Alert nodes
- Connect nodes to define processing pipelines
- Configure node properties through the node configuration panel

### Flow Persistence

Flows can be persisted through the backend API.

- Create flows with `POST /api/flows`
- Retrieve flows with `GET /api/flows`
- Frontend loads the latest saved flow
- Frontend saves workflow graphs through the Flow API
- API base URL is configured through `VITE_API_BASE_URL`

### Device Monitoring

The Devices page provides:

- Device list retrieved from the backend
- Device status
- Device type and identifier
- Device selection
- Loading skeletons
- Empty states
- Error states

### Telemetry

Selecting a device loads its telemetry data from the backend.

The telemetry interface currently provides:

- Latest telemetry metrics
- Dynamic metric rendering
- Recent telemetry history
- Timestamped readings
- Responsive telemetry tables
- Telemetry loading skeletons
- Telemetry error and empty states
- Request cancellation when switching devices

Telemetry metrics are not hardcoded, allowing additional metrics to be
displayed automatically when returned by the backend.

### Rule Engine

The rule engine processes telemetry through workflow-defined rules.

The current pipeline supports:

- Telemetry streams
- Moving averages
- Threshold evaluation
- Alert generation
- Alert severity and metadata
- Dynamic flow compilation from persisted flows

Example rule:

```
Sensor
   ↓
Moving Average
   ↓
Threshold
   ↓
Alert
```

## API

### Health

```
GET /api/health
```

### Devices

```
GET  /api/devices
POST /api/devices
GET  /api/devices/:id
```

### Telemetry

```
GET /api/telemetry
POST /api/telemetry
```

Telemetry can be filtered by device and time range.

Example:

```
GET /api/telemetry?deviceId=turbine-001
```

### Flows

```
GET  /api/flows
POST /api/flows
```

## Environment Configuration

The frontend uses the following environment variable:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Create a local `.env` file in the `frontend` directory.

An example configuration is provided in:

```
frontend/.env.example
```

## Project Structure

```
nexusflow/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── rule-engine/
│   ├── public/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   └── ...
│
└── docs/
```

## Running the Project

### Backend

From the project root:

```bash
cd backend
npm install
npm run dev
```


The backend runs on:


http://localhost:5000


### Frontend

In another terminal:

bash

cd frontend
npm install
npm run dev


The frontend runs on the Vite development server.

## Development Status

NexusFlow is currently under active development.

Implemented functionality includes:

- Visual workflow construction
- Flow persistence
- Dynamic flow loading
- Device API integration
- Telemetry ingestion and retrieval
- Device monitoring
- Telemetry history
- Rule-based telemetry processing
- Threshold alerts
- Loading, empty, and error states

Further work will focus on expanding the real-time monitoring experience,
workflow capabilities, and production readiness.

## Roadmap

Planned areas of development include:

- Real-time telemetry monitoring
- Rich telemetry visualizations
- Expanded rule types
- Improved workflow validation
- Alert history and management
- Enhanced device management
- Authentication and authorization
- Production deployment and optimization