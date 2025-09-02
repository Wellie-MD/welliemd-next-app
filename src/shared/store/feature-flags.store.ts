import React from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { apiClient } from '@/shared/api/client';
import { ApiSuccessResponse } from '@/shared/api/types';
import { debugLog, env } from '@/config/env';

// Feature flag types
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userSegments?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  userSegment?: string;
  userId?: string;
  lastUpdated: string;
}

// Feature flag store state
interface FeatureFlagsState {
  flags: Record<string, FeatureFlag>;
  userSegment: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchFeatureFlags: () => Promise<void>;
  isFeatureEnabled: (key: string) => boolean;
  getFeatureFlag: (key: string) => FeatureFlag | undefined;
  getAllFlags: () => FeatureFlag[];
  getEnabledFlags: () => FeatureFlag[];
  setUserSegment: (segment: string) => void;
  refreshFlags: () => Promise<void>;
  clearError: () => void;
}

// Default feature flags (fallback when API is unavailable)
const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  ENABLE_NEW_DASHBOARD: {
    key: 'ENABLE_NEW_DASHBOARD',
    name: 'New Dashboard',
    description: 'Enable the redesigned dashboard interface',
    enabled: false,
  },
  ENABLE_TELEMEDICINE: {
    key: 'ENABLE_TELEMEDICINE',
    name: 'Telemedicine',
    description: 'Enable telemedicine appointments',
    enabled: true,
  },
  ENABLE_PATIENT_MESSAGING: {
    key: 'ENABLE_PATIENT_MESSAGING',
    name: 'Patient Messaging',
    description: 'Enable patient-provider messaging',
    enabled: true,
  },
  ENABLE_APPOINTMENT_REMINDERS: {
    key: 'ENABLE_APPOINTMENT_REMINDERS',
    name: 'Appointment Reminders',
    description: 'Enable automated appointment reminders',
    enabled: true,
  },
  ENABLE_PRESCRIPTION_REFILLS: {
    key: 'ENABLE_PRESCRIPTION_REFILLS',
    name: 'Prescription Refills',
    description: 'Enable online prescription refill requests',
    enabled: true,
  },
  ENABLE_LAB_RESULTS_PORTAL: {
    key: 'ENABLE_LAB_RESULTS_PORTAL',
    name: 'Lab Results Portal',
    description: 'Enable lab results viewing portal',
    enabled: true,
  },
  ENABLE_PROVIDER_ANALYTICS: {
    key: 'ENABLE_PROVIDER_ANALYTICS',
    name: 'Provider Analytics',
    description: 'Enable analytics dashboard for providers',
    enabled: false,
    userSegments: ['provider', 'admin'],
  },
  ENABLE_ADMIN_PANEL: {
    key: 'ENABLE_ADMIN_PANEL',
    name: 'Admin Panel',
    description: 'Enable administrative panel',
    enabled: true,
    userSegments: ['admin'],
  },
  ENABLE_MOBILE_APP_PROMOTION: {
    key: 'ENABLE_MOBILE_APP_PROMOTION',
    name: 'Mobile App Promotion',
    description: 'Show mobile app download promotion',
    enabled: false,
    rolloutPercentage: 25,
  },
  ENABLE_DARK_MODE: {
    key: 'ENABLE_DARK_MODE',
    name: 'Dark Mode',
    description: 'Enable dark mode theme option',
    enabled: true,
  },
};

// Mock API service for feature flags
const featureFlagsAPI = {
  async fetchFlags(): Promise<FeatureFlagConfig> {
    // In a real app, this would be an API call
    if (env.VITE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        flags: DEFAULT_FLAGS,
        lastUpdated: new Date().toISOString(),
      };
    }

    const response = await apiClient.get<ApiSuccessResponse<FeatureFlagConfig>>('/feature-flags');
    return response.data.data;
  },
};

// Create feature flags store
export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        flags: DEFAULT_FLAGS,
        userSegment: null,
        isLoading: false,
        error: null,
        lastUpdated: null,

        fetchFeatureFlags: async () => {
          if (!env.VITE_ENABLE_FEATURE_FLAGS) {
            debugLog('Feature flags disabled, using defaults');
            return;
          }

          debugLog('Fetching feature flags');
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const config = await featureFlagsAPI.fetchFlags();
            
            set((state) => {
              state.flags = config.flags;
              state.lastUpdated = config.lastUpdated;
              state.isLoading = false;
              state.error = null;
            });

            debugLog('Feature flags loaded:', Object.keys(config.flags));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch feature flags';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
              // Keep existing flags on error
            });

            debugLog('Failed to fetch feature flags, using cached/default flags:', error);
          }
        },

        isFeatureEnabled: (key: string) => {
          const { flags, userSegment } = get();
          const flag = flags[key];
          
          if (!flag) {
            debugLog(`Feature flag not found: ${key}`);
            return false;
          }

          if (!flag.enabled) {
            return false;
          }

          // Check user segment restrictions
          if (flag.userSegments && flag.userSegments.length > 0) {
            if (!userSegment || !flag.userSegments.includes(userSegment)) {
              return false;
            }
          }

          // Check rollout percentage
          if (flag.rolloutPercentage !== undefined) {
            // Simple hash-based rollout (in production, use proper user ID hashing)
            const hash = Math.abs(hashString(key + (userSegment || 'anonymous'))) % 100;
            return hash < flag.rolloutPercentage;
          }

          // Check date restrictions
          const now = new Date();
          if (flag.startDate && new Date(flag.startDate) > now) {
            return false;
          }
          if (flag.endDate && new Date(flag.endDate) < now) {
            return false;
          }

          return true;
        },

        getFeatureFlag: (key: string) => {
          return get().flags[key];
        },

        getAllFlags: () => {
          return Object.values(get().flags);
        },

        getEnabledFlags: () => {
          const { flags, isFeatureEnabled } = get();
          return Object.values(flags).filter(flag => isFeatureEnabled(flag.key));
        },

        setUserSegment: (segment: string) => {
          set((state) => {
            state.userSegment = segment;
          });
        },

        refreshFlags: async () => {
          await get().fetchFeatureFlags();
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },
      })),
      {
        name: 'feature-flags-store',
        partialize: (state) => ({
          flags: state.flags,
          userSegment: state.userSegment,
          lastUpdated: state.lastUpdated,
        }),
        version: 1,
      }
    ),
    {
      name: 'feature-flags-store',
    }
  )
);

// Simple string hash function for rollout percentage
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

// Feature flags selectors
export const featureFlagsSelectors = {
  flags: () => useFeatureFlagsStore((state) => state.flags),
  isLoading: () => useFeatureFlagsStore((state) => state.isLoading),
  error: () => useFeatureFlagsStore((state) => state.error),
  isFeatureEnabled: (key: string) => useFeatureFlagsStore((state) => state.isFeatureEnabled(key)),
  getFeatureFlag: (key: string) => useFeatureFlagsStore((state) => state.getFeatureFlag(key)),
  getAllFlags: () => useFeatureFlagsStore((state) => state.getAllFlags()),
  getEnabledFlags: () => useFeatureFlagsStore((state) => state.getEnabledFlags()),
};

// Hook for using feature flags in components
export function useFeatureFlag(key: string) {
  const isEnabled = useFeatureFlagsStore((state) => state.isFeatureEnabled(key));
  const flag = useFeatureFlagsStore((state) => state.getFeatureFlag(key));
  
  return {
    isEnabled,
    flag,
  };
}

// Component for conditionally rendering based on feature flags
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  inverse?: boolean;
}

export function FeatureFlag({ flag, children, fallback = null, inverse = false }: FeatureFlagProps) {
  const { isEnabled } = useFeatureFlag(flag);
  const shouldRender = inverse ? !isEnabled : isEnabled;
  
  return shouldRender ? (children as React.ReactElement) : (fallback as React.ReactElement);
}

// Higher-order component for feature flag wrapping
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: string,
  fallback?: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => {
    const { isEnabled } = useFeatureFlag(flagKey);
    
    if (!isEnabled) {
      return fallback ? React.createElement(fallback, props) : null;
    }
    
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
