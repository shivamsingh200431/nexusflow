import NodeCard from './NodeCard'

export default function SensorNode({ data }) {
  const { deviceId = 'DEVICE-01', metric = 'temperature' } = data || {}
  return (
    <NodeCard label="Sensor" tone="sensor">
      <div className="nf-node__row">
        <span className="nf-node__label">Device ID</span>
        <span className="nf-node__value">{deviceId}</span>
      </div>
      <div className="nf-node__row">
        <span className="nf-node__label">Metric</span>
        <span className="nf-node__value">{metric}</span>
      </div>
    </NodeCard>
  )
}
