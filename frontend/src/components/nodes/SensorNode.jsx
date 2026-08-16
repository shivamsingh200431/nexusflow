import NodeCard from './NodeCard'

export default function SensorNode({ data, children }) {
  const { deviceId = 'DEVICE-01' } = data || {}
  return (
    <NodeCard label="Sensor" tone="sensor">
      {children}
      <div className="nf-node__row">
        <span className="nf-node__label">Device ID</span>
        <span className="nf-node__value">{deviceId}</span>
      </div>
    </NodeCard>
  )
}
