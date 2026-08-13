import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [];
const initialEdges = [];

function FlowBuilder() {
  return (
    <div style={{ width: '100%', height: '90vh' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default FlowBuilder;