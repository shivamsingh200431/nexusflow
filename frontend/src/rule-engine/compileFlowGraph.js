import { mockTelemetry$ } from './mockTelemetry.js';
import { movingAverage } from './movingAverage.js';
import { checkThreshold } from './threshold.js';
import { toAlert } from './alert.js';

// NOTE: V1 supports a single linear chain only (sensor -> ... -> alert).
// Branching (multiple paths from one node) is not yet supported.
// buildOperator/compileFlowGraph are structured so branching can be
// added later without a full rewrite - each node is handled independently
// and chained in traversal order.

function buildOperator(node, context) {
  switch (node.type) {
    case 'movingAverage':
      return movingAverage(node.data.metric, node.data.window);
    case 'threshold':
      // remember this node's config so a later alert node can use it
      context.lastThreshold = node.data;
      return checkThreshold(node.data.operator, node.data.value);
    case 'alert': {
      const t = context.lastThreshold || {};
      return toAlert(node.id, t.metric, t.operator, t.value);
    }
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

export function compileFlowGraph(flowGraph) {
  const { nodes, edges } = flowGraph;

  const sensorNode = nodes.find((n) => n.type === 'sensor');
  if (!sensorNode) {
    throw new Error('Flow Graph must contain a sensor node');
  }

  // Walk the edges starting at the sensor to get the chain order.
  // V1 limitation: assumes exactly one outgoing edge per node (linear chain).
  const orderedIds = [sensorNode.id];
  let currentId = sensorNode.id;
  while (true) {
    const nextEdge = edges.find((e) => e.source === currentId);
    if (!nextEdge) break;
    orderedIds.push(nextEdge.target);
    currentId = nextEdge.target;
  }

  const context = {};
  const operators = orderedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((node) => node.type !== 'sensor')
    .map((node) => buildOperator(node, context));

  return mockTelemetry$.pipe(...operators);
}