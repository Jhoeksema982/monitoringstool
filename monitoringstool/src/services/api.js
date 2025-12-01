import { getAccessToken } from './auth';

const API_BASE_URL = 'https://umlsadvlxhrlushowmef.supabase.co';

class ApiService {
  async get(endpoint) {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post(endpoint, data) {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async put(endpoint, data) {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async delete(endpoint) {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

const apiService = new ApiService();

// Questions API methods
export const questionsApi = {
  getAll: () => apiService.get('/questions'),
  create: (question) => apiService.post('/questions', question),
  update: (uuid, updates) => apiService.put(`/questions/${uuid}`, updates),
  reorder: (order) => apiService.post('/questions/reorder', { order }),
  delete: (id) => apiService.delete(`/questions/${id}`),
};

// Responses API methods
export const responsesApi = {
  submit: (payload) => apiService.post('/responses', payload),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/responses${qs ? `?${qs}` : ''}`);
  },
  stats: () => apiService.get('/responses/stats'),
};

export default apiService;
