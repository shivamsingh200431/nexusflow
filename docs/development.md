# Development Guide

## Prerequisites

- Node.js
- npm
- A MongoDB Atlas database or compatible MongoDB deployment

## Backend

From the repository root:

```bash
cd backend
npm install
npm run dev
```

The local backend runs on port `5000`.

## Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example` and configure the API base URL. For local development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

## Validation

Frontend scripts are defined in `frontend/package.json`:

```bash
npm test
npm run build
npm run lint
```

Use the test command for automated tests, build to verify the production bundle, and lint to check source quality.

## Development workflow

1. Start MongoDB access and the backend.
2. Start the Vite frontend.
3. Confirm `GET /api/health` succeeds.
4. Confirm devices are available.
5. Build or load a flow in Flow Builder.
6. Save the flow to publish it to the rule engine.
7. Submit telemetry for a registered device.
8. Confirm the live telemetry event reaches the frontend and matching rules produce an alert.

## Debugging real-time telemetry

The WebSocket endpoint is `/ws`. A browser/client should receive messages with `type: telemetry` after valid telemetry is accepted by the API. The frontend rule-engine stream automatically reconnects after an unexpected close.

## Environment variables

### Frontend

- `VITE_API_BASE_URL`: HTTP API base URL.
- `VITE_WS_URL`: WebSocket endpoint used by the telemetry stream.

Backend environment variables are defined by the backend configuration and environment example files in the repository.
