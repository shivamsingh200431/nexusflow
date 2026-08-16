import NodeCard from './NodeCard'

export default function AlertNode({ data, children }) {
  const { channel = 'mock-sms' } = data || {}
  return (
    <NodeCard label="Alert" tone="alert">
      {children}
      <div className="nf-node__row">
        <span className="nf-node__label">Channel</span>
        <span className="nf-node__value">{channel}</span>
      </div>
    </NodeCard>
  )
}
