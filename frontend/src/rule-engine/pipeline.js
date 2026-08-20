import { compileFlowGraph } from './compileFlowGraph.js';
import { fetchLatestFlow } from './flowApi.js';

export async function getAlertsStream() {
  const flowGraph = await fetchLatestFlow();
  return compileFlowGraph(flowGraph);
}