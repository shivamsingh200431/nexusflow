import NodeCard from './NodeCard'

export default function MovingAverageNode({ data }) {
  const { metric = 'temperature', window = 5 } = data || {}
  return (
    <NodeCard label="Moving Average" tone="movingAverage">
      <div className="nf-node__row">
        <span className="nf-node__label">Metric</span>
        <span className="nf-node__value">{metric}</span>
      </div>
      <div className="nf-node__row">
        <span className="nf-node__label">Window</span>
        <span className="nf-node__value">{window}</span>
      </div>
    </NodeCard>
  )
}