import { z } from 'zod';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().optional(),
  auth_user: z.number(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Patient Profile Schema  
export const PatientProfileSchema = z.object({
  id: z.string().uuid(),
  user: z.string().uuid(),
  user_email: z.string().email(),
  user_name: z.string(),
  phone: z.string(),
  date_of_birth: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  sex: z.enum(['Male', 'Female', 'Other']),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  self_reported_meds: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PatientProfile = z.infer<typeof PatientProfileSchema>;

// Request Schemas
export const UpdateUserRequestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UpdatePatientRequestSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip_code: z.string().min(5, 'Zip code is required'),
  sex: z.enum(['Male', 'Female', 'Other']),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  self_reported_meds: z.string().optional(),
});

export type UpdatePatientRequest = z.infer<typeof UpdatePatientRequestSchema>;

export const PasswordUpdateRequestSchema = z.object({
  email: z.string().email(),
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Password confirmation is required'),
});

export type PasswordUpdateRequest = z.infer<typeof PasswordUpdateRequestSchema>;
