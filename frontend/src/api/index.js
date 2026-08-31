import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res.data,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err.response?.data || err)
  }
)

export const dashboardApi = {
  getSummary: (date) => api.get('/dashboard/summary', { params: { date } }),
  getTrend: (days = 7, module) => api.get('/dashboard/trend', { params: { days, module } }),
  getActivity: (limit = 20) => api.get('/dashboard/activity', { params: { limit } }),
}

export const eamApi = {
  getModule: (module, params) => api.get(`/eam/${module}`, { params }),
  updateTask: (taskId, data) => api.put(`/eam/tasks/${taskId}`, data),
  createTask: (data) => api.post('/eam/tasks', data),
}

export const dataSourceApi = {
  list: () => api.get('/datasource'),
  getActive: () => api.get('/datasource/active'),
  create: (data) => api.post('/datasource', data),
  update: (id, data) => api.put(`/datasource/${id}`, data),
  activate: (id) => api.post(`/datasource/${id}/activate`),
  testConnection: (data) => api.post('/datasource/test-connection', data),
  executeQuery: (data) => api.post('/datasource/execute-query', data),
  delete: (id) => api.delete(`/datasource/${id}`),
}

export const manualEntryApi = {
  submitProgress: (data) => api.post('/manual-entry/progress', data),
  batchImport: (records) => api.post('/manual-entry/batch', { records }),
}

export const aiApi = {
  getTemplate: () => api.get('/ai/template'),
  generate: (data) => api.post('/ai/generate', data),
  getRequirements: () => api.get('/ai/requirements'),
  getRequirement: (id) => api.get(`/ai/requirements/${id}`),
}

export default api
