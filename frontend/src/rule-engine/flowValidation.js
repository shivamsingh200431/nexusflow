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

const getNode = (nodes, type) => nodes.find((node) => node.type === type);

export function validateFlow({ nodes = [], edges = [] } = {}) {
  const errors = [];

  if (nodes.length === 0) {
    return {
      valid: false,
      errors: ['Add a Sensor, Moving Average, Threshold, and Alert node.'],
    };
  }

  for (const type of NODE_TYPES) {
    const count = nodes.filter((node) => node.type === type).length;
    if (count !== 1) {
      errors.push(
        count === 0
          ? `Flow must contain exactly one ${displayNames[type]} node.`
          : `Flow must contain exactly one ${displayNames[type]} node (found ${count}).`
      );
    }
  }

  if (nodes.length === NODE_TYPES.length && errors.length === 0) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const validChain = edges.length === 3 && edges.every((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      return source && target && VALID_CONNECTIONS[source.type] === target.type;
    });

    if (!validChain) {
      errors.push('Connect nodes in this order: Sensor → Moving Average → Threshold → Alert.');
    }
  }

  const sensor = getNode(nodes, 'sensor');
  if (sensor && !String(sensor.data?.deviceId ?? '').trim()) {
    errors.push('Sensor: Device ID is required.');
  }

  const movingAverage = getNode(nodes, 'movingAverage');
  if (movingAverage) {
    const window = movingAverage.data?.window;
    if (!Number.isInteger(window) || window < 1 || window > 100) {
      errors.push('Moving Average: Window must be a whole number from 1 to 100.');
    }
    if (!String(movingAverage.data?.metric ?? '').trim()) {
      errors.push('Moving Average: Metric is required.');
    }
  }

  const threshold = getNode(nodes, 'threshold');
  if (threshold) {
    if (!String(threshold.data?.metric ?? '').trim()) {
      errors.push('Threshold: Metric is required.');
    }
    if (!OPERATORS.includes(threshold.data?.operator)) {
      errors.push('Threshold: Operator is invalid.');
    }
    if (!Number.isFinite(threshold.data?.value)) {
      errors.push('Threshold: Value must be a valid number.');
    }
  }

  const alert = getNode(nodes, 'alert');
  if (alert && !ALERT_CHANNELS.includes(alert.data?.channel)) {
    errors.push('Alert: Channel is invalid.');
  }

  return { valid: errors.length === 0, errors };
}
