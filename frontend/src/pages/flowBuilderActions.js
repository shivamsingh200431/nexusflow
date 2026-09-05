export function deleteNodeFromFlow(nodes = [], edges = [], nodeId) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ),
  };
}

export function addNodeToFlow(nodes = [], node, clearCanvas = null) {
  if (clearCanvas === null) {
    return { action: 'confirm', node };
  }

  if (clearCanvas) {
    return { action: 'clear-and-add', nodes: [node] };
  }

  return { action: 'add', nodes: [...nodes, node] };
}
