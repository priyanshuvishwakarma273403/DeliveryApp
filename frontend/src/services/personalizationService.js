import apiClient from '../api/axios';

const personalizationService = {
  getHomeFeed: async (params) => {
    const response = await apiClient.get('/api/v1/personalization/home', { params });
    return response.data;
  },

  getRecommendations: async (params) => {
    const response = await apiClient.get('/api/v1/personalization/recommendations', { params });
    return response.data;
  },

  getTasteDNA: async () => {
    const response = await apiClient.get('/v1/users/me/taste-dna');
    return response.data;
  },

  savePreferences: async (preferenceData) => {
    const response = await apiClient.post('/v1/users/me/preferences', preferenceData);
    return response.data;
  },

  deleteTasteData: async () => {
    const response = await apiClient.delete('/v1/users/me/taste-data');
    return response.data;
  },

  submitRecommendationFeedback: async (feedbackData) => {
    const response = await apiClient.post('/api/v1/personalization/feedback', feedbackData);
    return response.data;
  }
};

export default personalizationService;
