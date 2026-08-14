import { mockTelemetry$ } from './mockTelemetry.js';
import { movingAverage } from './movingAverage.js';
import { checkThreshold } from './threshold.js';
import { toAlert } from './alert.js';

function buildOperator(node) {
  switch (node.type) {
    case 'movingAverage':
      return movingAverage(node.data.metric, node.data.window);
    case 'threshold':
      return checkThreshold(node.data.operator, node.data.value);
    case 'alert':
      return toAlert(node.id);
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

  // Walk the edges starting at the sensor to get the chain order
  const orderedIds = [sensorNode.id];
  let currentId = sensorNode.id;
  while (true) {
    const nextEdge = edges.find((e) => e.source === currentId);
    if (!nextEdge) break;
    orderedIds.push(nextEdge.target);
    currentId = nextEdge.target;
  }

  // Turn every node except the sensor into an RxJS operator
  const operators = orderedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((node) => node.type !== 'sensor')
    .map(buildOperator);

  return mockTelemetry$.pipe(...operators);
}