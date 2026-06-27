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
}

export const AUTH_LABEL: Record<WearAuth, string> = {
  oauth: "OAuth",
  sdk: "SDK",
  email: "Email",
}

export const WEARABLE_PROVIDERS: WearableProvider[] = [
  { id: "oura", name: "Oura", cat: "Smart ring", auth: "oauth", pull: 90, enabled: true },
  { id: "fitbit", name: "Fitbit", cat: "Wearable", auth: "oauth", pull: 90, enabled: true },
  { id: "garmin", name: "Garmin", cat: "Wearable", auth: "oauth", pull: 90, enabled: true },
  { id: "whoop", name: "Whoop", cat: "Wearable", auth: "oauth", pull: 90, enabled: true },
  { id: "withings", name: "Withings", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true },
  { id: "apple", name: "Apple Health", cat: "On-device", auth: "sdk", pull: 90, enabled: true },
  {
    id: "healthconnect",
    name: "Android Health Connect",
    cat: "On-device",
    auth: "sdk",
    pull: 90,
    enabled: true,
  },
  { id: "samsung", name: "Samsung Health", cat: "On-device", auth: "sdk", pull: 90, enabled: true },
  { id: "googlefit", name: "Google Fit", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "dexcom", name: "Dexcom", cat: "CGM", auth: "oauth", pull: 90, enabled: true },
  { id: "libre", name: "FreeStyle Libre", cat: "CGM", auth: "email", pull: 90, enabled: true },
  {
    id: "abbott_libreview",
    name: "Abbott LibreView",
    cat: "CGM",
    auth: "email",
    pull: 90,
    enabled: true,
  },
  { id: "eight_sleep", name: "Eight Sleep", cat: "Sleep", auth: "oauth", pull: 90, enabled: true },
  { id: "polar", name: "Polar", cat: "Wearable", auth: "oauth", pull: 90, enabled: true },
  { id: "suunto", name: "Suunto", cat: "Wearable", auth: "oauth", pull: 90, enabled: true },
  { id: "wahoo", name: "Wahoo", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "strava", name: "Strava", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "peloton", name: "Peloton", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "zwift", name: "Zwift", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "mapmyfitness", name: "MapMyFitness", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "cronometer", name: "Cronometer", cat: "Nutrition", auth: "oauth", pull: 90, enabled: true },
  { id: "myfitnesspal", name: "MyFitnessPal", cat: "Nutrition", auth: "oauth", pull: 90, enabled: true },
  { id: "ihealth", name: "iHealth", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true },
  { id: "omron", name: "Omron", cat: "Blood pressure", auth: "oauth", pull: 90, enabled: true },
  { id: "beurer", name: "Beurer", cat: "Blood pressure", auth: "oauth", pull: 90, enabled: true },
  { id: "renpho", name: "Renpho", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true },
  { id: "hammerhead", name: "Hammerhead", cat: "App", auth: "oauth", pull: 90, enabled: true },
  { id: "kardia", name: "Kardia (AliveCor)", cat: "ECG", auth: "oauth", pull: 90, enabled: true },
  { id: "accuchek", name: "Accu-Chek", cat: "CGM", auth: "oauth", pull: 90, enabled: true },
]

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
