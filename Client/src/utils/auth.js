import axios from 'axios';

/**
 * Refreshes the authentication token using the refresh token stored in localStorage
 * @returns {Promise<string|null>} The new access token or null if refresh failed
 */
export const refreshToken = async () => {
  try {
    console.log('Attempting to refresh token...');
    
    // Get stored tokens from localStorage
    const storedTokens = localStorage.getItem('tokens');
    if (!storedTokens) {
      console.error('No tokens found in localStorage');
      return null;
    }
    
    // Parse tokens
    let parsedTokens;
    try {
      parsedTokens = JSON.parse(storedTokens);
    } catch (parseError) {
      console.error('Error parsing tokens:', parseError);
      localStorage.removeItem('tokens');
      return null;
    }
    
    const { refreshToken: currentRefreshToken } = parsedTokens;
    if (!currentRefreshToken) {
      console.error('No refresh token found in stored tokens');
      return null;
    }
    
    // Make API call to refresh token endpoint
    const response = await axios.post(
      import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth/refresh-token` : 'http://localhost:5000/api/auth/refresh-token',
      { refreshToken: currentRefreshToken },
      { 
        // Don't use the intercepted instance for this call to avoid infinite loops
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout for refresh
      }
    );
    
    console.log('Refresh token response:', response);
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // Update tokens in localStorage
    const updatedTokens = { accessToken, refreshToken: newRefreshToken };
    localStorage.setItem('tokens', JSON.stringify(updatedTokens));
    
    console.log('Token refreshed successfully');
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // If refresh fails, clear auth data and return null
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    
    // Redirect to login page if in browser environment
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return null;
  }
};