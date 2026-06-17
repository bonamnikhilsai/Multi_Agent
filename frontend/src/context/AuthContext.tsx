// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('arena-token'));
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('arena-token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.data.success) {
          setUser(res.data.user);
          setToken(savedToken);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('arena-token');
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email: email.trim(), password });
      if (!res.data.success) throw new Error(res.data.message);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('arena-token', res.data.token);
    } catch (err: any) {
      // axios throws on 4xx/5xx — extract server message from response
      const serverMsg = err.response?.data?.message;
      throw new Error(serverMsg || err.message || 'Login failed.');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (!res.data.success) throw new Error(res.data.message);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('arena-token', res.data.token);
    } catch (err: any) {
      // axios throws on 4xx/5xx — extract server message from response
      const serverMsg = err.response?.data?.message;
      throw new Error(serverMsg || err.message || 'Registration failed.');
    }
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
