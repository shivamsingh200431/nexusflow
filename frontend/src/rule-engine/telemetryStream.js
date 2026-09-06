import { Observable } from 'rxjs';

function getWsUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return apiBase.replace(/\/api\/?$/, '').replace(/^http/, 'ws') + '/ws';
}

export function telemetry$(deviceId) {
  return new Observable((subscriber) => {
    const socket = new WebSocket(getWsUrl());

    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type !== 'telemetry') return;
      if (deviceId && payload.deviceId !== deviceId) return;

      subscriber.next({
        timestamp: payload.timestamp,
        deviceId: payload.deviceId,
        metrics: payload.data || {},
      });
    };

    socket.onerror = () => {
      subscriber.error(new Error('WebSocket telemetry connection failed'));
    };

    socket.onclose = () => {
      subscriber.complete();
    };

    return () => {
      socket.close();
    };
  });
}