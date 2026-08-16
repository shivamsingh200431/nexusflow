import NodeCard from './NodeCard'

export default function ThresholdNode({ data, children }) {
  const { metric = 'temperature', operator = '>', value = 80 } = data || {}
  const ops = { '>': '>', '<': '<', '>=': '≥', '<=': '≤', '==': '=' }
  return (
    <NodeCard label="Threshold" tone="threshold">
      {children}
      <div className="nf-node__row">
        <span className="nf-node__label">Metric</span>
        <span className="nf-node__value">{metric}</span>
      </div>
      <div className="nf-node__row nf-node__expr">
        <span className="nf-node__value">{metric}</span>
        <span className="nf-node__op">{ops[operator] || operator}</span>
        <span className="nf-node__value">{value}</span>
        {operator === '>' && <span className="nf-node__unit">°C</span>}
      </div>
    </NodeCard>
  )
}