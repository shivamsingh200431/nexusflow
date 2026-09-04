import { telemetry$ } from './telemetryStream.js';
import { movingAverage } from './movingAverage.js';
import { checkThreshold } from './threshold.js';
import { toAlert } from './alert.js';

function buildOperator(node, context) {
  const data = node.data || {};

  switch (node.type) {
    case 'movingAverage':
      return movingAverage(data.metric, data.window);
      
    case 'threshold':
      // Store the latest threshold configuration for the following alert node.
      context.lastThreshold = data;
      return checkThreshold(data.operator, data.value);
      
    case 'alert': {
      const t = context.lastThreshold || {};
      return toAlert(node.id, t.metric, t.operator, t.value);
    }
    
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

export function compileFlowGraph(flowGraph) {
  const { nodes = [], edges = [] } = flowGraph;

  const sensorNode = nodes.find((n) => n.type === 'sensor');
  if (!sensorNode) {
    throw new Error('Flow Graph must contain a sensor node');
  }

  const orderedIds = [];
  const visited = new Set();
  let currentId = sensorNode.id;

  // Walk the graph with cycle protection
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    orderedIds.push(currentId);

    const nextEdge = edges.find((e) => e.source === currentId);
    currentId = nextEdge ? nextEdge.target : null;
  }

  const context = {};
  const operators = orderedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((node) => node && node.type !== 'sensor')
    .map((node) => buildOperator(node, context));

  return telemetry$(sensorNode.data?.deviceId).pipe(...operators);
}