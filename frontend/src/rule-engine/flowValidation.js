const NODE_TYPES = ['sensor', 'movingAverage', 'threshold', 'alert'];

const VALID_CONNECTIONS = {
  sensor: 'movingAverage',
  movingAverage: 'threshold',
  threshold: 'alert',
};

const OPERATORS = ['>', '<', '>=', '<=', '=='];
const ALERT_CHANNELS = ['mock-sms', 'mock-email', 'mock-webhook'];

const displayNames = {
  sensor: 'Sensor',
  movingAverage: 'Moving Average',
  threshold: 'Threshold',
  alert: 'Alert',
};

const getNodes = (nodes, type) => nodes.filter((node) => node.type === type);

export function validateFlow({ nodes = [], edges = [] } = {}) {
  const errors = [];

  if (nodes.length === 0) {
    return {
      valid: false,
      errors: ['Add a Sensor, Moving Average, Threshold, and Alert node.'],
    };
  }

  const nodeIds = new Set();
  for (const node of nodes) {
    if (!node.id || nodeIds.has(node.id)) {
      errors.push('Each node must have a unique ID.');
      break;
    }
    nodeIds.add(node.id);
  }

  for (const type of NODE_TYPES) {
    const count = getNodes(nodes, type).length;
    if (count === 0) {
      errors.push(`Flow must contain at least one ${displayNames[type]} node.`);
    }
  }

  const validEdgeTypes = edges.every((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    return source && target && VALID_CONNECTIONS[source.type] === target.type;
  });

  if (!validEdgeTypes) {
    errors.push('Connect nodes in this order: Sensor → Moving Average → Threshold → Alert.');
  }

  const sensor = getNodes(nodes, 'sensor');
  for (const node of sensor) {
    if (!String(node.data?.deviceId ?? '').trim()) {
      errors.push('Sensor: Device ID is required.');
      break;
    }
  }

  const movingAverages = getNodes(nodes, 'movingAverage');
  for (const node of movingAverages) {
    const window = node.data?.window;
    if (!Number.isInteger(window) || window < 1 || window > 100) {
      errors.push('Moving Average: Window must be a whole number from 1 to 100.');
      break;
    }
    if (!String(node.data?.metric ?? '').trim()) {
      errors.push('Moving Average: Metric is required.');
      break;
    }
  }

  const thresholds = getNodes(nodes, 'threshold');
  for (const node of thresholds) {
    if (!String(node.data?.metric ?? '').trim()) {
      errors.push('Threshold: Metric is required.');
      break;
    }
    if (!OPERATORS.includes(node.data?.operator)) {
      errors.push('Threshold: Operator is invalid.');
      break;
    }
    if (!Number.isFinite(node.data?.value)) {
      errors.push('Threshold: Value must be a valid number.');
      break;
    }
  }

  const alerts = getNodes(nodes, 'alert');
  for (const node of alerts) {
    if (!ALERT_CHANNELS.includes(node.data?.channel)) {
      errors.push('Alert: Channel is invalid.');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
