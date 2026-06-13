import apiClient from '../api/axios';

export const deliveryService = {
  getMyDeliveries: async () => {
    const response = await apiClient.get('/delivery/partner/my');
    return response.data;
  },

  getAvailableOrders: async () => {
    const response = await apiClient.get('/delivery/partner/available');
    return response.data;
  },

  acceptOrder: async (orderId) => {
    const response = await apiClient.post(`/delivery/partner/order/${orderId}/accept`);
    return response.data;
  },

  handleAction: async (orderId, action) => {
    const response = await apiClient.post(`/delivery/partner/order/${orderId}/action`, { action });
    return response.data;
  },

  markPickedUp: async (orderId) => {
    const response = await apiClient.post(`/delivery/partner/order/${orderId}/pickup`);
    return response.data;
  },

  markDelivered: async (orderId) => {
    const response = await apiClient.post(`/delivery/partner/order/${orderId}/deliver`);
    return response.data;
  },
  
  updateLocation: async (orderId, latitude, longitude) => {
    const response = await apiClient.post(`/delivery/partner/order/${orderId}/location`, { latitude, longitude });
    return response.data;
  }
};

export default deliveryService;
