import apiClient from '../api/axios';

const restaurantService = {
  getAllRestaurants: async (params) => {
    const response = await apiClient.get('/restaurants', { params });
    return response.data;
  },
  getRestaurantById: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  },
  createRestaurant: async (data) => {
    const response = await apiClient.post('/restaurants', data);
    return response.data;
  },
  updateRestaurant: async (id, data) => {
    const response = await apiClient.put(`/restaurants/${id}`, data);
    return response.data;
  },
  deleteRestaurant: async (id) => {
    const response = await apiClient.delete(`/restaurants/${id}`);
    return response.data;
  },
  getMenuByRestaurantId: async (id) => {
    const response = await apiClient.get(`/menu/restaurant/${id}`);
    return response.data;
  },
  createMenuItem: async (restaurantId, data) => {
    const response = await apiClient.post(`/menu/restaurant/${restaurantId}`, data);
    return response.data;
  },
  getDigitalTwinState: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/digital-twin`);
    return response.data;
  },
  getDigitalTwinForecast: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/forecast`);
    return response.data;
  },
  getDigitalTwinDemand: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/demand`);
    return response.data;
  },
  getDigitalTwinHealth: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/health`);
    return response.data;
  },
  getDigitalTwinRisks: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/risks`);
    return response.data;
  },
  getDigitalTwinInventoryRisk: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/inventory-risk`);
    return response.data;
  },
  getDigitalTwinKitchenState: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/kitchen`);
    return response.data;
  },
  runWhatIfSimulation: async (id, data) => {
    const response = await apiClient.post(`/restaurants/${id}/simulate`, data);
    return response.data;
  },
  getMultiHorizonForecast: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/forecast`);
    return response.data;
  },
  getKitchenCapacityIntelligence: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/capacity`);
    return response.data;
  },
  getInventoryForecastIntelligence: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/inventory-forecast`);
    return response.data;
  },
  getMenuIntelligenceDetails: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/menu`);
    return response.data;
  },
  getPrepPlanDetails: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/prep-plan`);
    return response.data;
  },
  approvePrepPlan: async (id, planId) => {
    const response = await apiClient.post(`/restaurants/${id}/intelligence/prep-plan/${planId}/approve`);
    return response.data;
  },
  editPrepPlan: async (id, planId, value) => {
    const response = await apiClient.post(`/restaurants/${id}/intelligence/prep-plan/${planId}/edit`, { value });
    return response.data;
  },
  rejectPrepPlan: async (id, planId) => {
    const response = await apiClient.post(`/restaurants/${id}/intelligence/prep-plan/${planId}/reject`);
    return response.data;
  },
  runSimulationWhatIf: async (id, data) => {
    const response = await apiClient.post(`/restaurants/${id}/intelligence/simulation`, data);
    return response.data;
  },
  getForecastMonitoring: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/intelligence/monitoring`);
    return response.data;
  },
  getAdminDemandMap: async () => {
    const response = await apiClient.get(`/restaurants/admin/intelligence/map`);
    return response.data;
  }
};

export default restaurantService;
