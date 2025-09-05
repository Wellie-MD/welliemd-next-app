import { create } from 'zustand';
import { profileService } from '../services/profile.service';
import type { 
  UserProfile, 
  PatientProfile, 
  UpdateUserRequest, 
  UpdatePatientRequest 
} from '../types/profile.types';

interface ProfileState {
  // State
  userProfile: UserProfile | null;
  patientProfile: PatientProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: UpdateUserRequest) => Promise<void>;
  fetchPatientProfile: () => Promise<void>;
  updatePatientProfile: (data: UpdatePatientRequest) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  userProfile: null,
  patientProfile: null,
  isLoading: false,
  error: null,

  // Actions
  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const userProfile = await profileService.getUserProfile();
      set({ userProfile, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch user profile';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateUserProfile: async (data: UpdateUserRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await profileService.updateUserProfile(data);
      set({ userProfile: updatedProfile, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update user profile';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchPatientProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const patientProfile = await profileService.getPatientProfile();
      set({ patientProfile, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch patient profile';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updatePatientProfile: async (data: UpdatePatientRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { patientProfile } = get();
      let updatedProfile: PatientProfile;
      
      if (patientProfile) {
        updatedProfile = await profileService.updatePatientProfile(data);
      } else {
        updatedProfile = await profileService.createPatientProfile(data);
      }
      
      set({ patientProfile: updatedProfile, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update patient profile';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    userProfile: null,
    patientProfile: null,
    isLoading: false,
    error: null,
  }),
}));
