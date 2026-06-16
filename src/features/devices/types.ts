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
}

export interface Connection {
  provider: string;
  name: string;
  lastSync: string;
  status?: 'error' | undefined;
  errorType?: string | undefined;
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
  series: number[] | null;
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
  title: string;
  subtitle: string;
}

export interface DeviceMetrics {
  steps: string;
  sleep: string;
  restingHr: string;
  activeDays: string;
  readiness: number;
  recovery: number;
  sleepScore: number;
}

export interface WeightData {
  series: number[];
  checkins: { label: string; w: number }[];
  start: number;
  goal: number | null;
  heightIn: number;
}

export interface LinkTokenResponse {
  link_web_url?: string;
  linkWebUrl?: string;
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
}

export interface ConnectionResponse {
  provider: string;
  name: string;
  lastSync: string;
  status?: string;
  error_type?: string;
  errorType?: string;
}