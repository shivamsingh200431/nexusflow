import { useState, useCallback, useEffect } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowCanvas from '../components/FlowCanvas';
import NodePalette from '../components/NodePalette';
import NodeConfig from '../components/NodeConfig';
import { saveFlow as saveFlowApi, fetchFlows } from '../rule-engine/flowApi.js';

// V1 linear pipeline connection rules:
//   Sensor -> Moving Average -> Threshold -> Alert
const VALID_CONNECTIONS = {
  sensor: 'movingAverage',
  movingAverage: 'threshold',
  threshold: 'alert',
};

function isValidConnection(connection, nodes) {
  if (!connection || !connection.source || !connection.target) {
    return false;
  }

  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);

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
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((currentEdges) => {
      if (isValidConnection(connection, nodes)) {
        return addEdge(connection, currentEdges);
      }
      return currentEdges;
    });
  }, [nodes]);

  const addNode = useCallback((node) => {
    setNodes((currentNodes) => {
      if (currentNodes.length > 0) {
        const shouldClear = window.confirm(
          'Do you want to clear the current page before adding this node?'
        );

        if (!shouldClear) {
          return currentNodes;
        }

        setEdges([]);
        setSelectedNode(null);
      }

      return [node];
    });
  }, []);

  const updateNode = (id, newData) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === id
          ? { ...node, data: newData }
          : node
      )
    );

    setSelectedNode((currentNode) =>
      currentNode
        ? { ...currentNode, data: newData }
        : currentNode
    );
  };

  const fetchSavedFlows = useCallback(async () => {
    try {
      const data = await fetchFlows();
      setSavedFlows(data.flows || []);
    } catch (error) {
      console.error('Fetch flows failed:', error);
      setSaveStatus('Failed to load saved flows');
    }
  }, []);

  const saveCurrentFlow = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      await saveFlowApi({ nodes, edges });
      setSaveStatus('Flow saved');
      await fetchSavedFlows();
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFlow = useCallback((flow) => {
    setIsLoading(true);

    try {
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setSelectedNode(null);
      setSaveStatus(`Loaded flow: ${flow._id || 'saved flow'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedFlows();
  }, [fetchSavedFlows]);

  return (
    <div style={{ display: 'flex', height: '90vh', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          background: '#fafafa',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <NodePalette
          onAddNode={addNode}
          disabled={isSaving || isLoading}
        />

        <div style={{ flex: 1 }} />

        <select
          aria-label="Load saved flow"
          defaultValue=""
          disabled={isSaving || isLoading || savedFlows.length === 0}
          onChange={(event) => {
            const flow = savedFlows.find((item) => item._id === event.target.value);
            if (flow) {
              loadFlow(flow);
            }
            event.target.value = '';
          }}
          style={{ padding: '8px 12px', borderRadius: 4 }}
        >
          <option value="">{savedFlows.length ? 'Load saved flow' : 'No saved flows'}</option>
          {savedFlows.map((flow, index) => (
            <option key={flow._id} value={flow._id}>
              Flow {index + 1}
            </option>
          ))}
        </select>

        <button
          onClick={saveCurrentFlow}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2e7d32',
            color: 'white',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          disabled={isSaving || isLoading || nodes.length === 0}
        >
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
        <NodeConfig
          node={selectedNode}
          onUpdate={updateNode}
        />
      </div>
    </div>
  );
}

export default FlowBuilder;
