export function deleteNodeFromFlow(nodes = [], edges = [], nodeId) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ),
  };
}

export function addNodeToFlow(nodes = [], node, confirmFn = window.confirm) {
  if (nodes.length === 0) {
    return [node];
  }

  const shouldClear = confirmFn(
    'This canvas already contains nodes. Clear the current canvas before adding this node?'
  );

  return shouldClear ? [node] : null;
}
