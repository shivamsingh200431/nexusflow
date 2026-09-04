import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const flowApi = {
  async saveFlow(nodes, edges) {
    const response = await api.post('/flows', { nodes, edges });
    return response.data;
  },

  async getFlows() {
    const response = await api.get('/flows');
    return response.data.flows;
  },

  async getFlowById(flowId) {
    const response = await api.get(`/flows/${flowId}`);
    return response.data.flow;
  },
};

export default flowApi;