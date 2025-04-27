import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Token refresh interval (60 minutes)
const REFRESH_INTERVAL = 60 * 60 * 1000;

// Function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

// Function to refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return null;

    const response = await fetch('http://localhost:5001/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': currentToken
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Custom hook to handle authentication state
export const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        // Clear auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      // Try to refresh token
      const newToken = await refreshToken();
      if (!newToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    // Check token immediately
    checkToken();

    // Set up periodic token refresh
    const intervalId = setInterval(checkToken, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  return null;
};

// Function to handle API responses and token expiration
export const handleApiResponse = async (response: Response): Promise<any> => {
  if (response.status === 401) {
    // Token expired or invalid
    const newToken = await refreshToken();
    if (!newToken) {
      // Redirect to login if refresh failed
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
    // Retry the original request with new token
    const retryResponse = await fetch(response.url, {
      ...response,
      headers: {
        ...response.headers,
        'x-auth-token': newToken
      }
    });
    return retryResponse.json();
  }
  return response.json();
}; 