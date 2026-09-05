# NexusFlow Demo Guide

## Objective

Demonstrate the complete telemetry-to-alert workflow using the visual rule engine.

## Demo flow

```text
Device telemetry
      ↓
Backend API
      ↓
MongoDB
      ↓
WebSocket
      ↓
RxJS rule engine
      ↓
Moving Average
      ↓
Threshold
      ↓
Alert
      ↓
Dashboard
```

## Suggested presentation sequence

1. Open the Dashboard and briefly explain that NexusFlow monitors IoT devices and processes their telemetry through visual rules.
2. Open Devices and select a registered device.
3. Open Flow Builder and show the sensor → moving average → threshold → alert pipeline.
4. Explain the configuration of the threshold and alert nodes.
5. Save the flow. Saving publishes the flow to the rule engine.
6. Submit telemetry for the selected device.
7. Show the live telemetry path and the resulting alert in the dashboard.
8. Return to the Dashboard and explain how the alert represents the rule being triggered.

## Example telemetry

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

Use a device that actually exists in the running database.

## Key points to explain

- The workflow is configured visually rather than being hardcoded into the dashboard.
- Telemetry is persisted before it is broadcast live.
- WebSocket provides real-time delivery while MongoDB provides persistence/history.
- RxJS turns the live telemetry stream into a rule-processing pipeline.
- The same flow definition can be persisted and reloaded.
- Alerts are generated from the active workflow rather than from a dashboard-only condition.

## What to avoid during the demo

- Do not use an unregistered device identifier.
- Do not change multiple unrelated flow nodes immediately before demonstrating telemetry.
- Keep the backend and frontend running before starting the live portion.
