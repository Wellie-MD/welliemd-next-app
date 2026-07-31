import type { Provider, CategoryDef, HealthSection, MetricItem, DeviceMetrics, WeightData, TrendData } from './types';

/**
 * Junction configuration
 */
export const JUNCTION = {
  env: 'production' as 'sandbox' | 'production',
};

export const DEVICE_ENDPOINTS = {
  providers: '/wearables/providers/?client_view=true',
  oauthSession: '/wearables/oauth-session/',
  connections: '/wearables/connections/',
  syncConnections: '/wearables/connections/sync/',
  consent: '/wearables/consent/',
  deleteHealthData: '/wearables/delete-health-data/',
  deviceData: '/wearables/device-data/',
  vitals: '/medical/vitals/',
  healthGoal: '/medical/health-goal/',
  disconnect: (id: string) => `/wearables/connections/${id}/disconnect/`,
  reconnect: (id: string) => `/wearables/connections/${id}/reconnect/`,
};

/**
 * All supported device/app providers
 */
export const PROVIDERS: Provider[] = [
  { id: 'oura', name: 'Oura', cat: 'wear', kind: 'Smart ring', gives: 'Sleep, HRV & readiness', ic: '💍' },
  { id: 'fitbit', name: 'Fitbit', cat: 'wear', kind: 'Wearable', gives: 'Activity, heart rate & sleep', ic: '⌚' },
  { id: 'garmin', name: 'Garmin', cat: 'wear', kind: 'Wearable', gives: 'Activity, heart rate & workouts', ic: '⌚' },
  { id: 'whoop', name: 'Whoop', cat: 'wear', kind: 'Wearable', gives: 'Recovery, strain & sleep', ic: '⌚' },
  { id: 'polar', name: 'Polar', cat: 'wear', kind: 'Wearable', gives: 'Activity & heart rate', ic: '⌚' },
  { id: 'coros', name: 'Coros', cat: 'wear', kind: 'Wearable', gives: 'Activity & workouts', ic: '⌚' },
  { id: 'suunto', name: 'Suunto', cat: 'wear', kind: 'Wearable', gives: 'Activity & workouts', ic: '⌚' },
  { id: 'amazfit', name: 'Amazfit / Zepp', cat: 'wear', kind: 'Wearable', gives: 'Activity & sleep', ic: '⌚' },
  { id: 'withings', name: 'Withings', cat: 'scale', kind: 'Smart scale', gives: 'Weight & body composition', ic: '⚖️' },
  { id: 'eufy', name: 'Eufy', cat: 'scale', kind: 'Smart scale', gives: 'Weight & body composition', ic: '⚖️' },
  { id: 'renpho', name: 'Renpho', cat: 'scale', kind: 'Smart scale', gives: 'Weight & body composition', ic: '⚖️' },
  { id: 'dexcom', name: 'Dexcom', cat: 'cgm', kind: 'CGM', gives: 'Continuous glucose', ic: '🩸' },
  { id: 'libre', name: 'FreeStyle Libre', cat: 'cgm', kind: 'CGM', gives: 'Continuous glucose', ic: '🩸' },
  { id: 'omron', name: 'Omron', cat: 'bp', kind: 'Monitor', gives: 'Blood pressure', ic: '🩺' },
  { id: 'withings_bpm', name: 'Withings BPM', cat: 'bp', kind: 'Monitor', gives: 'Blood pressure', ic: '🩺' },
  { id: 'strava', name: 'Strava', cat: 'app', kind: 'App', gives: 'Workouts & activity', ic: '🏃' },
  { id: 'peloton', name: 'Peloton', cat: 'app', kind: 'App', gives: 'Workouts', ic: '🚴' },
  { id: 'wahoo', name: 'Wahoo', cat: 'app', kind: 'App', gives: 'Cycling & workouts', ic: '🚴' },
  { id: 'googlefit', name: 'Google Fit', cat: 'app', kind: 'App', gives: 'Activity & steps', ic: '🏃' },
  { id: 'apple', name: 'Apple Health', cat: 'ondevice', kind: 'On-device (iPhone)', gives: 'All health & fitness data', ic: '📱', mobile: true },
  { id: 'healthconnect', name: 'Google Health Connect', cat: 'ondevice', kind: 'On-device (Android)', gives: 'All health & fitness data', ic: '📱', mobile: true },
  { id: 'samsung', name: 'Samsung Health', cat: 'ondevice', kind: 'On-device (Android)', gives: 'All health & fitness data', ic: '📱', mobile: true },
];

/**
 * Category chips for device listing
 */
export const CATS: CategoryDef[] = [
  { id: 'all', label: 'All' },
  { id: 'wear', label: 'Wearables' },
  { id: 'scale', label: 'Scales' },
  { id: 'cgm', label: 'Glucose' },
  { id: 'bp', label: 'Blood pressure' },
  { id: 'app', label: 'Apps' },
  { id: 'ondevice', label: 'On-device' },
];

/**
 * Health data category tabs
 */
export const HEALTH_SECTIONS: HealthSection[] = [
  { id: 'sleep', title: 'Sleep', subtitle: 'last night' },
  { id: 'activity', title: 'Activity', subtitle: '7-day avg' },
  { id: 'workouts', title: 'Workouts', subtitle: 'this week' },
];

/**
 * Health metrics data
 */
export const HEALTH: Record<string, MetricItem[]> = {};

/**
 * Trend data for health sections
 */
export const TRENDS: Record<string, TrendData> = {};

/**
 * Default device metrics / readiness
 */
export const DEVICE_METRICS_DEFAULT: DeviceMetrics = {
  steps: '',
  sleep: '',
  restingHr: '',
  activeDays: '',
  readiness: 0,
  recovery: 0,
  sleepScore: 0,
};

/**
 * Default weight data
 */
export const WEIGHT_DEFAULT: WeightData = {
  series: [],
  checkins: [],
  start: null,
  targetWeightLbs: null,
  targetBmi: null,
  heightIn: null,
  points: [],
  latestBmi: null,
  latestBmiCategory: null,
};

/**
 * Shared data categories (privacy section)
 */
export const SHARED_CATEGORIES = [
  'Sleep', 'Activity', 'Workouts',
];
