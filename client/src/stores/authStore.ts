import { create } from 'zustand';
import { User, Barn } from '../types';
import { authApi, setTokens, clearTokens, getTokens, setCurrentBarn, getCurrentBarn, clearCurrentBarn } from '../services/api';

interface TwoFactorState {
  required: boolean;
  userId: string | null;
  method: string | null;
  phoneLastFour: string | null;
}

interface AuthState {
  user: User | null;
  barns: Barn[];
  currentBarnId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  twoFactor: TwoFactorState;

  // Actions
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean }>;
  verify2FA: (code: string) => Promise<void>;
  resend2FA: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; phoneNumber: string; barnName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  switchBarn: (barnId: string) => void;
  clearError: () => void;
  clearTwoFactor: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  barns: [],
  currentBarnId: getCurrentBarn(),
  isAuthenticated: false,
  isLoading: true,
  error: null,
  twoFactor: {
    required: false,
    userId: null,
    method: null,
    phoneLastFour: null,
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);

      // Check if 2FA is required
      if (response.requiresTwoFactor) {
        set({
          twoFactor: {
            required: true,
            userId: response.userId,
            method: response.twoFactorMethod,
            phoneLastFour: response.phoneLastFour,
          },
          isLoading: false,
        });
        return { requiresTwoFactor: true };
      }

      // No 2FA - complete login
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
        twoFactor: { required: false, userId: null, method: null, phoneLastFour: null },
      });

      return {};
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  verify2FA: async (code: string) => {
    const { twoFactor } = get();
    if (!twoFactor.userId) {
      throw new Error('No 2FA session');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verify2FA(twoFactor.userId, code);
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
        twoFactor: { required: false, userId: null, method: null, phoneLastFour: null },
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Invalid verification code',
        isLoading: false,
      });
      throw error;
    }
  },

  resend2FA: async () => {
    const { twoFactor } = get();
    if (!twoFactor.userId) {
      throw new Error('No 2FA session');
    }

    set({ isLoading: true, error: null });
    try {
      await authApi.resend2FA(twoFactor.userId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to resend code',
        isLoading: false,
      });
      throw error;
    }
  },

  clearTwoFactor: () => {
    set({
      twoFactor: { required: false, userId: null, method: null, phoneLastFour: null },
      error: null,
    });
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
