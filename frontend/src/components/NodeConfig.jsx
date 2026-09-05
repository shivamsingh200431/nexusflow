const getDisplayName = (type) => {
  const names = {
    sensor: 'Sensor',
    movingAverage: 'Moving Average',
    threshold: 'Threshold',
    alert: 'Alert',
  }
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

const CONFIG_FIELDS = {
  sensor: [
    { key: 'deviceId', label: 'Device ID', type: 'text' },
  ],
  movingAverage: [
    { key: 'metric', label: 'Metric', type: 'select', options: ['temperature', 'pressure', 'humidity', 'vibration', 'voltage', 'current'] },
    { key: 'window', label: 'Window', type: 'number', min: 1, max: 100 },
  ],
  threshold: [
    { key: 'metric', label: 'Metric', type: 'select', options: ['temperature', 'pressure', 'humidity', 'vibration', 'voltage', 'current'] },
    { key: 'operator', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '=='] },
    { key: 'value', label: 'Value', type: 'number', step: 'any' },
  ],
  alert: [
    { key: 'channel', label: 'Channel', type: 'select', options: ['mock-sms', 'mock-email', 'mock-webhook'] },
  ],
}

export default function NodeConfig({ node, onUpdate, onDelete }) {
  if (!node) {
    return (
      <aside className="nf-sidebar nf-sidebar--config">
        <div className="nf-sidebar__header">Node Config</div>
        <p className="nf-config__empty">Select a node to edit</p>
      </aside>
    )
  }

  const fields = CONFIG_FIELDS[node.type] || []

  const handleChange = (key, value) => {
    onUpdate(node.id, { ...node.data, [key]: value })
  }

  return (
    <aside className="nf-sidebar nf-sidebar--config">
      <div className="nf-sidebar__header">
        {getDisplayName(node.type)} Config
      </div>
      <div className="nf-config__fields">
        {fields.map((field) => (
          <div key={field.key} className="nf-config__field">
            <label className="nf-config__label">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="nf-config__input"
                value={node.data[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                className="nf-config__input"
                type="number"
                value={node.data[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            ) : (
              <input
                className="nf-config__input"
                type="text"
                value={node.data[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="nf-config__actions">
        <button
          className="nf-btn nf-btn--danger nf-config__delete"
          type="button"
          onClick={() => onDelete(node.id)}
        >
          Delete Node
        </button>
      </div>
    </aside>
  )
}
