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

export const WEARABLE_PROVIDERS: WearableProvider[] = [
  { id: "oura", name: "Oura", cat: "Smart ring", auth: "oauth", pull: 90, enabled: true, domain: "ouraring.com", logoFile: "oura.png" },
  { id: "fitbit", name: "Fitbit", cat: "Wearable", auth: "oauth", pull: 90, enabled: true, domain: "fitbit.com", logoFile: "fitbit.png" },
  { id: "garmin", name: "Garmin", cat: "Wearable", auth: "oauth", pull: 90, enabled: true, domain: "garmin.com", logoFile: "garmin.png" },
  { id: "whoop", name: "Whoop", cat: "Wearable", auth: "oauth", pull: 90, enabled: true, domain: "whoop.com", logoFile: "whoop.png" },
  { id: "withings", name: "Withings", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true, domain: "withings.com", logoFile: "withings.png" },
  { id: "apple", name: "Apple Health", cat: "On-device", auth: "sdk", pull: 90, enabled: true, domain: "apple.com", logoFile: "apple-health.png" },
  {
    id: "healthconnect",
    name: "Android Health Connect",
    cat: "On-device",
    auth: "sdk",
    pull: 90,
    enabled: true,
    domain: "android.com",
    logoFile: "android-health-connect.png",
  },
  { id: "samsung", name: "Samsung Health", cat: "On-device", auth: "sdk", pull: 90, enabled: true, domain: "samsung.com", logoFile: "samsung-health.png" },
  { id: "googlefit", name: "Google Fit", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "google.com", logoFile: "google-fit.png" },
  { id: "dexcom", name: "Dexcom", cat: "CGM", auth: "oauth", pull: 90, enabled: true, domain: "dexcom.com", logoFile: "dexcom.png" },
  { id: "libre", name: "FreeStyle Libre", cat: "CGM", auth: "email", pull: 90, enabled: true, domain: "freestyle.abbott", logoFile: "freestyle-libre.png" },
  {
    id: "abbott_libreview",
    name: "Abbott LibreView",
    cat: "CGM",
    auth: "email",
    pull: 90,
    enabled: true,
    domain: "libreview.com",
    logoFile: "abbott-libreview.png",
  },
  { id: "eight_sleep", name: "Eight Sleep", cat: "Sleep", auth: "oauth", pull: 90, enabled: true, domain: "eightsleep.com", logoFile: "eight-sleep.png" },
  { id: "polar", name: "Polar", cat: "Wearable", auth: "oauth", pull: 90, enabled: true, domain: "polar.com", logoFile: "polar.png" },
  { id: "suunto", name: "Suunto", cat: "Wearable", auth: "oauth", pull: 90, enabled: true, domain: "suunto.com", logoFile: "suunto.png" },
  { id: "wahoo", name: "Wahoo", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "wahoofitness.com", logoFile: "wahoo.png" },
  { id: "strava", name: "Strava", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "strava.com", logoFile: "strava.png" },
  { id: "peloton", name: "Peloton", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "onepeloton.com", logoFile: "peloton.png" },
  { id: "zwift", name: "Zwift", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "zwift.com", logoFile: "zwift.png" },
  { id: "mapmyfitness", name: "MapMyFitness", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "mapmyfitness.com", logoFile: "mapmyfitness.png" },
  { id: "cronometer", name: "Cronometer", cat: "Nutrition", auth: "oauth", pull: 90, enabled: true, domain: "cronometer.com", logoFile: "cronometer.png" },
  { id: "myfitnesspal", name: "MyFitnessPal", cat: "Nutrition", auth: "oauth", pull: 90, enabled: true, domain: "myfitnesspal.com", logoFile: "myfitnesspal.png" },
  { id: "ihealth", name: "iHealth", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true, domain: "ihealthlabs.com", logoFile: "ihealth.png" },
  { id: "omron", name: "Omron", cat: "Blood pressure", auth: "oauth", pull: 90, enabled: true, domain: "omronhealthcare.com", logoFile: "omron.png" },
  { id: "beurer", name: "Beurer", cat: "Blood pressure", auth: "oauth", pull: 90, enabled: true, domain: "beurer.com", logoFile: "beurer.png" },
  { id: "renpho", name: "Renpho", cat: "Smart scale", auth: "oauth", pull: 90, enabled: true, domain: "renpho.com", logoFile: "renpho.png" },
  { id: "hammerhead", name: "Hammerhead", cat: "App", auth: "oauth", pull: 90, enabled: true, domain: "hammerhead.io", logoFile: "hammerhead.png" },
  { id: "kardia", name: "Kardia (AliveCor)", cat: "ECG", auth: "oauth", pull: 90, enabled: true, domain: "alivecor.com", logoFile: "kardia-alivecor.png" },
  { id: "accuchek", name: "Accu-Chek", cat: "CGM", auth: "oauth", pull: 90, enabled: true, domain: "accu-chek.com", logoFile: "accu-chek.png" },
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
