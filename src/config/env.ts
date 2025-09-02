import { z } from 'zod';

// Environment variables schema with validation
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(10000),
  VITE_AUTH_TOKEN_KEY: z.string().default('welliemd_auth_token'),
  VITE_REFRESH_TOKEN_KEY: z.string().default('welliemd_refresh_token'),
  VITE_TOKEN_REFRESH_THRESHOLD: z.coerce.number().positive().default(300000),
  VITE_ENABLE_FEATURE_FLAGS: z.coerce.boolean().default(false),
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  VITE_ENABLE_ERROR_REPORTING: z.coerce.boolean().default(false),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_NAME: z.string().default('WellieMD Patient Portal'),
  VITE_MOCK_API: z.coerce.boolean().default(false),
  VITE_DEBUG_MODE: z.coerce.boolean().default(false),
});

// Parse and validate environment variables
function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables. Check your .env file.');
  }
  
  return result.data;
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper to check if we're in development
export const isDev = env.VITE_APP_ENV === 'development';
export const isProd = env.VITE_APP_ENV === 'production';
export const isStaging = env.VITE_APP_ENV === 'staging';

// Debug logging helper
export const debugLog = (...args: unknown[]) => {
  if (env.VITE_DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

