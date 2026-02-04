import { z } from 'zod';

/**
 * Common validation schemas for authentication forms
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Simple password (for login)
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required');

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Phone validation (optional)
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val),
    'Please enter a valid phone number'
  );

// Token validation
export const tokenSchema = z
  .string()
  .min(1, 'Token is required');

/**
 * Form validation schemas
 */

// Login form
export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional(),
});

// Register form
export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  phoneNumber: phoneSchema,
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Forgot password form
export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

// Reset password form
export const resetPasswordFormSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  token: tokenSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Change password form
export const changePasswordFormSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Update profile form
export const updateProfileFormSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phoneNumber: phoneSchema,
  email: emailSchema.optional(),
});

/**
 * Type exports for form data
 */
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileFormSchema>;

/**
 * Validation utility functions
 */

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include a lowercase letter');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include an uppercase letter');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include a number');

  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  else feedback.push('Include a special character');

  if (password.length >= 12) score += 1;

  return { score, feedback };
};

// Email domain validation
export const isValidEmailDomain = (email: string): boolean => {
  const blockedDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? !blockedDomains.includes(domain) : false;
};

// Check if password is commonly used
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Form field validation helpers
 */

// Real-time email validation
export const validateEmailField = (email: string) => {
  try {
    emailSchema.parse(email);
    
    if (!isValidEmailDomain(email)) {
      return { isValid: false, error: 'Please use a valid email address' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid email' };
  }
};

// Real-time password validation
export const validatePasswordField = (password: string, isLogin = false) => {
  try {
    if (isLogin) {
      loginPasswordSchema.parse(password);
    } else {
      passwordSchema.parse(password);
    }
    
    if (!isLogin && isCommonPassword(password)) {
      return { isValid: false, error: 'This password is too common. Please choose a stronger password.' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid password' };
  }
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true, error: null };
};
