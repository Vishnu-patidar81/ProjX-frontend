/**
 * api.js - Centralised Axios instance with request/response interceptors
 * All API calls go through this instance for consistent auth header injection
 */

import axios from 'axios'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Request interceptor: attach token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('projx_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: global 401 handling (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth and redirect to login
      localStorage.removeItem('projx_token')
      localStorage.removeItem('projx_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
