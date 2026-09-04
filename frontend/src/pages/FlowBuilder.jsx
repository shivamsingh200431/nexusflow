import { useState, useCallback, useEffect } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowCanvas from '../components/FlowCanvas';
import NodePalette from '../components/NodePalette';
import NodeConfig from '../components/NodeConfig';
import flowApi from '../api/flowApi';

// Helper to generate unique IDs
let nodeIdCounter = 0;
const generateNodeId = (type) => `${type}-${Date.now()}-${++nodeIdCounter}`;

const getDefaultData = (type) => {
  switch (type) {
    case 'sensor': return { deviceId: 'turbine-001' };
    case 'movingAverage': return { metric: 'temperature', window: 5 };
    case 'threshold': return { metric: 'temperature', operator: '>', value: 80 };
    case 'alert': return { channel: 'mock-sms' };
    default: return {};
  }
};

// V1 linear pipeline connection rules:
//   Sensor -> Moving Average -> Threshold -> Alert
// Only these transitions are allowed.
const VALID_CONNECTIONS = {
  sensor: 'movingAverage',
  movingAverage: 'threshold',
  threshold: 'alert',
};

function isValidConnection(connection, nodes) {
  if (!connection || !connection.source || !connection.target) {
    return false;
  }
  const source = nodes.find((n) => n.id === connection.source);
  const target = nodes.find((n) => n.id === connection.target);
  if (!source || !target) {
    return false;
  }
  // Reject self-loops and any connection that violates the linear pipeline.
  return VALID_CONNECTIONS[source.type] === target.type;
}

function FlowBuilder() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedFlows, setSavedFlows] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => {
      if (isValidConnection(connection, nodes)) {
        return addEdge(connection, eds);
      }
      return eds;
    });
  }, [nodes]);

  const addNode = (type) => {
    const newNode = {
      id: generateNodeId(type),
      type,
      position: { x: 250, y: 100 + nodes.length * 100 },
      data: getDefaultData(type),
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNode = (id, newNode) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? newNode : n)));
    setSelectedNode(newNode);
  };

  const saveFlow = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      // PRESERVE POSITION: do not strip it.
      await flowApi.saveFlow(nodes, edges);
      setSaveStatus('Flow saved');
      await fetchSavedFlows();
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFlow = async (flowId) => {
    setIsLoading(true);
    try {
      const flow = await flowApi.getFlowById(flowId);
      // RESTORE POSITION: flow.nodes already has it from the database/API
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setSaveStatus(`Loaded flow: ${flowId}`);
    } catch (error) {
      console.error('Load failed:', error);
      setSaveStatus('Failed to load flow');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedFlows = async () => {
    try {
      const flows = await flowApi.getFlows();
      setSavedFlows(flows);
    } catch (error) {
      console.error('Fetch flows failed:', error);
    }
  };

  useEffect(() => {
    fetchSavedFlows();
  }, []);

  return (
    <div style={{ display: 'flex', height: '90vh', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#fafafa', display: 'flex', gap: 12, alignItems: 'center' }}>
        <NodePalette onAddNode={addNode} disabled={isSaving || isLoading} />
        <div style={{ flex: 1 }} />
        <button onClick={saveFlow} style={{ padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', borderRadius: 4, cursor: 'pointer' }} disabled={isSaving || nodes.length === 0}>
          {isSaving ? 'Saving...' : 'Save Flow'}
        </button>
        {saveStatus && <span style={{ fontSize: 13, fontWeight: 500 }}>{saveStatus}</span>}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={(connection) => isValidConnection(connection, nodes)}
          onNodeClick={setSelectedNode}
        />
        <NodeConfig node={selectedNode} onUpdateNode={updateNode} nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

export default FlowBuilder;