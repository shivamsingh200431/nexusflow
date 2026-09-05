# NexusFlow Architecture

## Overview

NexusFlow is a visual IoT telemetry and rule engine. It combines device telemetry ingestion, persistent storage, a reactive rule-processing pipeline, alert generation, WebSocket delivery, and a React dashboard.

```text
Sensor / Mock Hardware
        |
        v
Telemetry Ingestion API
        |
        v
MongoDB / Mongoose
        |
        +----------------------+
        |                      |
        v                      v
Telemetry WebSocket       Persisted Flow
        |                      |
        v                      v
RxJS Rule Pipeline <--- Flow Compiler
        |
        v
Moving Average
        |
        v
Threshold
        |
        v
Alert Action
        |
        v
Dashboard / Alerts
```

## Frontend

The frontend is a React application built with Vite. React Router handles page navigation. React Flow provides the node-based workflow editor, Recharts is used for telemetry visualization, and RxJS provides the reactive rule-engine stream.

Main areas include:

- Dashboard: system overview, metrics, alerts, and device summaries.
- Devices: device discovery, status, selection, and telemetry history.
- Flow Builder: visual workflow construction, configuration, persistence, and publishing.
- Rule Engine: telemetry subscription and processing logic.

## Backend

The backend is a Node.js/Express API using Mongoose for MongoDB access.

Responsibilities:

- expose health, device, telemetry, and flow APIs;
- validate and persist telemetry and workflow data;
- maintain the WebSocket endpoint at `/ws`;
- broadcast accepted telemetry events to connected WebSocket clients.

## Real-time telemetry

Telemetry submitted through `POST /api/telemetry` is persisted first. After a successful save, the backend broadcasts a normalized telemetry event over WebSocket.

The frontend rule engine subscribes to the WebSocket stream through an RxJS `Observable`. It filters events by device when required and reconnects after an unexpected socket close.

## Rule processing

Persisted flow graphs are compiled into the supported processing pipeline. The current supported connection sequence is:

```text
sensor -> movingAverage -> threshold -> alert
```

The moving-average stage transforms telemetry values before threshold evaluation. When the threshold condition is met, the alert stage produces alert metadata for the dashboard.

## Flow persistence and publishing

The Flow Builder sends workflow graphs to the backend through the Flow API. Saving a flow also restarts the rule engine so the persisted flow becomes the active processing configuration.

## Data flow

A typical alert-producing request follows this path:

1. A sensor or mock client sends telemetry.
2. The backend validates and stores the telemetry.
3. The backend broadcasts the stored telemetry over `/ws`.
4. The RxJS telemetry stream receives the event.
5. The active flow processes the metric through moving average and threshold nodes.
6. A matching threshold produces an alert.
7. The alert is surfaced in the dashboard's alert experience.

## Design principles

- Keep workflow definitions data-driven rather than hardcoding a single rule.
- Keep telemetry metrics dynamic so additional returned metrics can be rendered without changing the UI.
- Use shared contracts for communication between major layers.
- Keep real-time delivery separate from persistence: MongoDB remains the historical data store while WebSocket provides live events.
