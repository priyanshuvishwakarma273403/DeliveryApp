import apiClient from '../api/axios';

const orderService = {
  getAllOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await apiClient.patch(`/orders/${id}/status?status=${status}`);
    return response.data;
  },
  getRestaurantOrders: async (restaurantId) => {
    const response = await apiClient.get(`/orders/restaurant/${restaurantId}`);
    return response.data;
  },
  placeOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await apiClient.get('/orders/my');
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  getOrderTwin: async (id) => {
    const response = await apiClient.get(`/v1/orders/${id}/twin`);
    return response.data;
  },
  getOrderHealth: async (id) => {
    const response = await apiClient.get(`/v1/orders/${id}/health`);
    return response.data;
  },
  getOrderTimeline: async (id, customerOnly = true) => {
    const response = await apiClient.get(`/v1/orders/${id}/timeline?customerOnly=${customerOnly}`);
    return response.data;
  },
  getOrderRisks: async (id) => {
    const response = await apiClient.get(`/v1/orders/${id}/risks`);
    return response.data;
  },
  getOrderRecoveryActions: async (id) => {
    const response = await apiClient.get(`/v1/orders/${id}/recovery`);
    return response.data;
  },
  submitRecoveryDecision: async (id, actionId, decision) => {
    const response = await apiClient.post(`/v1/orders/${id}/recovery/decision`, { actionId, decision });
    return response.data;
  },
  getAlternatives: async (id, menuItemId) => {
    const response = await apiClient.get(`/v1/orders/${id}/alternatives?menuItemId=${menuItemId}`);
    return response.data;
  },
  getRecoverySettings: async () => {
    const response = await apiClient.get('/v1/orders/recovery/settings');
    return response.data;
  },
  updateRecoverySettings: async (settings) => {
    const response = await apiClient.post('/v1/orders/recovery/settings', settings);
    return response.data;
  }
};

export default orderService;
