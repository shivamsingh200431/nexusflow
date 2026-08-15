import NodeCard from './NodeCard'

export default function AlertNode({ data }) {
  const { message = 'High Temperature', severity = 'critical' } = data || {}
  return (
    <NodeCard label="Alert" tone="alert">
      <div className="nf-node__row">
        <span className="nf-node__label">Message</span>
        <span className="nf-node__value">{message}</span>
      </div>
      <div className="nf-node__row">
        <span className="nf-node__label">Severity</span>
        <span className={`nf-node__badge nf-node__badge--${severity}`}>{severity}</span>
      </div>
    </NodeCard>
  )
}
