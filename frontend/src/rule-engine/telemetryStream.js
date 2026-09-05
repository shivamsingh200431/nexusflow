import { Observable } from 'rxjs';

const WS_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:5000/ws';

function isTelemetryEvent(event) {
  return (
    event &&
    event.type === 'telemetry' &&
    typeof event.timestamp === 'string' &&
    typeof event.deviceId === 'string' &&
    event.data &&
    typeof event.data === 'object' &&
    !Array.isArray(event.data)
  );
}

export function telemetry$(deviceId) {
  return new Observable((subscriber) => {
    let stopped = false;
    let socket = null;

    const connect = () => {
      if (stopped) {
        return;
      }

      socket = new WebSocket(WS_URL);

      socket.addEventListener('message', ({ data }) => {
        try {
          const event = JSON.parse(data);

          if (!isTelemetryEvent(event)) {
            return;
          }

          if (deviceId && event.deviceId !== deviceId) {
            return;
          }

          subscriber.next({
            timestamp: event.timestamp,
            deviceId: event.deviceId,
            metrics: event.data,
          });
        } catch (error) {
          console.error('Telemetry WebSocket message failed:', error.message);
        }
      });

      socket.addEventListener('error', (error) => {
        console.error('Telemetry WebSocket error:', error);
      });

      socket.addEventListener('close', () => {
        if (!stopped) {
          // Keep the rule engine alive and reconnect if the backend restarts or
          // the browser temporarily loses the WebSocket connection.
          setTimeout(connect, 2000);
        }
      });
    };

    connect();

    return () => {
      stopped = true;

      if (socket) {
        socket.close();
        socket = null;
      }
    };
  });
}
