export function deleteNodeFromFlow(nodes = [], edges = [], nodeId) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ),
  };
}

export function addNodeToFlow(nodes = [], node, clearCanvas = null) {
  if (nodes.length === 0 || clearCanvas === false) {
    return { action: 'add', nodes: [...nodes, node] };
  }

  if (clearCanvas === null) {
    return { action: 'confirm', node };
  }

  return { action: 'clear-and-add', nodes: [node] };
}
