import { WebSocketServer, WebSocket } from 'ws';

const allowedOrigins = (process.env.WS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const clients = new Set();

function isAllowedOrigin(origin) {
  // In production, require an explicit allowlist.
  if (process.env.NODE_ENV === 'production') {
    return Boolean(origin && allowedOrigins.includes(origin));
  }

  // Local development.
  if (!origin) {
    return true;
  }

  return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}

export function createWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: ({ origin }, callback) => {
      if (!isAllowedOrigin(origin)) {
        callback(false, 403, 'Origin not allowed');
        return;
      }

      callback(true);
    },
  });

  wss.on('connection', (socket) => {
    clients.add(socket);

    socket.isAlive = true;

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });

    socket.on('close', () => {
      clients.delete(socket);
    });
  });

  const heartbeat = setInterval(() => {
    for (const socket of clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        clients.delete(socket);
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);

  wss.on('close', () => {
    clearInterval(heartbeat);
    clients.clear();
  });

  console.log('WebSocket server available at /ws');

  return wss;
}

export function broadcastEvent(event) {
  if (
    !event ||
    typeof event !== 'object' ||
    typeof event.type !== 'string' ||
    typeof event.timestamp !== 'string' ||
    typeof event.deviceId !== 'string'
  ) {
    throw new Error('Invalid WebSocket event');
  }

  const payload = JSON.stringify(event);

  for (const socket of clients) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}