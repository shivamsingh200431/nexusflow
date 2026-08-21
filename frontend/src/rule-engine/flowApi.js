const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchLatestFlow() {
  const response = await fetch(`${API_BASE}/flows`);
  if (!response.ok) {
    throw new Error(`Failed to fetch flows: ${response.status}`);
  }
  const data = await response.json();

  if (!data.flows || data.flows.length === 0) {
    throw new Error('No flows found in the database');
  }

  // Flows are sorted newest-first by the backend, so [0] is the latest
  const latest = data.flows[0];
  return { nodes: latest.nodes, edges: latest.edges };
}