import { useCallback } from 'react'

const NODE_TYPES = [
  { type: 'sensor', label: 'Sensor', icon: '📡', tone: 'sensor', defaultData: { deviceId: 'DEVICE-01', metric: 'temperature' } },
  { type: 'movingAverage', label: 'Moving Average', icon: '📊', tone: 'movingAverage', defaultData: { operation: 'moving_average', window: 5 } },
  { type: 'threshold', label: 'Threshold', icon: '🔍', tone: 'threshold', defaultData: { field: 'temperature', operator: '>', value: 80 } },
  { type: 'alert', label: 'Alert', icon: '🚨', tone: 'alert', defaultData: { message: 'High Temperature', severity: 'critical' } },
]

export default function NodePalette({ onAddNode }) {
  const handleAdd = useCallback((def) => {
    const id = `${def.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const node = {
      id,
      type: def.type,
      position: { x: 150, y: 150 },
      data: { ...def.defaultData },
    }
    onAddNode(node)
  }, [onAddNode])

  return (
    <aside className="nf-sidebar">
      <div className="nf-sidebar__header">Node Palette</div>
      <div className="nf-sidebar__list">
        {NODE_TYPES.map((def) => (
          <button
            key={def.type}
            className={`nf-palette-btn nf-palette-btn--${def.tone}`}
            onClick={() => handleAdd(def)}
            title={`Add ${def.label} node`}
          >
            <span className="nf-palette-btn__icon">{def.icon}</span>
            <span className="nf-palette-btn__label">{def.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
