import apiClient from '../api/axios';

const personalizationService = {
  getHomeFeed: async (params) => {
    const response = await apiClient.get('/api/v1/recommendations/home', { params });
    return response.data;
  },

  getRecommendations: async (params) => {
    const response = await apiClient.get('/api/v1/recommendations', { params });
    return response.data;
  },

  getTasteDNA: async () => {
    const response = await apiClient.get('/api/v1/profile/taste');
    return response.data;
  },

  savePreferences: async (preferenceData) => {
    // Map selectedDiets back to dietaryPreferences for backend compatibility
    const dataToSend = {
      preferredCuisines: preferenceData.preferredCuisines || [],
      dislikedCuisines: preferenceData.dislikedCuisines || [],
      favoriteIngredients: preferenceData.favoriteIngredients || [],
      avoidedIngredients: preferenceData.excludedIngredients || [],
      spicePreference: preferenceData.spicePreference || 'MEDIUM',
      sweetnessPreference: preferenceData.sweetnessPreference || 'MEDIUM',
      dietaryPreferences: preferenceData.dietaryPreferences || preferenceData.selectedDiets || [],
      budgetLimit: preferenceData.budgetLimit || 500,
      allergies: preferenceData.allergies || [],
      discoveryMode: preferenceData.discoveryMode || 'BALANCED'
    };
    const response = await apiClient.put('/api/v1/profile/taste', dataToSend);
    return response.data;
  },

  deleteTasteData: async () => {
    const response = await apiClient.delete('/v1/users/me/taste-data');
    return response.data;
  },

  submitRecommendationFeedback: async (feedbackData) => {
    const response = await apiClient.post('/api/v1/recommendations/feedback', feedbackData);
    return response.data;
  },

  getReorders: async () => {
    const response = await apiClient.get('/api/v1/recommendations/reorder');
    return response.data;
  },

  getTrending: async (params) => {
    const response = await apiClient.get('/api/v1/recommendations/trending', { params });
    return response.data;
  },

  getMealBuilder: async (params) => {
    const response = await apiClient.get('/api/v1/recommendations/meal', { params });
    return response.data;
  },

  parseCraving: async (query) => {
    const response = await apiClient.post('/api/v1/discovery/query', { query });
    return response.data;
  },

  getCartRecommendations: async (cartItemIds) => {
    const response = await apiClient.post('/api/v1/cart/recommendations', { cartItemIds });
    return response.data;
  }
};

export default personalizationService;
