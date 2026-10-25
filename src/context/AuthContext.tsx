'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export type UserRole = 'GUEST' | 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
  isGuest?: boolean;
  doctorProfile?: any;
  patientProfile?: any;
  adminProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  quickLogin: (role: 'SUPER_ADMIN' | 'DOCTOR' | 'PATIENT') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('bmd_token');
    const storedUser = localStorage.getItem('bmd_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify with server in background
        api
          .get('/auth/me')
          .then((res) => {
            if (res.data.success && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem('bmd_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // keep stored or logout if invalid
          });
      } catch (e) {
        console.error('Error restoring session:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('bmd_token', newToken);
    localStorage.setItem('bmd_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bmd_token');
    localStorage.removeItem('bmd_user');
  };

  const quickLogin = async (role: 'SUPER_ADMIN' | 'DOCTOR' | 'PATIENT') => {
    setIsLoading(true);
    try {
      let identifier = 'superadmin@bookmydoctor.bd';
      let password = 'Admin@123456';

      if (role === 'DOCTOR') {
        identifier = 'dr.tanvir@bookmydoctor.bd';
        password = 'Password@123';
      } else if (role === 'PATIENT') {
        identifier = 'rahim@gmail.com';
        password = 'Password@123';
      }

      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      console.error('Quick login error:', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        quickLogin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

