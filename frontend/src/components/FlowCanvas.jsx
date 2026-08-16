import { useCallback } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import SensorNode from './nodes/SensorNode'
import MovingAverageNode from './nodes/MovingAverageNode'
import ThresholdNode from './nodes/ThresholdNode'
import AlertNode from './nodes/AlertNode'

// V1 compiler supports only the linear chain: Sensor -> Moving Average -> Threshold -> Alert


function SensorNodeWrapper({ data, ...rest }) {
  return (
    <SensorNode data={data} {...rest}>
      <Handle type="source" position={Position.Right} id="source" />
    </SensorNode>
  )
}

function MovingAverageNodeWrapper({ data, ...rest }) {
  return (
    <MovingAverageNode data={data} {...rest}>
      <Handle type="target" position={Position.Left} id="target" />
      <Handle type="source" position={Position.Right} id="source" />
    </MovingAverageNode>
  )
}

function ThresholdNodeWrapper({ data, ...rest }) {
  return (
    <ThresholdNode data={data} {...rest}>
      <Handle type="target" position={Position.Left} id="target" />
      <Handle type="source" position={Position.Right} id="source" />
    </ThresholdNode>
  )
}

function AlertNodeWrapper({ data, ...rest }) {
  return (
    <AlertNode data={data} {...rest}>
      <Handle type="target" position={Position.Left} id="target" />
    </AlertNode>
  )
}

const nodeTypesWithHandles = {
  sensor: SensorNodeWrapper,
  movingAverage: MovingAverageNodeWrapper,
  threshold: ThresholdNodeWrapper,
  alert: AlertNodeWrapper,
}

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }) {
  const handleConnect = useCallback(
    (params) => {
      onConnect(params)
  },
  [onConnect]
)

  return (
    <div className="nf-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypesWithHandles}
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
