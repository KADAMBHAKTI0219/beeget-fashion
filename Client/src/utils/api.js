import axios from 'axios';
import { refreshToken } from './auth';

// Create an axios instance with custom configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry functionality for network errors
api.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`API Response [${response.config.method.toUpperCase()}] ${response.config.url}:`, response);
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error(`API Error [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    // Handle token refresh for 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('Attempting to refresh token due to 401 error');
        const newToken = await refreshToken();
        if (newToken) {
          console.log('Token refreshed successfully, retrying original request');
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.error('Token refresh returned null');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors with retry logic
    if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') && !originalRequest._networkRetry) {
      // Only retry network errors up to 2 times
      originalRequest._networkRetry = (originalRequest._networkRetry || 0) + 1;
      if (originalRequest._networkRetry <= 2) {
        console.log(`Retrying request due to network error (attempt ${originalRequest._networkRetry})...`);
        // Add exponential backoff
        const backoffDelay = 1000 * originalRequest._networkRetry;
        return new Promise(resolve => {
          setTimeout(() => resolve(api(originalRequest)), backoffDelay);
        });
      }
    }
    
    // Handle specific error status codes
    if (error.response) {
      switch (error.response.status) {
        case 400:
          console.error('Bad Request:', error.response.data);
          break;
        case 403:
          console.error('Forbidden:', error.response.data);
          break;
        case 404:
          console.error('Not Found:', error.response.data);
          break;
        case 500:
          console.error('Server Error:', error.response.data);
          break;
        default:
          console.error(`Error ${error.response.status}:`, error.response.data);
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to add auth token
api.interceptors.request.use(
  config => {
    // Log request details
    console.log(`API Request [${config.method?.toUpperCase()}] ${config.url}:`, {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params
    });
    
    // Get tokens from localStorage
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const { accessToken } = JSON.parse(tokens);
        if (accessToken) {
          console.log('Adding token to request:', `Bearer ${accessToken.substring(0, 10)}...`);
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
          console.warn('No access token found in localStorage');
        }
      } catch (error) {
        console.error('Error parsing tokens in request interceptor:', error);
        // Clear invalid tokens
        localStorage.removeItem('tokens');
      }
    } else {
      console.log('No tokens found in localStorage, proceeding without authentication');
    }
    
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api;