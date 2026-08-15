import NodeCard from './NodeCard'

export default function MovingAverageNode({ data }) {
  const { operation = 'moving_average', window = 5 } = data || {}
  const opLabel = operation === 'moving_average' ? 'Moving Average' : operation
  return (
    <NodeCard label="Moving Average" tone="movingAverage">
      <div className="nf-node__row">
        <span className="nf-node__label">Operation</span>
        <span className="nf-node__value">{opLabel}</span>
      </div>
      <div className="nf-node__row">
        <span className="nf-node__label">Window</span>
        <span className="nf-node__value">{window}</span>
      </div>
    </NodeCard>
  )
}