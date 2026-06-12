import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'britcore_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for 401 unauthorized events from the API interceptor.
  // By clearing user state here, React Router's ProtectedRoute will
  // redirect to /login without a hard page reload (no refresh loop).
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { user: userData } = response.data;

      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // 1. Call backend to clear the HttpOnly cookie
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      // 2. Clean up local state — ProtectedRoute will redirect to /login via React Router
      setUser(null);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('britcore_token');
      // NOTE: Do NOT use window.location.href here — it causes a hard reload loop.
      // The ProtectedRoute component will detect user === null and redirect automatically.
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
