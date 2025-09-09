import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  role: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'authState';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      try {
        return JSON.parse(storedState);
      } catch (error) {
        console.error('Error parsing stored auth state:', error);
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  });

  const [loading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    // Validate token periodically
    const validateInterval = setInterval(async () => {
      if (authState.token) {
        const isValid = await validateToken();
        if (!isValid) {
          logout();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(validateInterval);
  }, [authState.token]);

  const validateToken = async (): Promise<boolean> => {
    if (!authState.token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'x-auth-token': authState.token
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const login = (token: string, user: User) => {
    setAuthState({
      user,
      token,
      isAuthenticated: true
    });
  };

  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false
    });
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      validateToken,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 