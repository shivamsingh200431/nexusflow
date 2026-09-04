import { Observable } from 'rxjs';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function telemetry$(deviceId) {
  return new Observable((subscriber) => {
    let stopped = false;
    let lastTelemetryId = null;

    const poll = async () => {
      try {
        const url = deviceId
          ? `${API_BASE}/telemetry?deviceId=${encodeURIComponent(deviceId)}`
          : `${API_BASE}/telemetry`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Telemetry API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.telemetry?.length) {
          const latest = data.telemetry[0];

          if (latest._id !== lastTelemetryId) {
            lastTelemetryId = latest._id;

            subscriber.next({
              timestamp: latest.timestamp,
              deviceId: latest.deviceId,
              metrics: latest.metrics || {},
            });
          }
        }
      } catch (error) {
        console.error('Telemetry polling failed:', error.message);
      }

      if (!stopped) {
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      stopped = true;
    };
  });
}