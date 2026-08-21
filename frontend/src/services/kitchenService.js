import apiClient from '../api/axios';

const kitchenService = {
  getKitchenState: async (restaurantId) => {
    const response = await apiClient.get(`/v1/kitchen/${restaurantId}/state`);
    return response.data;
  },

  getStations: async (restaurantId) => {
    const response = await apiClient.get(`/v1/kitchen/${restaurantId}/stations`);
    return response.data;
  },

  adjustCapacity: async (restaurantId, stationId, capacity) => {
    const response = await apiClient.post(`/v1/kitchen/${restaurantId}/capacity`, null, {
      params: { stationId, capacity }
    });
    return response.data;
  },

  toggleStationState: async (restaurantId, stationId) => {
    const response = await apiClient.post(`/v1/kitchen/${restaurantId}/stations/${stationId}/toggle`);
    return response.data;
  },

  getTasks: async (restaurantId) => {
    const response = await apiClient.get(`/v1/kitchen/${restaurantId}/tasks`);
    return response.data;
  },

  completeTask: async (restaurantId, taskId) => {
    const response = await apiClient.post(`/v1/kitchen/${restaurantId}/tasks/${taskId}/complete`);
    return response.data;
  },

  markOrderReady: async (restaurantId, orderId) => {
    const response = await apiClient.post(`/v1/kitchen/${restaurantId}/orders/${orderId}/ready`);
    return response.data;
  }
};

export default kitchenService;
