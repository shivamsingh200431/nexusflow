const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchDevices() {
  const response = await fetch(`${API_BASE}/devices`);

  if (!response.ok) {
    throw new Error(`Failed to fetch devices: ${response.status}`);
  }

  return response.json();
}

export async function fetchDeviceTelemetry(deviceId, signal) {
  const response = await fetch(
    `${API_BASE}/telemetry?deviceId=${encodeURIComponent(deviceId)}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch telemetry: ${response.status}`);
  }

  return response.json();
}