import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on an auth page
      const authPaths = ['/login', '/signup', '/forgot-password']
      const isAuthPage = authPaths.some(p => window.location.pathname.startsWith(p))

      if (!isAuthPage) {
        localStorage.removeItem('access_token')
        // Use replace to avoid adding to browser history
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
}

// Students API
export const studentsApi = {
  list: (params?: { skip?: number; limit?: number; search?: string; sort_by?: string; sort_order?: string }) =>
    api.get('/students', { params }),

  get: (usn: string) => api.get(`/students/${usn}`),

  create: (data: StudentCreateData) => api.post('/students', data),

  update: (usn: string, data: Partial<StudentCreateData>) => api.put(`/students/${usn}`, data),

  updateMarks: (data: { usn: string; sem1?: number; sem2?: number; sem3?: number; sem4?: number; sem5?: number }) =>
    api.patch('/students/marks', data),

  delete: (usn: string) => api.delete(`/students/${usn}`),

  export: () => api.get('/students/export/csv'),

  count: () => api.get('/students/count'),
}

// Predictions API
export const predictionsApi = {
  single: (usn: string) => api.post('/predictions/single', { usn }),

  batch: (usns: string[]) => api.post('/predictions/batch', { usns }),

  insights: (usn: string) => api.get(`/predictions/${usn}/insights`),

  retrain: () => api.post('/predictions/retrain'),
}

// Analytics API
export const analyticsApi = {
  overview: () => api.get('/analytics'),

  distribution: () => api.get('/analytics/distribution'),

  semesterAverages: () => api.get('/analytics/semester-averages'),

  topPerformers: (limit?: number) => api.get('/analytics/top-performers', { params: { limit } }),

  needsAttention: (threshold?: number) => api.get('/analytics/needs-attention', { params: { threshold } }),

  mostImproved: (limit?: number) => api.get('/analytics/most-improved', { params: { limit } }),
}

// Dashboard API
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),

  notifications: () => api.get('/dashboard/notifications'),

  notes: () => api.get('/dashboard/notes'),

  updateNote: (noteId: string, content: string) =>
    api.put('/dashboard/notes', { note_id: noteId, content }),

  recentStudents: (limit?: number) => api.get('/dashboard/recent-students', { params: { limit } }),

  performanceChart: (usn: string) => api.get(`/dashboard/performance-chart/${usn}`),

  systemHealth: () => api.get('/dashboard/system-health'),
}

// Types
export interface StudentCreateData {
  usn: string
  name: string
  sem1: number
  sem2: number
  sem3: number
  sem4: number
  sem5: number
  sem6: number
}
