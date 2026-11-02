import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { useAuthStore } from '../store/useStore';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage and validate token with backend
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = authService.getToken();
        if (!storedToken) {
          setLoading(false);
          return;
        }

        // We have a token, let's validate it by fetching the current user profile
        setToken(storedToken);
        const me = await authService.getMe();
        setUser(me);
      } catch (error) {
        console.warn('Token validation failed, logging out', error);
        authService.clearAuth();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sync with Zustand store
  useEffect(() => {
    useAuthStore.getState().syncAuthUser(user);
  }, [user]);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authService.login(data);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authService.register(data);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
