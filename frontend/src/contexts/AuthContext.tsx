import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/negotiation';
import { apiService } from '../services/api.service';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<User>;
  reviewerLogin: (role: 'professor' | 'student') => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage and fetch user
    const loadUser = async () => {
      apiService.loadToken();
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to load user:', error);
          apiService.clearToken();
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const { token: newToken, user: userData } = await apiService.login(username, password);
    localStorage.setItem('loginOrigin', '/login');
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const reviewerLogin = async (role: 'professor' | 'student'): Promise<User> => {
    const { token: newToken, user: userData } = await apiService.reviewerLogin(role);
    localStorage.setItem('loginOrigin', '/reviewer');
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, reviewerLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
