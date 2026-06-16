import type { Provider, CategoryDef, HealthSection, MetricItem, DeviceMetrics, WeightData, TrendData } from './types';

/**
 * Junction configuration
 */
export const JUNCTION = {
  backend: null as string | null, // e.g. 'https://api.kinmeds.com' — null = DEMO mode
  userId: 'demo-user',
  env: 'sandbox' as 'sandbox' | 'production',
  get live() { return !!this.backend; },
};

export const SDK_PROVIDERS = ['apple', 'healthconnect', 'samsung'];

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
  { id: 'heart', title: 'Heart', subtitle: '7-day avg' },
  { id: 'body', title: 'Body composition', subtitle: 'latest' },
  { id: 'glucose', title: 'Glucose', subtitle: 'last 24h · CGM' },
  { id: 'nutrition', title: 'Nutrition', subtitle: 'today' },
  { id: 'workouts', title: 'Workouts', subtitle: 'this week' },
  { id: 'cycle', title: 'Cycle', subtitle: 'current' },
];

/**
 * Health metrics data
 */
export const HEALTH: Record<string, MetricItem[]> = {
  sleep: [
    { l: 'Time asleep', v: '7h 12m' },
    { l: 'Sleep score', v: 81, u: '/100' },
    { l: 'Efficiency', v: '89%' },
    { l: 'Deep', v: '1h 24m' },
    { l: 'REM', v: '1h 38m' },
    { l: 'Light', v: '3h 50m' },
    { l: 'Awakenings', v: 2 },
    { l: 'HR asleep', v: '58', u: 'bpm' },
  ],
  activity: [
    { l: 'Steps', v: '7,840', u: '/day' },
    { l: 'Active time', v: '52', u: 'min' },
    { l: 'Calories', v: '2,310', u: 'kcal' },
    { l: 'Distance', v: '3.4', u: 'mi' },
    { l: 'Resting HR', v: '64', u: 'bpm' },
    { l: 'Active days', v: '5', u: 'of 7' },
  ],
  heart: [
    { l: 'Resting HR', v: '64', u: 'bpm' },
    { l: 'HRV', v: '48', u: 'ms' },
    { l: 'Avg HR', v: '72', u: 'bpm' },
    { l: 'Max HR', v: '148', u: 'bpm' },
    { l: 'Cardio zone', v: '38', u: 'min' },
    { l: 'Peak zone', v: '9', u: 'min' },
  ],
  body: [
    { l: 'Weight', v: '201.5', u: 'lb' },
    { l: 'BMI', v: '27.4' },
    { l: 'Body fat', v: '31%' },
    { l: 'Skin temp', v: '97.9°F' },
  ],
  glucose: [
    { l: 'Avg glucose', v: '104', u: 'mg/dL' },
    { l: 'Time in range', v: '86%' },
    { l: 'Below range', v: '2%' },
    { l: 'Above range', v: '12%' },
  ],
  nutrition: [
    { l: 'Calories', v: '1,820', u: 'kcal' },
    { l: 'Protein', v: '96', u: 'g' },
    { l: 'Carbs', v: '180', u: 'g' },
    { l: 'Fat', v: '62', u: 'g' },
  ],
  workouts: [
    { l: 'Sessions', v: 4, u: 'this wk' },
    { l: 'Active time', v: '186', u: 'min' },
    { l: 'Calories', v: '1,240', u: 'kcal' },
    { l: 'Distance', v: '9.2', u: 'mi' },
  ],
  cycle: [
    { l: 'Phase', v: 'Luteal' },
    { l: 'Cycle day', v: 'Day 22' },
    { l: 'Basal temp', v: '98.1°F' },
    { l: 'Last period', v: '22d ago' },
  ],
};

/**
 * Trend data for health sections
 */
export const TRENDS: Record<string, TrendData> = {
  sleep: { label: 'Time asleep', unit: 'h', dec: 1, lowerBetter: false, series: [6.8, 7.1, 6.4, 7.3, 7.0, 6.6, 7.2, 7.4, 6.9, 7.1, 6.7, 7.3, 7.0, 7.2] },
  activity: { label: 'Steps', unit: '/day', dec: 0, lowerBetter: false, series: [6800, 7200, 5400, 8100, 7600, 9000, 6200, 7100, 7900, 6500, 8300, 7000, 8800, 7840] },
  heart: { label: 'Resting HR', unit: 'bpm', dec: 0, lowerBetter: true, series: [67, 66, 65, 66, 64, 65, 64, 63, 64, 65, 63, 64, 63, 64] },
  body: { label: 'Weight', unit: 'lb', dec: 1, lowerBetter: true, series: null },
  glucose: { label: 'Avg glucose', unit: 'mg/dL', dec: 0, lowerBetter: true, series: [112, 108, 110, 105, 107, 103, 106, 104, 102, 105, 103, 104, 101, 104] },
  nutrition: { label: 'Calories', unit: 'kcal', dec: 0, lowerBetter: false, series: [1900, 1750, 2050, 1820, 1700, 1980, 1850, 1760, 1900, 1820, 1680, 1900, 1780, 1820] },
  workouts: { label: 'Active minutes', unit: 'min', dec: 0, lowerBetter: false, series: [20, 45, 0, 60, 30, 50, 0, 40, 55, 25, 48, 0, 52, 38] },
  cycle: { label: 'Basal temp', unit: '°F', dec: 1, lowerBetter: false, series: [97.6, 97.7, 97.7, 97.8, 97.9, 98.0, 98.0, 98.1, 98.1, 98.0, 98.1, 98.2, 98.1, 98.1] },
};

/**
 * Default device metrics / readiness
 */
export const DEVICE_METRICS_DEFAULT: DeviceMetrics = {
  steps: '7,840',
  sleep: '7h 12m',
  restingHr: '64',
  activeDays: '5',
  readiness: 78,
  recovery: 72,
  sleepScore: 81,
};

/**
 * Default weight data
 */
export const WEIGHT_DEFAULT: WeightData = {
  series: [214, 211.5, 209, 207.5, 206, 204.5, 203, 201.5],
  checkins: [
    { label: 'Intake', w: 214 },
    { label: 'May 11', w: 206 },
    { label: 'May 21', w: 204 },
    { label: 'Jun 5', w: 201.5 },
  ],
  start: 214,
  goal: null,
  heightIn: 67,
};

/**
 * Shared data categories (privacy section)
 */
export const SHARED_CATEGORIES = [
  'Sleep', 'Activity', 'Heart rate', 'Body & weight',
  'Glucose', 'Nutrition', 'Workouts',
];