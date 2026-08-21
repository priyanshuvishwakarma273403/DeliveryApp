import apiClient from '../api/axios';

const orchestratorService = {
  getActiveOrders: async () => {
    const response = await apiClient.get('/orchestrator/orders/active');
    return response.data;
  },
  evaluatePolicy: async (data) => {
    const response = await apiClient.post('/orchestrator/policy/evaluate', data);
    return response.data;
  },
  triggerManualRecovery: async (data) => {
    const response = await apiClient.post('/orchestrator/recovery/action', data);
    return response.data;
  },
  getMetrics: async () => {
    const response = await apiClient.get('/orchestrator/metrics');
    return response.data;
  }
};

export default orchestratorService;
