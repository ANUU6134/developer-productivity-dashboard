import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/login', { email, password });
          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          const userResponse = await api.get('/api/auth/me');
          set({ user: userResponse.data, isAuthenticated: true });
          toast.success('Login successful!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/register', userData);
          console.log('Registration response:', response.data);
          toast.success('Registration successful! Please login.');
          return response.data;
        } catch (error: any) {
          console.error('Registration error details:', error.response?.data);
          const errorMessage = error.response?.data?.detail || 'Registration failed';
          toast.error(errorMessage);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      fetchUser: async () => {
        try {
          const response = await api.get('/api/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUser: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          const response = await api.put('/api/auth/profile', data);
          set({ user: response.data });
          toast.success('Profile updated successfully');
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Update failed';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);