import { create } from 'zustand';
import { User, Barn } from '../types';
import { authApi, setTokens, clearTokens, getTokens, setCurrentBarn, getCurrentBarn, clearCurrentBarn } from '../services/api';

interface TwoFactorState {
  required: boolean;
  userId: string | null;
  method: string | null;
  phoneLastFour: string | null;
}

interface BarnRole {
  role: string;
}

interface AuthState {
  user: User | null;
  barns: Barn[];
  currentBarnId: string | null;
  currentBarnRole: BarnRole | null;
  showOnboarding: boolean;
  showPaymentPrompt: boolean;
  showSubscriptionTutorial: boolean;
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
  setUser: (user: User) => void;
  setBarns: (barns: Barn[]) => void;
  setCurrentBarnId: (barnId: string) => void;
  setShowOnboarding: (show: boolean) => void;
  setShowPaymentPrompt: (show: boolean) => void;
  setShowSubscriptionTutorial: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  barns: [],
  currentBarnId: getCurrentBarn(),
  currentBarnRole: null,
  showOnboarding: false,
  showPaymentPrompt: false,
  showSubscriptionTutorial: false,
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

      const currentBarn = primaryBarn || response.barns[0];
      set({
        user: response.user,
        barns: response.barns,
        currentBarnId: currentBarn?.id || null,
        currentBarnRole: currentBarn?.role ? { role: currentBarn.role } : null,
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

      const currentBarn = primaryBarn || response.barns[0];
      set({
        user: response.user,
        barns: response.barns,
        currentBarnId: currentBarn?.id || null,
        currentBarnRole: currentBarn?.role ? { role: currentBarn.role } : null,
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
        currentBarnRole: { role: 'owner' },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      // Only set error, don't change any other state to avoid re-render issues
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({
        error: errorMessage,
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
        currentBarnRole: null,
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

      // Get role for current barn
      const currentBarn = response.barns.find((b: Barn) => b.id === currentBarnId);
      const currentBarnRole = currentBarn?.role ? { role: currentBarn.role } : null;

      set({
        user: response.user,
        barns: response.barns,
        currentBarnId,
        currentBarnRole,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearTokens();
      set({
        user: null,
        barns: [],
        currentBarnId: null,
        currentBarnRole: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  switchBarn: (barnId: string) => {
    setCurrentBarn(barnId);
    const { barns } = get();
    const barn = barns.find(b => b.id === barnId);
    set({
      currentBarnId: barnId,
      currentBarnRole: barn?.role ? { role: barn.role } : null
    });
  },

  clearError: () => set({ error: null }),

  // Direct setters for external login flows (invitation acceptance, email verification)
  setUser: (user: User) => set({ user, isAuthenticated: true, isLoading: false }),
  setBarns: (barns: Barn[]) => {
    const currentBarnId = get().currentBarnId;
    const currentBarn = barns.find(b => b.id === currentBarnId);
    set({
      barns,
      currentBarnRole: currentBarn?.role ? { role: currentBarn.role } : null
    });
  },
  setCurrentBarnId: (barnId: string) => {
    const { barns } = get();
    const barn = barns.find(b => b.id === barnId);
    set({
      currentBarnId: barnId,
      currentBarnRole: barn?.role ? { role: barn.role } : null
    });
  },
  setShowOnboarding: (show: boolean) => set({ showOnboarding: show }),
  setShowPaymentPrompt: (show: boolean) => set({ showPaymentPrompt: show }),
  setShowSubscriptionTutorial: (show: boolean) => set({ showSubscriptionTutorial: show }),
}));
