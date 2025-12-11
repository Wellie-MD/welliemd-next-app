/**
 * useStoreSettings Hook
 * 
 * React hook for managing store settings state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { storeSettingsApi } from '@/api/storeSettingsApi';
import type { StoreSettings, StoreSettingsUpdate } from '@/types/storeSettings';
import { useToast } from '@/hooks/use-toast';

interface UseStoreSettingsReturn {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (updates: Partial<StoreSettingsUpdate>) => Promise<StoreSettings | null>;
  isUpdating: boolean;
}

export const useStoreSettings = (): UseStoreSettingsReturn => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeSettingsApi.getCurrent();
      setSettings(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch store settings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<StoreSettingsUpdate>): Promise<StoreSettings | null> => {
    if (!settings) {
      toast({
        title: 'Error',
        description: 'No settings loaded',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsUpdating(true);
      setError(null);
      const updated = await storeSettingsApi.partialUpdate(settings.id, updates);
      setSettings(updated);
      
      toast({
        title: 'Success',
        description: 'Store settings updated successfully',
      });
      
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update store settings';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [settings, toast]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
    isUpdating,
  };
};

export default useStoreSettings;
