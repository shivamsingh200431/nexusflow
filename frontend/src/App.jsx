import { NavLink, Route, Routes } from "react-router-dom";
import { useState, useCallback } from 'react'
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react'
import FlowCanvas from './components/FlowCanvas'
import NodePalette from './components/NodePalette'
import NodeConfig from './components/NodeConfig'
import Dashboard from './pages/Dashboard'
import Devices from './pages/devices'
import './App.css'
import { AlertsProvider } from './alerts/AlertsProvider.jsx'

const STORAGE_KEY = 'nexusflow-graph'

const INITIAL_NODES = [
  {
    id: 'sensor-1',
    type: 'sensor',
    position: { x: 200, y: 80 },
    data: { deviceId: 'TURBINE-01' },
  },
  {
    id: 'movingAverage-1',
    type: 'movingAverage',
    position: { x: 200, y: 260 },
    data: { metric: 'temperature', window: 5 },
  },
  {
    id: 'threshold-1',
    type: 'threshold',
    position: { x: 200, y: 440 },
    data: { metric: 'temperature', operator: '>', value: 80 },
  },
  {
    id: 'alert-1',
    type: 'alert',
    position: { x: 200, y: 620 },
    data: { channel: 'mock-sms' },
  },
]

const INITIAL_EDGES = [
  { id: 'edge-1', source: 'sensor-1', target: 'movingAverage-1' },
  { id: 'edge-2', source: 'movingAverage-1', target: 'threshold-1' },
  { id: 'edge-3', source: 'threshold-1', target: 'alert-1' },
]

function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES)
  const [selectedId, setSelectedId] = useState(null)

  const selectedNode = nodes.find((n) => n.id === selectedId) || null

  const handleAddNode = useCallback((node) => {
    setNodes((prev) => [...prev, node])
    setSelectedId(node.id)
  }, [setNodes])

  const handleUpdateNode = useCallback((id, data) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data } : n)))
  }, [setNodes])

  const handleConnect = useCallback((params) => {
    setEdges((prev) => addEdge(params, prev))
  }, [setEdges])

  const serialize = useCallback(
    () => ({
      nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
      edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    }),
    [nodes, edges]
  )

  const handleSave = useCallback(async () => {
  try {
    const flow = serialize()

    console.log("SAVING FLOW:", flow)

    const response = await fetch("http://localhost:5000/api/flows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flow),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    console.log("FLOW SAVED:", result)

    alert("Flow saved successfully")
  } catch (error) {
    console.error("Save flow failed:", error)
    alert("Failed to save flow")
  }
}, [serialize])

  const handleLoad = useCallback(async () => {
  console.log("LOAD BUTTON CLICKED");

  try {
    const response = await fetch("http://localhost:5000/api/flows");

    console.log("API RESPONSE:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log("FLOWS RECEIVED:", result);

    if (!result.flows?.length) {
      throw new Error("No flows found");
    }

   const saved = result.flows[0]
   console.log("LATEST FLOW SELECTED:", saved)

    console.log("LOADING FLOW:", saved);

    const loadedNodes = (saved.nodes || []).map((node, index) => ({
      id: node.id,
      type: node.type,
      position: node.position || {
        x: 200,
        y: 80 + index * 180,
      },
      data: node.data || {},
    }));

    const loadedEdges = (saved.edges || []).map((edge, index) => ({
      id: edge.id || `edge-${index + 1}`,
      source: edge.source,
      target: edge.target,
    }));

    console.log("LOADED NODES:", loadedNodes);
    console.log("LOADED EDGES:", loadedEdges);

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setSelectedId(null);

    console.log("FLOW LOADED SUCCESSFULLY");
  } catch (error) {
    console.error("LOAD FAILED:", error);
  }
}, [setNodes, setEdges]);

const handleClear = useCallback(() => {
  setNodes([]);
  setEdges([]);
  setSelectedId(null);
}, [setNodes, setEdges]);

  return (
    <div className="nf-app">
      <header className="nf-navbar">
        <div className="nf-navbar__brand">
          <span className="nf-navbar__title">NexusFlow</span>
          <span className="nf-navbar__subtitle">Visual Workflow Builder</span>
        </div>
        <div className="nf-navbar__actions">
          <button className="nf-btn nf-btn--primary" onClick={handleSave}>Save</button>
          <button className="nf-btn" onClick={handleLoad}>Load</button>
          <button className="nf-btn nf-btn--danger" onClick={handleClear}>Clear</button>
        </div>
      </header>

      <main className="nf-main">
        <NodePalette onAddNode={handleAddNode} />
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
        />
        <NodeConfig node={selectedNode} onUpdate={handleUpdateNode} />
      </main>
    </div>
  )
}

function App() {
  
  return (
    <AlertsProvider>
    <>
      <nav className="app-toplevel-nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/flow-builder">Flow Builder</NavLink>
        <NavLink to="/devices">Devices</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/flow-builder" element={<FlowBuilder />} />
        <Route path="/devices" element={<Devices />} />
      </Routes>
    </>
    </AlertsProvider>
  )
}

export default App