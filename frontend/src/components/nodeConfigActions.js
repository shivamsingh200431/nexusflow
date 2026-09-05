export function getDeviceOptions(devices = [], currentDeviceId = '') {
  const registered = devices
    .filter((device) => device?.deviceId)
    .map((device) => ({
      value: device.deviceId,
      label: `${device.name || device.deviceId} · ${device.deviceId}`,
    }));

  if (currentDeviceId && !registered.some((device) => device.value === currentDeviceId)) {
    registered.unshift({
      value: currentDeviceId,
      label: `${currentDeviceId} · not registered`,
    });
  }

  return registered;
}
