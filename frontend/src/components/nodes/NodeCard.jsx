import { Handle, Position } from '@xyflow/react'

/**
 * Shared visual shell for all custom nodes: colored header bar,
 * card body, and top/bottom connection handles.
 */
export default function NodeCard({ label, tone, children }) {
  return (
    <div className={`nf-node nf-node--${tone}`}>
      <Handle type="target" position={Position.Top} className="nf-handle" />
      <div className="nf-node__header">{label}</div>
      <div className="nf-node__body">{children}</div>
      <Handle type="source" position={Position.Bottom} className="nf-handle" />
    </div>
  )
}
