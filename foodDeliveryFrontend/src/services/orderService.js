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
  }
};

export default orderService;
