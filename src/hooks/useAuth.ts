// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/shared/api';
import type { EmployeePublic, AuthResult } from '@/shared/types';

interface AuthState {
  user: EmployeePublic | null;
  role: 'employee' | 'admin' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false
  });

  const checkAuth = useCallback(async () => {
    try {
      const user = await api.auth.me();
      setAuthState({
        user,
        role: user.role || 'employee',
        isLoading: false,
        isAuthenticated: true
      });
    } catch {
      setAuthState({
        user: null,
        role: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const auth = await api.auth.login({ username, password });
    setAuthState({
      user: auth.user,
      role: auth.role,
      isLoading: false,
      isAuthenticated: true
    });
    return auth;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setAuthState({
      user: null,
      role: null,
      isLoading: false,
      isAuthenticated: false
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.auth.me();
      setAuthState(prev => ({ ...prev, user, isAuthenticated: true }));
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    login,
    logout,
    refreshUser,
    checkAuth
  };
}