import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '@/services/api/auth';
import { clearTokens, getAccessToken, getRefreshToken } from '@/services/api/client';
import { analytics } from '@/services/analytics';
import type { LoginInput, RegisterInput } from '@/services/api/auth';
import type { User } from '@/types/models';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.getMe();
    setUser(me);
    analytics.identify(me.id, { role: me.role, email: me.email });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (input: LoginInput) => {
    const data = await authApi.login(input);
    setUser(data.user);
    analytics.identify(data.user.id, { role: data.user.role });
    analytics.track('login');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await authApi.register(input);
    setUser(data.user);
    analytics.identify(data.user.id, { role: data.user.role });
    analytics.track('register', { role: data.user.role });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken);
    } else {
      await clearTokens();
    }
    setUser(null);
    analytics.reset();
    analytics.track('logout');
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
