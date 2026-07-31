import { useEffect } from 'react';
import { useProfileStore } from '../store/profile.store';

export const useProfile = () => {
  const {
    userProfile,
    patientProfile,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    fetchPatientProfile,
    updatePatientProfile,
    clearError,
  } = useProfileStore();

  useEffect(() => {
    // Load profiles on hook initialization
    const loadProfiles = async () => {
      try {
        await fetchUserProfile();
        await fetchPatientProfile();
      } catch (error) {
        // Errors are handled in the store
        console.error('Failed to load profiles:', error);
      }
    };

    loadProfiles();
  }, [fetchUserProfile, fetchPatientProfile]);

  return {
    userProfile,
    patientProfile,
    isLoading,
    error,
    fetchUserProfile,
    fetchPatientProfile,
    updateUserProfile,
    updatePatientProfile,
    clearError,
  };
};
