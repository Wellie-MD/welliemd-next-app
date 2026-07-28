// Static wearable provider catalog mirrored from the client prototype.
// UI-only: not yet wired to any Junction wearable Management API.

export type WearAuth = "oauth" | "sdk" | "email" | "password"

export interface WearableProvider {
  id: string
  name: string
  cat: string
  auth: WearAuth
  pull: number
  enabled: boolean
  domain: string
  logoFile: string
}

export const AUTH_LABEL: Record<WearAuth, string> = {
  oauth: "OAuth",
  sdk: "SDK",
  email: "Email",
  password: "Password",
}
