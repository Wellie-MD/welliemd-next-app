// Junction Sense DSL grammar reference, transcribed from Junction support's
// full field/index/function dump. UI-only reference data for the guided
// query builder — not shared with the backend, which deliberately keeps its
// own validation shape-only (see apps/integrations/admin_views.py's
// _validate_sense_query_dsl) since this still isn't Junction's *complete*
// grammar: the where-clause `type` value enum and the full value_macro list
// are both explicitly "not exhaustive" per Junction support.

export interface SenseOption {
  value: string
  label: string
}

export type SenseIndex =
  | "sleep"
  | "derived_readiness"
  | "activity"
  | "workout"
  | "body"
  | "meal"
  | "menstrual_cycle"
  | "profile"
  | "timeseries"

function prettyLabel(field: string): string {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function fieldOptions(fields: string[]): SenseOption[] {
  return fields.map((f) => ({ value: f, label: prettyLabel(f) }))
}

export const SENSE_INDICES: SenseOption[] = [
  { value: "sleep", label: "Sleep" },
  { value: "derived_readiness", label: "Derived Readiness" },
  { value: "activity", label: "Activity" },
  { value: "workout", label: "Workout" },
  { value: "body", label: "Body" },
  { value: "meal", label: "Meal / Nutrition" },
  { value: "menstrual_cycle", label: "Menstrual Cycle" },
  { value: "profile", label: "Profile" },
  { value: "timeseries", label: "Timeseries" },
]

const RAW_INDEX_FIELDS: Record<SenseIndex, string[]> = {
  sleep: [
    "id", "session_start", "session_end", "state", "type", "duration_second",
    "stage_asleep_second", "stage_awake_second", "stage_light_second",
    "stage_rem_second", "stage_deep_second", "stage_unknown_second",
    "latency_second", "heart_rate_minimum", "heart_rate_mean",
    "heart_rate_maximum", "heart_rate_dip", "heart_rate_resting",
    "efficiency", "hrv_mean_rmssd", "hrv_mean_sdnn", "skin_temperature",
    "skin_temperature_delta", "respiratory_rate", "score",
    "recovery_readiness_score", "source_type", "source_provider",
    "source_app_id", "source_device_id", "time_zone",
  ],
  derived_readiness: [
    "date", "chronotype", "sleep_score", "recovery_score", "recovery_zone",
    "stress_score", "strain_score", "strain_zone",
  ],
  activity: [
    "date", "calories_total", "calories_active", "steps", "distance_meter",
    "floors_climbed", "duration_active_second", "intensity_sedentary_second",
    "intensity_low_second", "intensity_medium_second",
    "intensity_high_second", "heart_rate_mean", "heart_rate_minimum",
    "heart_rate_maximum", "heart_rate_resting", "heart_rate_mean_walking",
    "wheelchair_use", "wheelchair_push", "source_type", "source_provider",
    "source_app_id", "source_device_id", "time_zone", "time_zone_offset",
  ],
  workout: [
    "session_start", "session_end", "title", "sport_name", "sport_slug",
    "duration_active_second", "heart_rate_mean", "heart_rate_minimum",
    "heart_rate_maximum", "heart_rate_zone_1", "heart_rate_zone_2",
    "heart_rate_zone_3", "heart_rate_zone_4", "heart_rate_zone_5",
    "heart_rate_zone_6", "distance_meter", "calories",
    "elevation_gain_meter", "elevation_maximum_meter",
    "elevation_minimum_meter", "speed_mean", "speed_maximum", "power_source",
    "power_mean", "power_maximum", "power_weighted_mean", "steps",
    "map_polyline", "map_summary_polyline", "source_type", "source_provider",
    "source_app_id", "source_device_id", "external_id", "time_zone",
  ],
  body: [
    "measured_at", "weight_kilogram", "fat_mass_percentage",
    "water_percentage", "muscle_mass_percentage", "visceral_fat_index",
    "bone_mass_percentage", "body_mass_index", "lean_body_mass_kilogram",
    "waist_circumference_centimeter", "source_type", "source_provider",
    "source_app_id", "source_device_id", "time_zone",
  ],
  meal: [
    "calories", "carbohydrate_gram", "protein_gram", "alcohol_gram",
    "water_gram", "fibre_gram", "sugar_gram", "cholesterol_gram",
    "saturated_fat_gram", "monounsaturated_fat_gram",
    "polyunsaturated_fat_gram", "omega3_fat_gram", "omega6_fat_gram",
    "total_fat_gram", "sodium_milligram", "potassium_milligram",
    "calcium_milligram", "phosphorus_milligram", "magnesium_milligram",
    "iron_milligram", "zinc_milligram", "fluoride_milligram",
    "chloride_milligram", "vitamin_a_milligram", "vitamin_b1_milligram",
    "riboflavin_milligram", "niacin_milligram", "pantothenic_acid_milligram",
    "vitamin_b6_milligram", "biotin_microgram", "vitamin_b12_microgram",
    "vitamin_c_milligram", "vitamin_d_microgram", "vitamin_e_milligram",
    "vitamin_k_microgram", "folic_acid_microgram", "chromium_microgram",
    "copper_milligram", "iodine_microgram", "manganese_milligram",
    "molybdenum_microgram", "selenium_microgram", "date", "name",
    "source_type", "source_provider", "source_app_id", "source_device_id",
  ],
  menstrual_cycle: [
    "period_start", "period_end", "cycle_end", "is_predicted",
    "menstrual_flow", "cervical_mucus", "intermenstrual_bleeding",
    "contraceptive", "detected_deviations", "ovulation_test",
    "home_pregnancy_test", "home_progesterone_test", "sexual_activity",
    "basal_body_temperature", "source_type", "source_provider",
    "source_app_id", "source_device_id",
  ],
  profile: [
    "height_centimeter", "birth_date", "wheelchair_use", "gender", "sex",
    "source_type", "source_provider", "source_app_id", "source_device_id",
    "created_at", "updated_at",
  ],
  timeseries: [
    "glucose", "heartrate", "hrv", "ige", "igg", "cholesterol", "weight",
    "fat", "blood_oxygen", "electrocardiogram_voltage", "respiratory_rate",
    "stress_level", "steps", "distance", "vo2_max", "heart_rate_alert",
    "stand_hour", "sleep_breathing_disturbance", "water", "caffeine",
    "mindfulness_minutes", "calories_active", "floors_climbed",
    "calories_basal", "afib_burden", "stand_duration", "sleep_apnea_alert",
    "wheelchair_push", "forced_expiratory_volume_1", "forced_vital_capacity",
    "peak_expiratory_flow_rate", "inhaler_usage", "fall", "uv_exposure",
    "daylight_exposure", "handwashing", "basal_body_temperature",
    "body_mass_index", "lean_body_mass", "waist_circumference",
    "heart_rate_recovery_one_minute", "workout_swimming_stroke",
    "workout_distance", "carbohydrates", "body_temperature",
    "body_temperature_delta",
  ],
}

export const SENSE_INDEX_FIELDS: Record<SenseIndex, SenseOption[]> = Object.fromEntries(
  Object.entries(RAW_INDEX_FIELDS).map(([index, fields]) => [index, fieldOptions(fields)])
) as Record<SenseIndex, SenseOption[]>

// Only confirmed to actually work within a `sleep`-index query (that's the
// one working example we have) — the modal only offers these when the
// selected index is "sleep".
export const SENSE_VALUE_MACROS: SenseOption[] = fieldOptions([
  "sleep_score",
  "chronotype",
  "asleep_at",
  "awake_at",
  "awakenings",
])

export const SENSE_AGG_FUNCS: SenseOption[] = fieldOptions([
  "mean",
  "min",
  "max",
  "sum",
  "count",
  "median",
  "stddev",
  "oldest",
  "newest",
])

export const SENSE_TIME_UNITS: SenseOption[] = [
  { value: "day", label: "Day" },
  { value: "hour", label: "Hour" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

export interface SenseMetricRow {
  kind: "field" | "macro"
  name: string
  func: string
}

/** Assemble a `{where, select, group_by}` DSL body from guided-form
 * selections. Pure/no side effects — used both to build the payload on
 * submit and to render a live JSON preview when switching to the Advanced
 * tab. */
export function buildSenseQueryDsl(
  index: SenseIndex,
  whereText: string,
  metrics: SenseMetricRow[],
  timeUnit: string
): Record<string, unknown> {
  const select: Record<string, unknown>[] = [{ group_key: "*" }]
  metrics.forEach((m) => {
    if (!m.name || !m.func) return
    if (m.kind === "macro") {
      select.push({ arg: { value_macro: m.name, version: "automatic" }, func: m.func })
    } else {
      select.push({ arg: { [index]: m.name }, func: m.func })
    }
  })

  return {
    where: whereText.trim() ? whereText.trim() : null,
    select,
    group_by: [
      { date_trunc: { value: 1, unit: timeUnit }, arg: { index } },
      { source: "source_provider" },
      { source: "source_type" },
    ],
  }
}
