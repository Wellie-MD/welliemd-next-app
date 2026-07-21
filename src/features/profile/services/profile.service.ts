import { apiClient } from '@/shared/api/client';
import { debugLog } from '@/config/env';
import { API_ENDPOINTS } from '@/config/constants';
import {
  UserProfile,
  PatientProfile,
  UpdateUserRequest,
  UpdatePatientRequest,
  PasswordUpdateRequest,
  UserProfileSchema,
  PatientProfileSchema,
} from '../types/profile.types';
import { authService } from '@/features/auth/services/auth.service';
import type { ChangePasswordRequest } from '@/features/auth/types/auth.types';

/**
 * Profile service handling all profile-related API calls
 * This service provides type-safe methods with Zod validation
 */
export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    debugLog('ProfileService.getUserProfile');

    const response = await apiClient.get(API_ENDPOINTS.USERS.ME);
    const validatedData = UserProfileSchema.parse(response.data);

    return validatedData;
  }

  /**
   * Update user profile (basic information)
   */
  async updateUserProfile(data: UpdateUserRequest): Promise<UserProfile> {
    debugLog('ProfileService.updateUserProfile:', data);

    const response = await apiClient.patch(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
    });

    const validatedData = UserProfileSchema.parse(response.data);
    return validatedData;
  }

  /**
   * Update password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    debugLog('ProfileService.changePassword');
    return await authService.changePassword(passwordData);
  }

  /**
   * Get patient profile
   */
  async getPatientProfile(): Promise<PatientProfile | null> {
    debugLog('ProfileService.getPatientProfile');

    try {
      const response = await apiClient.get(API_ENDPOINTS.MEDICAL.PATIENTS.MY_PROFILE);
      const validatedData = PatientProfileSchema.parse(response.data);

      return validatedData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        debugLog('Patient profile not found - user may not have completed medical profile yet');
        return null;
      }
      throw error;
    }
  }

  /**
   * Create patient profile
   */
  async createPatientProfile(data: UpdatePatientRequest): Promise<PatientProfile> {
    debugLog('ProfileService.createPatientProfile:', data);

    const response = await apiClient.post(
      API_ENDPOINTS.MEDICAL.PATIENTS.CREATE_PROFILE,
      {
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        address: data.address,
        address_line_2: data.address_line_2 || '',
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        sex: data.sex,
        allergies: data.allergies || '',
        medical_conditions: data.medical_conditions || '',
        self_reported_meds: data.self_reported_meds || '',
      }
    );

    const validatedData = PatientProfileSchema.parse(response.data);
    return validatedData;
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(data: UpdatePatientRequest): Promise<PatientProfile> {
    debugLog('ProfileService.updatePatientProfile:', data);

    const response = await apiClient.put(
      API_ENDPOINTS.MEDICAL.PATIENTS.UPDATE_PROFILE,
      {
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        address: data.address,
        address_line_2: data.address_line_2 || '',
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        sex: data.sex,
        allergies: data.allergies || '',
        medical_conditions: data.medical_conditions || '',
        self_reported_meds: data.self_reported_meds || '',
        vitals_source_priority: data.vitals_source_priority,
      }
    );

    const validatedData = PatientProfileSchema.parse(response.data);
    return validatedData;
  }

  /**
   * Update only the vitals source priority using a partial update (PATCH)
   */
  async updateVitalsPriority(priorityList: string[]): Promise<PatientProfile> {
    debugLog('ProfileService.updateVitalsPriority:', priorityList);
    const response = await apiClient.patch(
      API_ENDPOINTS.MEDICAL.PATIENTS.UPDATE_PROFILE,
      { vitals_source_priority: priorityList }
    );
    return PatientProfileSchema.parse(response.data);
  }

  async saveVitals(data: { height_inches: number; weight_lbs: number }): Promise<void> {
    debugLog('ProfileService.saveVitals:', data);
    await apiClient.post(API_ENDPOINTS.MEDICAL.PATIENTS.SAVE_VITALS, data);
    // Allow the completed write to settle before callers continue with profile refresh/UI work.
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();
