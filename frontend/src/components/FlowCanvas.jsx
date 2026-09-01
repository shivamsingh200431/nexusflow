import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import SensorNode from './nodes/SensorNode'
import MovingAverageNode from './nodes/MovingAverageNode'
import ThresholdNode from './nodes/ThresholdNode'
import AlertNode from './nodes/AlertNode'

function SensorNodeWrapper({ data, ...rest }) {
  return (
    <SensorNode data={data ?? {}} {...rest}>
      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </SensorNode>
  )
}

function MovingAverageNodeWrapper({ data, ...rest }) {
  return (
    <MovingAverageNode data={data ?? {}} {...rest}>
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </MovingAverageNode>
  )
}

function ThresholdNodeWrapper({ data, ...rest }) {
  return (
    <ThresholdNode data={data ?? {}} {...rest}>
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </ThresholdNode>
  )
}

function AlertNodeWrapper({ data, ...rest }) {
  return (
    <AlertNode data={data ?? {}} {...rest}>
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />
    </AlertNode>
  )
}

const nodeTypes = {
  sensor: SensorNodeWrapper,
  movingAverage: MovingAverageNodeWrapper,
  threshold: ThresholdNodeWrapper,
  alert: AlertNodeWrapper,
}

function normalizeNodes(nodes = []) {
  return nodes
    .filter((node) => node && node.id && node.type)
    .map((node, index) => ({
      ...node,

      id: String(node.id),

      type: node.type,

      position: {
        x:
          typeof node.position?.x === 'number'
            ? node.position.x
            : 200,

        y:
          typeof node.position?.y === 'number'
            ? node.position.y
            : 80 + index * 180,
      },

      data: node.data ?? {},
    }))
}

function normalizeEdges(edges = []) {
  return edges
    .filter(
      (edge) =>
        edge &&
        edge.source &&
        edge.target
    )
    .map((edge, index) => ({
      ...edge,

      id:
        edge.id ??
        `edge-${index + 1}`,

      source: String(edge.source),
      target: String(edge.target),
    }))
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
}) {
  const safeNodes = useMemo(
    () => normalizeNodes(nodes),
    [nodes]
  )

  const safeEdges = useMemo(
    () => normalizeEdges(edges),
    [edges]
  )

  const handleConnect = useCallback(
    (params) => {
      onConnect(params)
    },
    [onConnect]
  )

  return (
    <div className="nf-canvas">
      <ReactFlow
        nodes={safeNodes}
        edges={safeEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          color="#1a2639"
          gap={16}
        />

        <Controls />

        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'sensor') {
              return '#34d399'
            }

            if (node.type === 'movingAverage') {
              return '#38bdf8'
            }

            if (node.type === 'threshold') {
              return '#fbbf24'
            }

            if (node.type === 'alert') {
              return '#f87171'
            }

            return '#64748b'
          }}
          maskColor="rgba(11, 15, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  )
}