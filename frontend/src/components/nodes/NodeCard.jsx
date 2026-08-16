/**
 * Shared visual shell for all custom nodes: colored header bar,
 * card body. Connection handles are rendered by wrapper components in FlowCanvas.
 */
export default function NodeCard({ label, tone, children }) {
  return (
    <div className={`nf-node nf-node--${tone}`}>
      <div className="nf-node__header">{label}</div>
      <div className="nf-node__body">{children}</div>
    </div>
  )
}
