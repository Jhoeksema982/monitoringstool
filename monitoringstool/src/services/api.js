import { getAccessToken } from './auth';

// Use the backend server API instead of Supabase REST API directly
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  async get(endpoint) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GET error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async post(endpoint, data) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async patch(endpoint, data) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PATCH error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async delete(endpoint) {
    const userToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DELETE error ${response.status}: ${text}`);
    }

    return response.json();
  }
}

const apiService = new ApiService();

/* -------------------------------------------------------
   QUESTIONS API
------------------------------------------------------- */
export const questionsApi = {
  // GET all questions
  getAll: () => apiService.get('/questions'),

  // CREATE a question
  create: (question) => apiService.post('/questions', question),

  // UPDATE by UUID
  update: (uuid, updates) =>
    apiService.patch(`/questions/${uuid}`, updates),

  // DELETE by UUID
  delete: (uuid) =>
    apiService.delete(`/questions/${uuid}`),

  // REORDER
  reorder: (order) =>
    apiService.post('/questions/reorder', { order }),
};

/* -------------------------------------------------------
   RESPONSES API
------------------------------------------------------- */
export const responsesApi = {
  // Submit survey response
  submit: (payload) => apiService.post('/responses', payload),

  // List responses
  list: ({ page = 1, limit = 10 } = {}) => {
    const offset = (page - 1) * limit;
    return apiService.get(`/responses?page=${page}&limit=${limit}`);
  },

  // Stats endpoint
  stats: () => apiService.get('/responses/stats'),
};

export default apiService;
