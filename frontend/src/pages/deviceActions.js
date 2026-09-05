const requiredFields = [
  ['deviceId', 'Device ID is required.'],
  ['name', 'Device name is required.'],
  ['type', 'Device type is required.'],
];

export function validateDeviceForm(form = {}) {
  return requiredFields
    .filter(([key]) => !String(form[key] ?? '').trim())
    .map(([, message]) => message);
}

export function toDevicePayload(form = {}) {
  const location = String(form.location ?? '').trim();

  return {
    deviceId: String(form.deviceId ?? '').trim(),
    name: String(form.name ?? '').trim(),
    type: String(form.type ?? '').trim(),
    ...(location ? { metadata: { location } } : {}),
  };
}
