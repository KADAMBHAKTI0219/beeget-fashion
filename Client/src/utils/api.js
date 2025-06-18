import axios from 'axios';

// Create an axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from localStorage
        const tokens = localStorage.getItem('tokens');
        if (!tokens) {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const { refreshToken } = JSON.parse(tokens);
        
        // Request new access token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens in localStorage
        const updatedTokens = { accessToken, refreshToken: newRefreshToken };
        localStorage.setItem('tokens', JSON.stringify(updatedTokens));
        
        // Update Authorization header and retry original request
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;