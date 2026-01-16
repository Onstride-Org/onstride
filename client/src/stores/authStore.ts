import { create } from 'zustand';
import { User, Barn } from '../types';
import { authApi, setTokens, clearTokens, getTokens, setCurrentBarn, getCurrentBarn, clearCurrentBarn } from '../services/api';

interface AuthState {
  user: User | null;
  barns: Barn[];
  currentBarnId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phoneNumber: string; barnName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  switchBarn: (barnId: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  barns: [],
  currentBarnId: getCurrentBarn(),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      setTokens(response.accessToken, response.refreshToken);

      // Set primary barn as current
      const primaryBarn = response.barns.find((b: Barn) => b.isPrimary);
      if (primaryBarn) {
        setCurrentBarn(primaryBarn.id);
      }

      set({
        user: response.user,
        barns: response.barns,
        currentBarnId: primaryBarn?.id || response.barns[0]?.id || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      setTokens(response.accessToken, response.refreshToken);

      if (response.user.barnId) {
        setCurrentBarn(response.user.barnId);
      }

      set({
        user: response.user,
        barns: [{ id: response.user.barnId, name: data.barnName || `${data.name}'s Barn`, ownerId: response.user.id, role: 'owner' as const, isPrimary: true }],
        currentBarnId: response.user.barnId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      clearCurrentBarn();
      set({
        user: null,
        barns: [],
        currentBarnId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  loadUser: async () => {
    const { accessToken } = getTokens();
    if (!accessToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await authApi.getMe();

      // Get current barn from storage or use primary
      let currentBarnId = getCurrentBarn();
      if (!currentBarnId && response.barns.length > 0) {
        const primaryBarn = response.barns.find((b: Barn) => b.isPrimary);
        currentBarnId = primaryBarn?.id || response.barns[0]?.id;
        if (currentBarnId) {
          setCurrentBarn(currentBarnId);
        }
      }

      set({
        user: response.user,
        barns: response.barns,
        currentBarnId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearTokens();
      set({
        user: null,
        barns: [],
        currentBarnId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  switchBarn: (barnId: string) => {
    setCurrentBarn(barnId);
    set({ currentBarnId: barnId });
  },

  clearError: () => set({ error: null }),
}));
