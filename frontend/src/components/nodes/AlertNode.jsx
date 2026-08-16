import NodeCard from './NodeCard'

export default function AlertNode({ data }) {
  const { channel = 'mock-sms' } = data || {}
  return (
    <NodeCard label="Alert" tone="alert">
      <div className="nf-node__row">
        <span className="nf-node__label">Channel</span>
        <span className="nf-node__value">{channel}</span>
      </div>
    </NodeCard>
  )
}
