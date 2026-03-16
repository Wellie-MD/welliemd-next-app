import { env } from '@/config/env';

interface TokenRefreshResponse {
  access: string;
}

/**
 * Token Manager
 * Handles storage and retrieval of the access token in memory.
 * The refresh token is now handled via HTTP-only cookies.
 */
class TokenManager {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly refreshUrl: string;

  constructor() {
    const apiBaseUrl = (env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    this.refreshUrl = `${apiBaseUrl}/auth/token/refresh/`;
  }

  /**
   * Set the access token in memory
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshPromise = null;
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(this.refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as TokenRefreshResponse;
        if (!data?.access) {
          throw new Error('No access token in refresh response');
        }

        this.setAccessToken(data.access);
        resolve(data.access);
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearTokens();
        reject(error);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }
}

// Export a singleton instance
export const tokenManager = new TokenManager();
