// Only client-side validation and UI-specific constants
export const CLIENT_VALIDATION = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
  } as const;
  
  export const CLIENT_MESSAGES = {
    LOADING: 'Loading...',
    SIGNING_IN: 'Signing in...',
    SIGNING_UP: 'Creating account...',
    PROCESSING: 'Processing...',
    REDIRECTING: 'Redirecting...',
  } as const;
