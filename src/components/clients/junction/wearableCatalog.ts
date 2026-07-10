// Static wearable provider catalog mirrored from the client prototype.
// UI-only: not yet wired to any Junction wearable Management API.

export type WearAuth = "oauth" | "sdk" | "email"

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
}

export const WEAR_PRIORITY: string[] = [
  "withings",
  "ihealth",
  "renpho",
  "dexcom",
  "libre",
  "abbott_libreview",
  "accuchek",
  "omron",
  "beurer",
  "kardia",
  "oura",
  "whoop",
  "eight_sleep",
  "garmin",
  "fitbit",
  "polar",
  "suunto",
  "apple",
  "healthconnect",
  "samsung",
  "wahoo",
  "strava",
  "peloton",
  "zwift",
  "mapmyfitness",
  "hammerhead",
  "cronometer",
  "myfitnesspal",
  "googlefit",
]
