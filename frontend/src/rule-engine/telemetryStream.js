import { Observable } from 'rxjs';

const WS_BASE =
  import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export function telemetry$(deviceId) {
  return new Observable((subscriber) => {
    let socket;
    let stopped = false;
    let reconnectTimer;

    const connect = () => {
      if (stopped) return;

      socket = new WebSocket(WS_BASE);

      socket.onopen = () => {
        console.log('Telemetry WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type !== 'telemetry') return;

          if (deviceId && message.deviceId !== deviceId) return;

          subscriber.next({
            timestamp: message.timestamp,
            deviceId: message.deviceId,
            metrics: message.data || {},
          });
        } catch (error) {
          console.error(
            'Telemetry WebSocket message parsing failed:',
            error.message
          );
        }
      };

      socket.onerror = (error) => {
        console.error('Telemetry WebSocket error:', error);
      };

      socket.onclose = () => {
        if (stopped) return;

        console.warn('Telemetry WebSocket disconnected');

        reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }
    };
  });
}