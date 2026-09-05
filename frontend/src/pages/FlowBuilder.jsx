import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './flowBuilderResponsive.css';
import FlowCanvas from '../components/FlowCanvas';
import NodePalette from '../components/NodePalette';
import NodeConfig from '../components/NodeConfig';
import { saveFlow as saveFlowApi, fetchFlows } from '../rule-engine/flowApi.js';
import { restartRuleEngine } from '../rule-engine/alertService.js';

const VALID_CONNECTIONS = {
  sensor: 'movingAverage',
  movingAverage: 'threshold',
  threshold: 'alert',
};

function isValidConnection(connection, nodes) {
  if (!connection || !connection.source || !connection.target) return false;

  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);

  if (!source || !target) return false;
  return VALID_CONNECTIONS[source.type] === target.type;
}

function FlowBuilder() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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

  const handleNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((node) => {
    setNodes((currentNodes) => {
      if (currentNodes.length > 0) {
        const shouldClear = window.confirm(
          'Do you want to clear the current page before adding this node?'
        );

        if (!shouldClear) return currentNodes;

        setEdges([]);
        setSelectedNode(null);
      }

      return [node];
    });
  }, []);

  const updateNode = (id, newData) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === id ? { ...node, data: newData } : node
      )
    );

    setSelectedNode((currentNode) =>
      currentNode?.id === id
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
      const engineStatus = await restartRuleEngine();

      if (engineStatus?.state === 'error') {
        setSaveStatus('Flow saved, but rule engine failed to restart');
      } else {
        setSaveStatus('Flow saved and rule engine updated');
      }

      await fetchSavedFlows();
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const testCurrentFlow = async () => {
    setIsTesting(true);
    setSaveStatus('');

    try {
      const engineStatus = await restartRuleEngine();
      if (engineStatus?.state === 'error') {
        setSaveStatus('Test run failed to start');
      } else {
        setSaveStatus('Test run started');
      }
    } catch (error) {
      console.error('Test run failed:', error);
      setSaveStatus('Test run failed to start');
    } finally {
      setIsTesting(false);
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

  const isBusy = isSaving || isLoading || isTesting;

  return (
    <div className="nf-flow-editor">
      <header className="nf-flow-editor__header">
        <button
          className="nf-flow-editor__back"
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to dashboard"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="nf-flow-editor__identity">
          <div className="nf-flow-editor__title">Flow1</div>
          <div className="nf-flow-editor__subtitle">Edit your automation flow</div>
        </div>

        <div className="nf-flow-editor__actions">
          <select
            aria-label="Load saved flow"
            className="nf-flow-editor__select"
            defaultValue=""
            disabled={isBusy || savedFlows.length === 0}
            onChange={(event) => {
              const flow = savedFlows.find((item) => item._id === event.target.value);
              if (flow) loadFlow(flow);
              event.target.value = '';
            }}
          >
            <option value="">{savedFlows.length ? 'Load saved flow' : 'No saved flows'}</option>
            {savedFlows.map((flow, index) => (
              <option key={flow._id} value={flow._id}>
                Flow {index + 1}
              </option>
            ))}
          </select>

          <button
            className="nf-btn nf-flow-editor__test"
            type="button"
            onClick={testCurrentFlow}
            disabled={isBusy || nodes.length === 0}
          >
            <span aria-hidden="true">▷</span>
            {isTesting ? 'Testing...' : 'Test Run'}
          </button>

          <button
            className="nf-btn nf-btn--primary nf-flow-editor__save"
            type="button"
            onClick={saveCurrentFlow}
            disabled={isBusy || nodes.length === 0}
          >
            <span aria-hidden="true">▣</span>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="nf-main nf-flow-editor__main">
        <NodePalette onAddNode={addNode} disabled={isBusy} />

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={(connection) => isValidConnection(connection, nodes)}
          onNodeClick={handleNodeClick}
        />

        <NodeConfig node={selectedNode} onUpdate={updateNode} />
      </div>

      {saveStatus && (
        <div className="nf-flow-editor__status" role="status">
          {saveStatus}
        </div>
      )}
    </div>
  );
}

export default FlowBuilder;
