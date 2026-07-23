/**
 * Types for the Devices feature — Junction Wearables integration.
 */

export interface Provider {
  id: string;
  name: string;
  cat: 'wear' | 'scale' | 'cgm' | 'bp' | 'app' | 'ondevice';
  kind: string;
  gives: string;
  ic: string;
  mobile?: boolean;
  logoUrl?: string;
}

export interface Connection {
  id?: string;
  provider: string;
  name: string;
  lastSync: string;
  status?: 'error' | 'pending' | 'connected' | 'disconnected';
  errorType?: string;
}

export interface DeviceState {
  connected: boolean;
  provider: string | null;
  lastSync: string;
  connections: Connection[];
}

export interface Consent {
  given: boolean;
  date: string | null;
}

export interface TrendData {
  label: string;
  unit: string;
  dec: number;
  lowerBetter: boolean;
  series: { date: string; val: number }[] | null;
  step?: 'week' | 'day' | undefined;
}

export interface MetricItem {
  l: string;
  v: string | number;
  u?: string;
}

export interface CategoryDef {
  id: string;
  label: string;
}

export interface HealthSection {
  id: string;
  title: string;       // button label
  heading?: string;    // section heading (if different from title)
  subtitle: string;
}

export interface SleepDetail {
  deep?: number;
  light?: number;
  rem?: number;
  awake?: number;
  efficiency?: number;
  avgHr?: number;
}

export interface WorkoutItem {
  date: string;
  sport: string;
  durationMinutes: number | null;
  calories: number | null;
  avgHr?: number | null;
  distanceKm?: number | null;
}

export interface DeviceMetrics {
  steps: string;
  sleep: string;
  restingHr: string;
  activeDays: string;
  readiness: number;
  recovery: number;
  sleepScore: number;
  stepsSeries?: { date: string; val: number }[];
  sleepSeries?: { date: string; val: number }[];
  sleepDetail?: SleepDetail;
  workoutsCount?: number;
  recentWorkouts?: WorkoutItem[];
  workoutsSeries?: { date: string; val: number }[];
  glucoseSeries?: { date: string; val: number }[];
  avgGlucose?: number | null;
  latestGlucose?: number | null;
}

export interface WeightData {
  series: number[];
  checkins: { label: string; w: number }[];
  start: number | null;
  targetBmi: number | null;
  heightIn: number | null;
  points: { date: string; weight: number; bmi: number | null; height: number | null }[];
  latestBmi: number | null;
  latestBmiCategory: string | null;
}

export type VitalsSource = 'questionnaire' | 'patient_portal' | 'admin' | 'import' | 'wearable';

export interface VitalsEntry {
  id: string;
  source: VitalsSource;
  height_inches: number | null;
  weight_lbs: string | number | null;
  bmi: string | number | null;
  bmi_category: string | null;
  measured_at: string;
}

export interface LinkSessionResponse {
  authorization_url: string | null;
  expires_at: string | null;
  demo?: boolean;
}

export interface DeviceDataResponse {
  weightSeries?: number[];
  steps?: string;
  sleep?: string;
  restingHr?: string;
  activeDays?: string;
  readiness?: number;
  recovery?: number;
  sleepScore?: number;
  stepsSeries?: { date: string; val: number }[];
  sleepSeries?: { date: string; val: number }[];
  sleepDetail?: SleepDetail;
  workoutsCount?: number;
  recentWorkouts?: WorkoutItem[];
  workoutsSeries?: { date: string; val: number }[];
  glucoseSeries?: { date: string; val: number }[];
  avgGlucose?: number | null;
  latestGlucose?: number | null;
}

export interface HealthGoalResponse {
  goal: { target_bmi: string | number; updated_at: string } | null;
}

export interface ConnectionResponse {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
  last_error?: string;
}
