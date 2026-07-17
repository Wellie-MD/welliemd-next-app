import { z } from 'zod';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().optional(),
  auth_user: z.number(),
  // Defaults to "" server-side until an upload UI exists - not a strict url() so parsing
  // doesn't throw on the common (blank) case.
  avatar_url: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Patient Profile Schema  
export const PatientProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  phone: z.string().nullish(),
  date_of_birth: z.string().nullish(),
  address: z.string().nullish(),
  address_line_2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  zip_code: z.string().nullish(),
  sex: z.enum(['Male', 'Female', 'Other']).nullish(),
  allergies: z.string().nullish(),
  medical_conditions: z.string().nullish(),
  self_reported_meds: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  orders_count: z.number().optional(),
  last_order_at: z.string().nullable().optional(),
  last_order_display_id: z.string().optional(),
  latest_vitals: z
    .object({
      height_inches: z.number().nullable().optional(),
      weight_lbs: z.string().nullable().optional(),
      bmi: z.string().nullable().optional(),
      measured_at: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
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
  address_line_2: z.string().optional(),
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
