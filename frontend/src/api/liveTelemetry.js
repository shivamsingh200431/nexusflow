const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const WS_BASE = API_BASE.replace(/^http/, 'ws').replace(/\/api\/?$/, '');

export function createLiveTelemetryConnection({
  onTelemetry,
  onAlert,
  onError,
  onClose,
} = {}) {
  const socket = new WebSocket(`${WS_BASE}/ws`);

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'telemetry':
          onTelemetry?.(message);
          break;

        case 'alert':
          onAlert?.(message);
          break;

        default:
          console.warn('Unknown WebSocket event:', message.type);
      }
    } catch (error) {
      console.error('Invalid WebSocket event:', error);
    }
  });

  socket.addEventListener('error', (event) => {
    onError?.(event);
  });

  socket.addEventListener('close', (event) => {
    onClose?.(event);
  });

  return {
    close() {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    },

    get readyState() {
      return socket.readyState;
    },
  };
}