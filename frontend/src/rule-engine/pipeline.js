import { compileFlowGraph } from './compileFlowGraph.js';
import { exampleFlowGraph } from './exampleFlowGraph.js';

export const alerts$ = compileFlowGraph(exampleFlowGraph);