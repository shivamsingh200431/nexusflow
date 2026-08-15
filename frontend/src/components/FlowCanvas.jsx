import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import SensorNode from './nodes/SensorNode'
import MovingAverageNode from './nodes/MovingAverageNode'
import ThresholdNode from './nodes/ThresholdNode'
import AlertNode from './nodes/AlertNode'

const nodeTypes = {
  sensor: SensorNode,
  movingAverage: MovingAverageNode,
  threshold: ThresholdNode,
  alert: AlertNode,
}

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }) {
  return (
    <div className="nf-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a2639" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(n) => (n.type === 'sensor' ? '#34d399' : n.type === 'movingAverage' ? '#38bdf8' : n.type === 'threshold' ? '#fbbf24' : '#f87171')}
          maskColor="rgba(11, 15, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  )
}
