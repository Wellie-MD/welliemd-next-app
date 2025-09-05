// Auth feature exports
export * from './types/auth.types';
export * from './services/auth.service';
export * from './store/auth.store';

// Hooks
export * from './hooks/use-auth';
export * from './hooks/use-auth-init';

// Utils
export * from './utils/validation';
export * from './utils/errors';

// Components (when implemented)
// export * from './components';

// Re-export commonly used types
export type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  AuthState,
  Permission,
} from './types/auth.types';

// Re-export commonly used hooks
export { useAuth, usePermissions, useProfile } from './hooks/use-auth';
export { useAuthInit, useTokenRefresh, useSessionTimeout } from './hooks/use-auth-init';

// Re-export error handling
export { AuthError, AuthErrorCode, parseAuthError, getErrorMessage } from './utils/errors';
