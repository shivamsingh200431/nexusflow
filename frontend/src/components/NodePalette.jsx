import { useCallback } from 'react'

const NODE_GROUPS = [
  {
    label: 'Triggers',
    nodes: [
      { type: 'sensor', label: 'Sensor', icon: '📡', tone: 'sensor', defaultData: { deviceId: 'DEVICE-01' } },
    ],
  },
  {
    label: 'Processing',
    nodes: [
      { type: 'movingAverage', label: 'Moving Average', icon: '📊', tone: 'movingAverage', defaultData: { metric: 'temperature', window: 5 } },
      { type: 'threshold', label: 'Threshold', icon: '🔍', tone: 'threshold', defaultData: { metric: 'temperature', operator: '>', value: 80 } },
    ],
  },
  {
    label: 'Actions',
    nodes: [
      { type: 'alert', label: 'Alert', icon: '🚨', tone: 'alert', defaultData: { channel: 'mock-sms' } },
    ],
  },
]

export default function NodePalette({ onAddNode, disabled = false }) {
  const handleAdd = useCallback((def) => {
    if (disabled) return

    const id = `${def.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const node = {
      id,
      type: def.type,
      position: { x: 150, y: 150 },
      data: { ...def.defaultData },
    }
    onAddNode(node)
  }, [disabled, onAddNode])

  return (
    <aside className="nf-sidebar nf-sidebar--palette">
      <div className="nf-sidebar__intro">
        <div className="nf-sidebar__header">Node Palette</div>
        <div className="nf-sidebar__hint">Click a node to add it</div>
      </div>

      <div className="nf-sidebar__list">
        {NODE_GROUPS.map((group) => (
          <section key={group.label} className="nf-palette-group">
            <div className="nf-palette-group__title">{group.label}</div>
            <div className="nf-palette-group__items">
              {group.nodes.map((def) => (
                <button
                  key={def.type}
                  className={`nf-palette-btn nf-palette-btn--${def.tone}`}
                  onClick={() => handleAdd(def)}
                  title={`Add ${def.label} node`}
                  type="button"
                  disabled={disabled}
                >
                  <span className="nf-palette-btn__grip" aria-hidden="true">⠿</span>
                  <span className="nf-palette-btn__icon" aria-hidden="true">{def.icon}</span>
                  <span className="nf-palette-btn__label">{def.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}
