import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper to generate unique IDs without using Date.now() during render
let nodeIdCounter = 0;
const generateNodeId = (type) => `${type}-${Date.now()}-${++nodeIdCounter}`;

// Custom node components
const SensorNode = ({ data }) => (
  <div style={{ padding: 10, background: '#e3f2fd', borderRadius: 6, border: '1px solid #1976d2', minWidth: 150 }}>
    <strong>Sensor</strong>
    <div style={{ fontSize: 12, marginTop: 4 }}>Device: {data.deviceId || 'Not configured'}</div>
  </div>
);

const MovingAverageNode = ({ data }) => (
  <div style={{ padding: 10, background: '#fff3e0', borderRadius: 6, border: '1px solid #f57c00', minWidth: 150 }}>
    <strong>Moving Average</strong>
    <div style={{ fontSize: 12, marginTop: 4 }}>Metric: {data.metric || 'temperature'}</div>
    <div style={{ fontSize: 12 }}>Window: {data.window || 5}</div>
  </div>
);

const ThresholdNode = ({ data }) => (
  <div style={{ padding: 10, background: '#ffebee', borderRadius: 6, border: '1px solid #d32f2f', minWidth: 150 }}>
    <strong>Threshold</strong>
    <div style={{ fontSize: 12, marginTop: 4 }}>Metric: {data.metric || 'temperature'}</div>
    <div style={{ fontSize: 12 }}>Operator: {data.operator || '>'} {data.value || 80}</div>
  </div>
);

const AlertNode = ({ data }) => (
  <div style={{ padding: 10, background: '#fce4ec', borderRadius: 6, border: '1px solid #c2185b', minWidth: 150 }}>
    <strong>Alert</strong>
    <div style={{ fontSize: 12, marginTop: 4 }}>Channel: {data.channel || 'mock-sms'}</div>
  </div>
);

const nodeTypes = {
  sensor: SensorNode,
  movingAverage: MovingAverageNode,
  threshold: ThresholdNode,
  alert: AlertNode,
};

// Default empty graph
const initialNodes = [];
const initialEdges = [];

function FlowBuilder() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedFlows, setSavedFlows] = useState([]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => nds.map((node) => {
      const change = changes.find((c) => c.id === node.id);
      if (change && change.type === 'position') {
        return { ...node, position: change.position };
      }
      if (change && change.type === 'remove') {
        return null;
      }
      return node;
    }).filter(Boolean));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => eds.map((edge) => {
      const change = changes.find((c) => c.id === edge.id);
      if (change && change.type === 'remove') {
        return null;
      }
      return edge;
    }).filter(Boolean));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const addNode = (type) => {
    const newNode = {
      id: generateNodeId(type),
      type,
      position: { x: 250, y: 100 + nodes.length * 100 },
      data: getDefaultData(type),
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultData = (type) => {
    switch (type) {
      case 'sensor':
        return { deviceId: 'turbine-001' };
      case 'movingAverage':
        return { metric: 'temperature', window: 5 };
      case 'threshold':
        return { metric: 'temperature', operator: '>', value: 80 };
      case 'alert':
        return { channel: 'mock-sms' };
      default:
        return {};
    }
  };

  const saveFlow = async () => {
    if (nodes.length === 0) {
      setSaveStatus('Failed to save flow: No nodes in flow');
      return;
    }

    setIsSaving(true);
    setSaveStatus('');

    try {
      // Strip React Flow specific fields (like position) to match contract
      const contractNodes = nodes.map(({ id, type, data }) => ({ id, type, data }));
      await axios.post(`${API_BASE_URL}/flows`, { nodes: contractNodes, edges });
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
      const response = await axios.get(`${API_BASE_URL}/flows/${flowId}`);
      const flow = response.data.flow;
      if (flow) {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setSaveStatus(`Loaded flow: ${flowId}`);
      }
    } catch (error) {
      console.error('Load failed:', error);
      setSaveStatus('Failed to load flow');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedFlows = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/flows`);
      setSavedFlows(response.data.flows);
    } catch (error) {
      console.error('Fetch flows failed:', error);
    }
  };

  const handleNewFlow = () => {
    setNodes([]);
    setEdges([]);
    setSaveStatus('');
  };

  // Fetch saved flows on mount
  useEffect(() => {
    fetchSavedFlows();
  }, []);

  return (
    <div style={{ display: 'flex', height: '90vh', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        background: '#fafafa',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addNode('sensor')} style={buttonStyle}>Add Sensor</button>
          <button onClick={() => addNode('movingAverage')} style={buttonStyle}>Add Moving Average</button>
          <button onClick={() => addNode('threshold')} style={buttonStyle}>Add Threshold</button>
          <button onClick={() => addNode('alert')} style={buttonStyle}>Add Alert</button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleNewFlow} style={buttonStyle} disabled={isSaving || isLoading}>New Flow</button>
          <button onClick={saveFlow} style={{ ...buttonStyle, backgroundColor: '#2e7d32', color: 'white' }} disabled={isSaving || nodes.length === 0}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {saveStatus && (
            <span style={{
              color: saveStatus.startsWith('Flow saved') ? '#2e7d32' : '#d32f2f',
              fontWeight: 500,
              fontSize: 14
            }}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* Flow Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Saved Flows Panel */}
      {savedFlows.length > 0 && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '12px 16px',
          background: '#fafafa',
          maxHeight: 200,
          overflowY: 'auto'
        }}>
          <strong>Saved Flows:</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {savedFlows.map((flow) => (
              <button
                key={flow._id}
                onClick={() => loadFlow(flow._id)}
                style={{ ...buttonStyle, fontSize: 12, padding: '4px 8px' }}
                disabled={isLoading}
              >
                {flow._id.slice(-8)} ({flow.nodes.length} nodes)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: '8px 16px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'all 0.2s',
};

export default FlowBuilder;