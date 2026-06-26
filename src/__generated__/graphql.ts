/* eslint-disable */
// @ts-nocheck
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { gql } from '@apollo/client';
import type * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

/** Per-day aggregate combining OwnTracks location stats and Garmin activity metrics. */
export type DailyActivitySummary = {
  __typename?: 'DailyActivitySummary';
  /** Calendar date in YYYY-MM-DD format */
  activity_date?: Maybe<Scalars['String']['output']>;
  /** Mean horizontal GPS accuracy in meters */
  avg_accuracy?: Maybe<Scalars['Float']['output']>;
  /** Mean heart rate across Garmin activities in BPM */
  avg_heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Number of Garmin activities recorded */
  garmin_activities?: Maybe<Scalars['Int']['output']>;
  /** Garmin sport type for activities on this day */
  garmin_sport?: Maybe<Scalars['String']['output']>;
  /** Highest device battery percentage observed */
  max_battery?: Maybe<Scalars['Int']['output']>;
  /** Lowest device battery percentage observed */
  min_battery?: Maybe<Scalars['Int']['output']>;
  /** OwnTracks device that reported data for this day */
  owntracks_device?: Maybe<Scalars['String']['output']>;
  /** Number of OwnTracks GPS points recorded */
  owntracks_points?: Maybe<Scalars['Int']['output']>;
  /** Total calories burned across Garmin activities */
  total_calories?: Maybe<Scalars['Int']['output']>;
  /** Combined Garmin activity distance in km */
  total_distance_km?: Maybe<Scalars['Float']['output']>;
  /** Combined Garmin activity duration in seconds */
  total_duration_seconds?: Maybe<Scalars['Float']['output']>;
};

/** Paginated list of daily activity summaries. */
export type DailySummaryConnection = {
  __typename?: 'DailySummaryConnection';
  /** List of daily activity summary items in the current page */
  items: Array<DailyActivitySummary>;
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

/** Earliest and latest activity dates available in the daily activity summary view. */
export type DailySummaryDateRange = {
  __typename?: 'DailySummaryDateRange';
  /** Latest activity date with daily summary data (YYYY-MM-DD) */
  max_date: Scalars['String']['output'];
  /** Earliest activity date with daily summary data (YYYY-MM-DD) */
  min_date: Scalars['String']['output'];
};

/** Distinct OwnTracks device identifier. */
export type DeviceInfo = {
  __typename?: 'DeviceInfo';
  /** OwnTracks device identifier */
  device_id: Scalars['String']['output'];
};

/** Geodesic distance calculation result between two geographic points. */
export type DistanceResult = {
  __typename?: 'DistanceResult';
  /** Geodesic distance between the two points in meters */
  distance_meters: Scalars['Float']['output'];
  /** Origin latitude in decimal degrees */
  from_lat: Scalars['Float']['output'];
  /** Origin longitude in decimal degrees */
  from_lon: Scalars['Float']['output'];
  /** Destination latitude in decimal degrees */
  to_lat: Scalars['Float']['output'];
  /** Destination longitude in decimal degrees */
  to_lon: Scalars['Float']['output'];
};

/** Summary of a Garmin Connect activity parsed from a FIT file. */
export type GarminActivity = {
  __typename?: 'GarminActivity';
  /** Garmin Connect activity identifier */
  activity_id: Scalars['String']['output'];
  /** Aerobic training effect score */
  aerobic_training_effect?: Maybe<Scalars['Float']['output']>;
  /** Anaerobic training effect score */
  anaerobic_training_effect?: Maybe<Scalars['Float']['output']>;
  /** Average cadence in RPM */
  avg_cadence?: Maybe<Scalars['Int']['output']>;
  /** Average heart rate in beats per minute */
  avg_heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Average pace in minutes per kilometre */
  avg_pace?: Maybe<Scalars['Float']['output']>;
  /** Average respiration rate in breaths per minute */
  avg_respiration_rate?: Maybe<Scalars['Int']['output']>;
  /** Average speed in km/h */
  avg_speed_kmh?: Maybe<Scalars['Float']['output']>;
  /** Average ambient temperature in degrees C */
  avg_temperature_c?: Maybe<Scalars['Int']['output']>;
  /** Total calories burned */
  calories?: Maybe<Scalars['Int']['output']>;
  /** UTC timestamp when the record was inserted */
  created_at?: Maybe<Scalars['String']['output']>;
  /** Recording device metadata (manufacturer, model, firmware) */
  device?: Maybe<GarminDevice>;
  /** Device manufacturer (e.g. garmin) */
  device_manufacturer?: Maybe<Scalars['String']['output']>;
  /** Total distance in kilometres */
  distance_km?: Maybe<Scalars['Float']['output']>;
  /** Active duration in seconds (excludes pauses) */
  duration_seconds?: Maybe<Scalars['Float']['output']>;
  /** Activity end time in UTC */
  end_time?: Maybe<Scalars['String']['output']>;
  /** Exercise load score */
  exercise_load?: Maybe<Scalars['Int']['output']>;
  /** Whether this activity has usable heart-rate data in summary or track points */
  hr_available: Scalars['Boolean']['output'];
  /** Maximum cadence in RPM */
  max_cadence?: Maybe<Scalars['Int']['output']>;
  /** Maximum heart rate in beats per minute */
  max_heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Maximum respiration rate in breaths per minute */
  max_respiration_rate?: Maybe<Scalars['Int']['output']>;
  /** Maximum speed in km/h */
  max_speed_kmh?: Maybe<Scalars['Float']['output']>;
  /** Maximum ambient temperature in degrees C */
  max_temperature_c?: Maybe<Scalars['Int']['output']>;
  /** Minimum heart rate in beats per minute */
  min_heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Minimum respiration rate in breaths per minute */
  min_respiration_rate?: Maybe<Scalars['Int']['output']>;
  /** Minimum ambient temperature in degrees C */
  min_temperature_c?: Maybe<Scalars['Int']['output']>;
  /** Moderate intensity minutes */
  moderate_intensity_minutes?: Maybe<Scalars['Int']['output']>;
  /** Distance over paved surfaces in kilometres */
  paved_distance_km?: Maybe<Scalars['Float']['output']>;
  /** Primary sport type (e.g. cycling, running) */
  sport: Scalars['String']['output'];
  /** Activity start time in UTC */
  start_time?: Maybe<Scalars['String']['output']>;
  /** Sub-sport classification (e.g. road, trail) */
  sub_sport?: Maybe<Scalars['String']['output']>;
  /** Estimated sweat loss in millilitres */
  sweat_loss_ml?: Maybe<Scalars['Int']['output']>;
  /** Total elevation gain in meters */
  total_ascent_m?: Maybe<Scalars['Float']['output']>;
  /** Total elevation loss in meters */
  total_descent_m?: Maybe<Scalars['Float']['output']>;
  /** Raw total distance in meters from FIT file */
  total_distance?: Maybe<Scalars['Float']['output']>;
  /** Total elapsed time in seconds (includes pauses) */
  total_elapsed_time?: Maybe<Scalars['Float']['output']>;
  /** Total intensity minutes */
  total_intensity_minutes?: Maybe<Scalars['Int']['output']>;
  /** Total activity strokes */
  total_strokes?: Maybe<Scalars['Int']['output']>;
  /** Total timer time in seconds (active recording) */
  total_timer_time?: Maybe<Scalars['Float']['output']>;
  /** Number of GPS track points in this activity */
  track_point_count?: Maybe<Scalars['Int']['output']>;
  /** Distance over unpaved surfaces in kilometres */
  unpaved_distance_km?: Maybe<Scalars['Float']['output']>;
  /** UTC timestamp when the FIT file was uploaded */
  uploaded_at?: Maybe<Scalars['String']['output']>;
  /** Vigorous intensity minutes */
  vigorous_intensity_minutes?: Maybe<Scalars['Int']['output']>;
};

/** Full reverse-geocoded address attached to a Garmin activity waypoint. */
export type GarminActivityAddress = {
  __typename?: 'GarminActivityAddress';
  /** Parent Garmin activity identifier */
  activity_id: Scalars['String']['output'];
  /** Pelias confidence score (0-1) */
  confidence?: Maybe<Scalars['Float']['output']>;
  /** Country name */
  country?: Maybe<Scalars['String']['output']>;
  /** Full formatted address label from Pelias */
  display_address?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when geocoding was performed */
  geocoded_at?: Maybe<Scalars['String']['output']>;
  /** House or building number */
  housenumber?: Maybe<Scalars['String']['output']>;
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** City or town */
  locality?: Maybe<Scalars['String']['output']>;
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Neighbourhood name */
  neighbourhood?: Maybe<Scalars['String']['output']>;
  /** Postal or ZIP code */
  postalcode?: Maybe<Scalars['String']['output']>;
  /** State or province */
  region?: Maybe<Scalars['String']['output']>;
  /** Geocoding status: success, no_coverage, error, pending */
  status: Scalars['String']['output'];
  /** Street name */
  street?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp of the track point this address was derived from */
  timestamp: Scalars['DateTime']['output'];
  /** garmin_track_points.id this address was geocoded from */
  track_point_id: Scalars['Int']['output'];
  /** Role of this waypoint within the activity: start, end, or waypoint */
  waypoint_kind: Scalars['String']['output'];
};

/** Paginated list of Garmin activities. */
export type GarminActivityConnection = {
  __typename?: 'GarminActivityConnection';
  /** List of Garmin activity items in the current page */
  items: Array<GarminActivity>;
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

/** Aggregated Garmin activity totals for a single time bucket (week, month, or year). */
export type GarminActivityTotal = {
  __typename?: 'GarminActivityTotal';
  /** Number of activities in the period */
  activity_count: Scalars['Int']['output'];
  /** Start date of the period bucket (DATE_TRUNC of week/month/year) */
  period_start: Scalars['String']['output'];
  /** Sum of elevation gain in meters */
  total_ascent_m?: Maybe<Scalars['Int']['output']>;
  /** Sum of calories burned */
  total_calories?: Maybe<Scalars['Int']['output']>;
  /** Sum of distance in kilometres */
  total_distance_km?: Maybe<Scalars['Float']['output']>;
  /** Sum of active duration in seconds (excludes pauses) */
  total_duration_seconds?: Maybe<Scalars['Int']['output']>;
};

/** Lightweight track point optimised for time-series chart rendering. */
export type GarminChartPoint = {
  __typename?: 'GarminChartPoint';
  /** Elevation above sea level in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Pedal/step cadence in RPM */
  cadence?: Maybe<Scalars['Int']['output']>;
  /** Cumulative distance from activity start in km */
  distance_from_start_km?: Maybe<Scalars['Float']['output']>;
  /** Heart rate in beats per minute */
  heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Heart-rate zone index (1-5) */
  hr_zone?: Maybe<Scalars['Int']['output']>;
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Respiration rate in breaths per minute */
  respiration_rate?: Maybe<Scalars['Int']['output']>;
  /** Instantaneous speed in km/h */
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  /** Ambient temperature in degrees C */
  temperature_c?: Maybe<Scalars['Float']['output']>;
  /** UTC timestamp of the data point */
  timestamp: Scalars['DateTime']['output'];
};

/** Earliest and latest timestamps in the Garmin activities table. */
export type GarminDateRange = {
  __typename?: 'GarminDateRange';
  /** Latest Garmin activity timestamp (ISO 8601) */
  max_date: Scalars['DateTime']['output'];
  /** Earliest Garmin activity timestamp (ISO 8601) */
  min_date: Scalars['DateTime']['output'];
};

/** Recording device metadata captured from a Garmin activity's FIT file. */
export type GarminDevice = {
  __typename?: 'GarminDevice';
  /** Recording device serial number */
  device_id?: Maybe<Scalars['Float']['output']>;
  /** Raw Garmin product enum id from the FIT file (e.g. 4061) */
  garmin_product?: Maybe<Scalars['Int']['output']>;
  /** Device manufacturer (e.g. garmin) */
  manufacturer?: Maybe<Scalars['String']['output']>;
  /** Friendly device model name (e.g. Edge 540 Solar) */
  model?: Maybe<Scalars['String']['output']>;
  /** Device firmware/software version (e.g. 31.30) */
  software_version?: Maybe<Scalars['String']['output']>;
};

/** Result payload returned when triggering an on-demand Garmin sync. */
export type GarminSyncTriggerResult = {
  __typename?: 'GarminSyncTriggerResult';
  /** True when a new sync run was accepted and triggered */
  accepted: Scalars['Boolean']['output'];
  /** Effective lookback value, when provided */
  lookback?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message from upstream sync service */
  message: Scalars['String']['output'];
  /** UTC timestamp when an already-running sync started */
  started_at?: Maybe<Scalars['String']['output']>;
  /** Sync trigger status (e.g. accepted, conflict, bad_request, error) */
  status: Scalars['String']['output'];
  /** UTC timestamp when sync was triggered */
  triggered_at?: Maybe<Scalars['String']['output']>;
  /** Effective sync window in hours */
  window_hours?: Maybe<Scalars['Int']['output']>;
  /** Window start timestamp computed by upstream service, when available */
  window_start?: Maybe<Scalars['String']['output']>;
};

/** Individual GPS track point within a Garmin activity. */
export type GarminTrackPoint = {
  __typename?: 'GarminTrackPoint';
  /** Parent Garmin activity identifier */
  activity_id: Scalars['String']['output'];
  /** Compact reverse-geocoded address summary, when geocoded */
  address?: Maybe<GeocodedAddressSummary>;
  /** Elevation above sea level in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Pedal/step cadence in RPM */
  cadence?: Maybe<Scalars['Int']['output']>;
  /** UTC timestamp when the record was inserted */
  created_at?: Maybe<Scalars['String']['output']>;
  /** Cumulative distance from activity start in km */
  distance_from_start_km?: Maybe<Scalars['Float']['output']>;
  /** Effort classification label */
  effort_level?: Maybe<Scalars['String']['output']>;
  /** Heart rate in beats per minute */
  heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Heart-rate zone index (1-5) */
  hr_zone?: Maybe<Scalars['Int']['output']>;
  /** Unique track point record identifier */
  id: Scalars['Int']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Respiration rate in breaths per minute */
  respiration_rate?: Maybe<Scalars['Int']['output']>;
  /** Instantaneous speed in km/h */
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  /** Road or terrain type */
  surface_type?: Maybe<Scalars['String']['output']>;
  /** Ambient temperature in degrees C */
  temperature_c?: Maybe<Scalars['Float']['output']>;
  /** UTC timestamp of the track point recording */
  timestamp: Scalars['DateTime']['output'];
};

/** Paginated list of Garmin track points. */
export type GarminTrackPointConnection = {
  __typename?: 'GarminTrackPointConnection';
  /** List of track point items in the current page */
  items: Array<GarminTrackPoint>;
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

/** Reverse-geocoded address components from Pelias. */
export type GeocodedAddress = {
  __typename?: 'GeocodedAddress';
  /** Pelias confidence score (0-1) */
  confidence?: Maybe<Scalars['Float']['output']>;
  /** Country name */
  country?: Maybe<Scalars['String']['output']>;
  /** Full formatted address label from Pelias */
  display_address?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when geocoding was performed */
  geocoded_at?: Maybe<Scalars['String']['output']>;
  /** House or building number */
  housenumber?: Maybe<Scalars['String']['output']>;
  /** City or town */
  locality?: Maybe<Scalars['String']['output']>;
  /** Neighbourhood name */
  neighbourhood?: Maybe<Scalars['String']['output']>;
  /** Postal or ZIP code */
  postalcode?: Maybe<Scalars['String']['output']>;
  /** State or province */
  region?: Maybe<Scalars['String']['output']>;
  /** Geocoding status: success, no_coverage, error, pending */
  status: Scalars['String']['output'];
  /** Street name */
  street?: Maybe<Scalars['String']['output']>;
};

/** Compact reverse-geocoded address summary embedded in track-point payloads. */
export type GeocodedAddressSummary = {
  __typename?: 'GeocodedAddressSummary';
  /** Pelias confidence score (0-1) */
  confidence?: Maybe<Scalars['Float']['output']>;
  /** Country name */
  country?: Maybe<Scalars['String']['output']>;
  /** Full formatted address label from Pelias */
  display_address?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when geocoding was performed */
  geocoded_at?: Maybe<Scalars['String']['output']>;
  /** House or building number */
  housenumber?: Maybe<Scalars['String']['output']>;
  /** City or town */
  locality?: Maybe<Scalars['String']['output']>;
  /** Neighbourhood name */
  neighbourhood?: Maybe<Scalars['String']['output']>;
  /** Postal or ZIP code */
  postalcode?: Maybe<Scalars['String']['output']>;
  /** State or province */
  region?: Maybe<Scalars['String']['output']>;
  /** Geocoding status: success, no_coverage, error, pending */
  status: Scalars['String']['output'];
  /** Street name */
  street?: Maybe<Scalars['String']['output']>;
  /** Role of this waypoint within a Garmin activity (start, end, waypoint). Null for OwnTracks records. */
  waypoint_kind?: Maybe<Scalars['String']['output']>;
};

/** Coverage statistics for a single geocoding source (owntracks or garmin). */
export type GeocodingSourceStatus = {
  __typename?: 'GeocodingSourceStatus';
  /** Number of records that failed geocoding */
  errors: Scalars['Int']['output'];
  /** Number of records outside Pelias coverage area */
  no_coverage: Scalars['Int']['output'];
  /** Number of records awaiting geocoding for this source */
  pending: Scalars['Int']['output'];
  /** Number of successfully geocoded records for this source */
  success: Scalars['Int']['output'];
  /** Total number of geocoded_addresses rows for this source */
  total: Scalars['Int']['output'];
};

/** Coverage statistics for geocoded location records. */
export type GeocodingStatus = {
  __typename?: 'GeocodingStatus';
  /** Per-source breakdown of geocoding coverage (owntracks, garmin) */
  by_source: GeocodingStatusBySource;
  /** Percentage of locations with a geocoded address */
  coverage_percent: Scalars['Float']['output'];
  /** Number of locations that failed geocoding */
  errors: Scalars['Int']['output'];
  /** Number of locations with a geocoded address (any status) */
  geocoded: Scalars['Int']['output'];
  /** Number of locations outside Pelias coverage area */
  no_coverage: Scalars['Int']['output'];
  /** Number of locations awaiting geocoding */
  pending: Scalars['Int']['output'];
  /** Number of successfully geocoded locations */
  success: Scalars['Int']['output'];
  /** Total number of OwnTracks location records */
  total_locations: Scalars['Int']['output'];
};

/** Per-source breakdown of geocoding coverage. */
export type GeocodingStatusBySource = {
  __typename?: 'GeocodingStatusBySource';
  /** Coverage stats for Garmin rows */
  garmin: GeocodingSourceStatus;
  /** Number of Garmin activities that have at least one address row */
  garmin_activities_geocoded: Scalars['Int']['output'];
  /** Total number of Garmin activities (denominator for activity-level coverage) */
  garmin_activities_total: Scalars['Int']['output'];
  /** Percentage of Garmin activities with at least one geocoded address */
  garmin_coverage_percent: Scalars['Float']['output'];
  /** Coverage stats for OwnTracks rows */
  owntracks: GeocodingSourceStatus;
};

/** Result of triggering a batch geocoding operation. */
export type GeocodingTriggerResult = {
  __typename?: 'GeocodingTriggerResult';
  /** Number of records processed in this batch */
  processed: Scalars['Int']['output'];
  /** Number of records still awaiting geocoding */
  remaining: Scalars['Int']['output'];
  /** Number of records skipped via proximity deduplication */
  skipped_dedup: Scalars['Int']['output'];
};

/** Service health status. */
export type HealthStatus = {
  __typename?: 'HealthStatus';
  /** Service health status (healthy or unhealthy) */
  status: Scalars['String']['output'];
  /** Application version from VERSION file */
  version: Scalars['String']['output'];
};

/** GPS location recorded by the OwnTracks mobile app. */
export type Location = {
  __typename?: 'Location';
  /** Horizontal accuracy of the GPS fix in meters */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Altitude above sea level in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Device battery level as a percentage (0-100) */
  battery?: Maybe<Scalars['Int']['output']>;
  /** Battery charging state (0=unknown, 1=unplugged, 2=charging, 3=full) */
  battery_status?: Maybe<Scalars['Int']['output']>;
  /** Network connection type (w=WiFi, m=mobile) */
  connection_type?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when the record was inserted into the database */
  created_at?: Maybe<Scalars['String']['output']>;
  /** OwnTracks device identifier (e.g. iphone_stuart) */
  device_id: Scalars['String']['output'];
  /** Short formatted address from reverse geocoding */
  display_address?: Maybe<Scalars['String']['output']>;
  /** Unique location record identifier */
  id: Scalars['Int']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Two-character tracker ID set in the OwnTracks app */
  tid?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when the device recorded the location */
  timestamp: Scalars['DateTime']['output'];
  /** What triggered this location report (p=ping, c=circular, t=timer) */
  trigger?: Maybe<Scalars['String']['output']>;
  /** Device velocity in km/h at time of report */
  velocity?: Maybe<Scalars['Float']['output']>;
};

/** Paginated list of OwnTracks location records. */
export type LocationConnection = {
  __typename?: 'LocationConnection';
  /** List of location items in the current page */
  items: Array<Location>;
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

/** Aggregate location count with optional filter context. */
export type LocationCount = {
  __typename?: 'LocationCount';
  /** Total number of location records matching the filter */
  count: Scalars['Int']['output'];
  /** Date filter applied (YYYY-MM-DD), if any */
  date?: Maybe<Scalars['String']['output']>;
  /** Device ID filter applied, if any */
  device_id?: Maybe<Scalars['String']['output']>;
};

/** Earliest and latest timestamps in the locations table. */
export type LocationDateRange = {
  __typename?: 'LocationDateRange';
  /** Latest location timestamp (ISO 8601) */
  max_date: Scalars['DateTime']['output'];
  /** Earliest location timestamp (ISO 8601) */
  min_date: Scalars['DateTime']['output'];
};

/** Full location detail including the original OwnTracks JSON payload. */
export type LocationDetail = {
  __typename?: 'LocationDetail';
  /** Horizontal accuracy of the GPS fix in meters */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Full reverse-geocoded address components from Pelias */
  address?: Maybe<GeocodedAddress>;
  /** Altitude above sea level in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Device battery level as a percentage (0-100) */
  battery?: Maybe<Scalars['Int']['output']>;
  /** Battery charging state (0=unknown, 1=unplugged, 2=charging, 3=full) */
  battery_status?: Maybe<Scalars['Int']['output']>;
  /** Network connection type (w=WiFi, m=mobile) */
  connection_type?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when the record was inserted into the database */
  created_at?: Maybe<Scalars['String']['output']>;
  /** OwnTracks device identifier (e.g. iphone_stuart) */
  device_id: Scalars['String']['output'];
  /** Unique location record identifier */
  id: Scalars['Int']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Original OwnTracks JSON payload as received from the MQTT broker */
  raw_payload?: Maybe<Scalars['JSON']['output']>;
  /** Two-character tracker ID set in the OwnTracks app */
  tid?: Maybe<Scalars['String']['output']>;
  /** UTC timestamp when the device recorded the location */
  timestamp: Scalars['DateTime']['output'];
  /** What triggered this location report (p=ping, c=circular, t=timer) */
  trigger?: Maybe<Scalars['String']['output']>;
  /** Device velocity in km/h at time of report */
  velocity?: Maybe<Scalars['Float']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Trigger an on-demand Garmin sync in the upstream API. */
  triggerGarminSync: GarminSyncTriggerResult;
  /** Trigger batch reverse-geocoding of un-geocoded location records. */
  triggerGeocoding: GeocodingTriggerResult;
};


export type MutationTriggerGarminSyncArgs = {
  lookback?: InputMaybe<Scalars['Int']['input']>;
  window_hours?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationTriggerGeocodingArgs = {
  batch_size?: InputMaybe<Scalars['Int']['input']>;
  retry_failed?: InputMaybe<Scalars['Boolean']['input']>;
};

/** GPS point found within a spatial proximity search. */
export type NearbyPoint = {
  __typename?: 'NearbyPoint';
  /** Distance from the search center point in meters */
  distance_meters: Scalars['Float']['output'];
  /** Record identifier in the source table */
  id: Scalars['Int']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Data source: 'owntracks' or 'garmin' */
  source: Scalars['String']['output'];
  /** UTC timestamp of the GPS recording */
  timestamp: Scalars['DateTime']['output'];
};

/** Pagination metadata for paginated list responses. */
export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Calculate the geodesic distance between two geographic points. */
  calculateDistance: DistanceResult;
  /** Retrieve daily activity summaries combining OwnTracks and Garmin data. */
  dailySummary: DailySummaryConnection;
  /** Get the earliest and latest activity dates available in the daily activity summary view. */
  dailySummaryDateRange: DailySummaryDateRange;
  /** List all distinct OwnTracks device identifiers. */
  devices: Array<DeviceInfo>;
  /** Retrieve a paginated list of Garmin activities. */
  garminActivities: GarminActivityConnection;
  /** Retrieve a single Garmin activity by its ID. */
  garminActivity?: Maybe<GarminActivity>;
  /** Retrieve all reverse-geocoded addresses for a Garmin activity (start, mid-route waypoints, and end). */
  garminActivityAddresses: Array<GarminActivityAddress>;
  /** Aggregate Garmin activity totals grouped by week, month, or year. */
  garminActivityTotals: Array<GarminActivityTotal>;
  /** Retrieve chart-optimised track points for a Garmin activity. */
  garminChartData: Array<GarminChartPoint>;
  /** Get the earliest and latest Garmin activity timestamps. */
  garminDateRange: GarminDateRange;
  /** List all distinct sport types with activity counts. */
  garminSports: Array<SportInfo>;
  /** Retrieve paginated GPS track points for a Garmin activity. */
  garminTrackPoints: GarminTrackPointConnection;
  /** Get geocoding coverage statistics. */
  geocodingStatus: GeocodingStatus;
  /** Get service health status. */
  health: HealthStatus;
  /** Retrieve a single location by its ID, including raw payload. */
  location?: Maybe<LocationDetail>;
  /** Get aggregate count of location records with optional filters. */
  locationCount: LocationCount;
  /** Get the earliest and latest location timestamps. */
  locationDateRange: LocationDateRange;
  /** Retrieve a paginated list of OwnTracks location records. */
  locations: LocationConnection;
  /** Find GPS points within a radius of a geographic coordinate. */
  nearbyPoints: Array<NearbyPoint>;
  /** Get service readiness status including database connectivity. */
  ready: ReadyStatus;
  /** Retrieve a single reference location by its ID. */
  referenceLocation?: Maybe<ReferenceLocation>;
  /** List all named reference locations. */
  referenceLocations: Array<ReferenceLocation>;
  /** Retrieve a paginated list of unified GPS points from all sources. */
  unifiedGps: UnifiedGpsConnection;
  /** Find GPS points within a named reference location's geofence. */
  withinReference: WithinReferenceResult;
};


export type QueryCalculateDistanceArgs = {
  from_lat: Scalars['Float']['input'];
  from_lon: Scalars['Float']['input'];
  to_lat: Scalars['Float']['input'];
  to_lon: Scalars['Float']['input'];
};


export type QueryDailySummaryArgs = {
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGarminActivitiesArgs = {
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  sort?: InputMaybe<Scalars['String']['input']>;
  sport?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGarminActivityArgs = {
  activity_id: Scalars['String']['input'];
};


export type QueryGarminActivityAddressesArgs = {
  activity_id: Scalars['String']['input'];
};


export type QueryGarminActivityTotalsArgs = {
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  period: Scalars['String']['input'];
  sport?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGarminChartDataArgs = {
  activity_id: Scalars['String']['input'];
};


export type QueryGarminTrackPointsArgs = {
  activity_id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  simplify?: InputMaybe<Scalars['Float']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLocationArgs = {
  id: Scalars['Int']['input'];
};


export type QueryLocationCountArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
  device_id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLocationsArgs = {
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  device_id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNearbyPointsArgs = {
  lat: Scalars['Float']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  lon: Scalars['Float']['input'];
  radius_meters?: InputMaybe<Scalars['Float']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReferenceLocationArgs = {
  id: Scalars['Int']['input'];
};


export type QueryUnifiedGpsArgs = {
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  deduplicate?: InputMaybe<Scalars['Boolean']['input']>;
  exclude_stationary?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWithinReferenceArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};

/** Service readiness status including database connectivity. */
export type ReadyStatus = {
  __typename?: 'ReadyStatus';
  /** Database connection status */
  database?: Maybe<Scalars['String']['output']>;
  /** Service readiness status */
  status: Scalars['String']['output'];
  /** Application version from VERSION file */
  version?: Maybe<Scalars['String']['output']>;
};

/** Named geographic reference point used for spatial queries (e.g. home, office). */
export type ReferenceLocation = {
  __typename?: 'ReferenceLocation';
  /** UTC timestamp when the record was created */
  created_at?: Maybe<Scalars['String']['output']>;
  /** Optional human-readable description of the location */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique reference location identifier */
  id: Scalars['Int']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Short, unique name for the location (e.g. home, office) */
  name: Scalars['String']['output'];
  /** Geofence radius in meters for proximity queries */
  radius_meters: Scalars['Float']['output'];
  /** UTC timestamp when the record was last updated */
  updated_at?: Maybe<Scalars['String']['output']>;
};

/** Sort direction for query results. */
export type SortOrder =
  /** Ascending order (oldest first, A-Z) */
  | 'asc'
  /** Descending order (newest first, Z-A) */
  | 'desc';

/** Sport type with its activity count. */
export type SportInfo = {
  __typename?: 'SportInfo';
  /** Number of activities for this sport */
  activity_count: Scalars['Int']['output'];
  /** Sport type name (e.g. cycling, running) */
  sport: Scalars['String']['output'];
};

/** Paginated list of unified GPS data points. */
export type UnifiedGpsConnection = {
  __typename?: 'UnifiedGpsConnection';
  /** List of unified GPS items in the current page */
  items: Array<UnifiedGpsPoint>;
  /** Maximum number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped from the start */
  offset: Scalars['Int']['output'];
  /** Total number of items matching the query */
  total: Scalars['Int']['output'];
};

/** Single GPS data point from the unified view combining OwnTracks and Garmin sources. */
export type UnifiedGpsPoint = {
  __typename?: 'UnifiedGpsPoint';
  /** Horizontal GPS accuracy in meters (OwnTracks only) */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Device battery percentage (OwnTracks only) */
  battery?: Maybe<Scalars['Int']['output']>;
  /** UTC timestamp when the record was inserted */
  created_at?: Maybe<Scalars['String']['output']>;
  /** Heart rate in BPM (Garmin only) */
  heart_rate?: Maybe<Scalars['Int']['output']>;
  /** Device or activity identifier from the source */
  identifier: Scalars['String']['output'];
  /** GPS latitude in decimal degrees (WGS 84) */
  latitude: Scalars['Float']['output'];
  /** GPS longitude in decimal degrees (WGS 84) */
  longitude: Scalars['Float']['output'];
  /** Data source: 'owntracks' or 'garmin' */
  source: Scalars['String']['output'];
  /** Instantaneous speed in km/h (Garmin only) */
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  /** UTC timestamp of the GPS recording */
  timestamp: Scalars['DateTime']['output'];
};

/** GPS points found within a named reference location's geofence radius. */
export type WithinReferenceResult = {
  __typename?: 'WithinReferenceResult';
  /** GPS points within the radius, sorted by distance */
  points: Array<NearbyPoint>;
  /** Geofence radius used for the search in meters */
  radius_meters: Scalars['Float']['output'];
  /** Name of the reference location searched */
  reference_name: Scalars['String']['output'];
  /** Number of GPS points found within the radius */
  total_points: Scalars['Int']['output'];
};

/** Sort direction for query results. */

export type GarminActivitiesQueryVariables = Exact<{
  sport?: string | null | undefined;
  date_from?: string | null | undefined;
  date_to?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: string | null | undefined;
  order?: SortOrder | null | undefined;
}>;


export type GarminActivitiesQuery = { garminActivities: { total: number, limit: number, offset: number, items: Array<{ activity_id: string, sport: string, sub_sport: string | null, start_time: string | null, end_time: string | null, distance_km: number | null, duration_seconds: number | null, avg_heart_rate: number | null, max_heart_rate: number | null, avg_cadence: number | null, max_cadence: number | null, total_strokes: number | null, calories: number | null, avg_speed_kmh: number | null, max_speed_kmh: number | null, total_ascent_m: number | null, total_descent_m: number | null, total_distance: number | null, avg_pace: number | null, device_manufacturer: string | null, created_at: string | null, uploaded_at: string | null, track_point_count: number | null, device: { device_id: number | null, manufacturer: string | null, garmin_product: number | null, model: string | null } | null }> } };

export type GarminActivityQueryVariables = Exact<{
  activity_id: string;
}>;


export type GarminActivityQuery = { garminActivity: { activity_id: string, sport: string, sub_sport: string | null, start_time: string | null, end_time: string | null, distance_km: number | null, duration_seconds: number | null, avg_heart_rate: number | null, max_heart_rate: number | null, hr_available: boolean, min_heart_rate: number | null, aerobic_training_effect: number | null, anaerobic_training_effect: number | null, exercise_load: number | null, avg_respiration_rate: number | null, min_respiration_rate: number | null, max_respiration_rate: number | null, sweat_loss_ml: number | null, moderate_intensity_minutes: number | null, vigorous_intensity_minutes: number | null, total_intensity_minutes: number | null, paved_distance_km: number | null, unpaved_distance_km: number | null, avg_cadence: number | null, max_cadence: number | null, total_strokes: number | null, calories: number | null, avg_speed_kmh: number | null, max_speed_kmh: number | null, total_ascent_m: number | null, total_descent_m: number | null, total_distance: number | null, avg_pace: number | null, device_manufacturer: string | null, avg_temperature_c: number | null, min_temperature_c: number | null, max_temperature_c: number | null, total_elapsed_time: number | null, total_timer_time: number | null, created_at: string | null, uploaded_at: string | null, track_point_count: number | null, device: { device_id: number | null, manufacturer: string | null, garmin_product: number | null, model: string | null, software_version: string | null } | null } | null };

export type GarminTrackPointsQueryVariables = Exact<{
  activity_id: string;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: string | null | undefined;
  order?: SortOrder | null | undefined;
  simplify?: number | null | undefined;
}>;


export type GarminTrackPointsQuery = { garminTrackPoints: { total: number, limit: number, offset: number, items: Array<{ id: number, activity_id: string, latitude: number, longitude: number, timestamp: string, altitude: number | null, distance_from_start_km: number | null, speed_kmh: number | null, heart_rate: number | null, cadence: number | null, temperature_c: number | null, created_at: string | null }> } };

export type GarminDateRangeQueryVariables = Exact<{ [key: string]: never; }>;


export type GarminDateRangeQuery = { garminDateRange: { min_date: string, max_date: string } };

export type GarminSportsQueryVariables = Exact<{ [key: string]: never; }>;


export type GarminSportsQuery = { garminSports: Array<{ sport: string, activity_count: number }> };

export type GarminActivityTotalsQueryVariables = Exact<{
  period: string;
  date_from?: string | null | undefined;
  date_to?: string | null | undefined;
  sport?: string | null | undefined;
}>;


export type GarminActivityTotalsQuery = { garminActivityTotals: Array<{ period_start: string, activity_count: number, total_distance_km: number | null, total_duration_seconds: number | null, total_ascent_m: number | null, total_calories: number | null }> };

export type GarminChartDataQueryVariables = Exact<{
  activity_id: string;
}>;


export type GarminChartDataQuery = { garminChartData: Array<{ timestamp: string, altitude: number | null, distance_from_start_km: number | null, speed_kmh: number | null, heart_rate: number | null, hr_zone: number | null, respiration_rate: number | null, cadence: number | null, temperature_c: number | null, latitude: number, longitude: number }> };

export type TriggerGarminSyncMutationVariables = Exact<{
  window_hours?: number | null | undefined;
  lookback?: number | null | undefined;
}>;


export type TriggerGarminSyncMutation = { triggerGarminSync: { status: string, message: string, accepted: boolean, triggered_at: string | null, started_at: string | null, window_hours: number | null, window_start: string | null, lookback: number | null } };

export type GarminExportPointsQueryVariables = Exact<{
  activity_id: string;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type GarminExportPointsQuery = { garminTrackPoints: { total: number, items: Array<{ id: number, activity_id: string, timestamp: string, latitude: number, longitude: number, altitude: number | null, distance_from_start_km: number | null, speed_kmh: number | null, heart_rate: number | null, hr_zone: number | null, respiration_rate: number | null, cadence: number | null, temperature_c: number | null, surface_type: string | null, effort_level: string | null, created_at: string | null, address: { display_address: string | null, street: string | null, housenumber: string | null, neighbourhood: string | null, locality: string | null, region: string | null, country: string | null, postalcode: string | null, confidence: number | null, waypoint_kind: string | null, status: string, geocoded_at: string | null } | null }> } };

export type GeocodingStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GeocodingStatusQuery = { geocodingStatus: { total_locations: number, geocoded: number, success: number, pending: number, no_coverage: number, errors: number, coverage_percent: number } };

export type TriggerGeocodingMutationVariables = Exact<{
  batch_size?: number | null | undefined;
  retry_failed?: boolean | null | undefined;
}>;


export type TriggerGeocodingMutation = { triggerGeocoding: { processed: number, remaining: number, skipped_dedup: number } };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { health: { status: string, version: string } };

export type ReadyQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadyQuery = { ready: { status: string, database: string | null, version: string | null } };

export type LocationsQueryVariables = Exact<{
  device_id?: string | null | undefined;
  date_from?: string | null | undefined;
  date_to?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: string | null | undefined;
  order?: SortOrder | null | undefined;
}>;


export type LocationsQuery = { locations: { total: number, limit: number, offset: number, items: Array<{ id: number, device_id: string, tid: string | null, latitude: number, longitude: number, accuracy: number | null, altitude: number | null, velocity: number | null, battery: number | null, battery_status: number | null, connection_type: string | null, trigger: string | null, timestamp: string, created_at: string | null, display_address: string | null }> } };

export type LocationDetailQueryVariables = Exact<{
  id: number;
}>;


export type LocationDetailQuery = { location: { id: number, device_id: string, tid: string | null, latitude: number, longitude: number, accuracy: number | null, altitude: number | null, velocity: number | null, battery: number | null, battery_status: number | null, connection_type: string | null, trigger: string | null, timestamp: string, created_at: string | null, raw_payload: Record<string, unknown> | null, address: { display_address: string | null, street: string | null, housenumber: string | null, neighbourhood: string | null, locality: string | null, region: string | null, country: string | null, postalcode: string | null, confidence: number | null, status: string, geocoded_at: string | null } | null } | null };

export type DevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesQuery = { devices: Array<{ device_id: string }> };

export type LocationCountQueryVariables = Exact<{
  date?: string | null | undefined;
  device_id?: string | null | undefined;
}>;


export type LocationCountQuery = { locationCount: { count: number, date: string | null, device_id: string | null } };

export type LocationDateRangeQueryVariables = Exact<{ [key: string]: never; }>;


export type LocationDateRangeQuery = { locationDateRange: { min_date: string, max_date: string } };

export type ReferenceLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ReferenceLocationsQuery = { referenceLocations: Array<{ id: number, name: string, latitude: number, longitude: number, radius_meters: number, description: string | null, created_at: string | null, updated_at: string | null }> };

export type ReferenceLocationQueryVariables = Exact<{
  id: number;
}>;


export type ReferenceLocationQuery = { referenceLocation: { id: number, name: string, latitude: number, longitude: number, radius_meters: number, description: string | null, created_at: string | null, updated_at: string | null } | null };

export type NearbyPointsQueryVariables = Exact<{
  lat: number;
  lon: number;
  radius_meters?: number | null | undefined;
  source?: string | null | undefined;
  limit?: number | null | undefined;
}>;


export type NearbyPointsQuery = { nearbyPoints: Array<{ source: string, id: number, latitude: number, longitude: number, distance_meters: number, timestamp: string }> };

export type CalculateDistanceQueryVariables = Exact<{
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
}>;


export type CalculateDistanceQuery = { calculateDistance: { distance_meters: number, from_lat: number, from_lon: number, to_lat: number, to_lon: number } };

export type WithinReferenceQueryVariables = Exact<{
  name: string;
  source?: string | null | undefined;
  limit?: number | null | undefined;
}>;


export type WithinReferenceQuery = { withinReference: { reference_name: string, radius_meters: number, total_points: number, points: Array<{ source: string, id: number, latitude: number, longitude: number, distance_meters: number, timestamp: string }> } };

export type UnifiedGpsQueryVariables = Exact<{
  source?: string | null | undefined;
  date_from?: string | null | undefined;
  date_to?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  order?: SortOrder | null | undefined;
  exclude_stationary?: boolean | null | undefined;
  deduplicate?: boolean | null | undefined;
}>;


export type UnifiedGpsQuery = { unifiedGps: { total: number, limit: number, offset: number, items: Array<{ source: string, identifier: string, latitude: number, longitude: number, timestamp: string, accuracy: number | null, battery: number | null, speed_kmh: number | null, heart_rate: number | null, created_at: string | null }> } };

export type DailySummaryQueryVariables = Exact<{
  date_from?: string | null | undefined;
  date_to?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type DailySummaryQuery = { dailySummary: { total: number, limit: number, offset: number, items: Array<{ activity_date: string | null, owntracks_device: string | null, owntracks_points: number | null, min_battery: number | null, max_battery: number | null, avg_accuracy: number | null, garmin_sport: string | null, garmin_activities: number | null, total_distance_km: number | null, total_duration_seconds: number | null, avg_heart_rate: number | null, total_calories: number | null }> } };

export type DailySummaryDateRangeQueryVariables = Exact<{ [key: string]: never; }>;


export type DailySummaryDateRangeQuery = { dailySummaryDateRange: { min_date: string, max_date: string } };


export const GarminActivitiesDocument = gql`
    query GarminActivities($sport: String, $date_from: String, $date_to: String, $limit: Int, $offset: Int, $sort: String, $order: SortOrder) {
  garminActivities(
    sport: $sport
    date_from: $date_from
    date_to: $date_to
    limit: $limit
    offset: $offset
    sort: $sort
    order: $order
  ) {
    items {
      activity_id
      sport
      sub_sport
      start_time
      end_time
      distance_km
      duration_seconds
      avg_heart_rate
      max_heart_rate
      avg_cadence
      max_cadence
      total_strokes
      calories
      avg_speed_kmh
      max_speed_kmh
      total_ascent_m
      total_descent_m
      total_distance
      avg_pace
      device_manufacturer
      device {
        device_id
        manufacturer
        garmin_product
        model
      }
      created_at
      uploaded_at
      track_point_count
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useGarminActivitiesQuery__
 *
 * To run a query within a React component, call `useGarminActivitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminActivitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminActivitiesQuery({
 *   variables: {
 *      sport: // value for 'sport'
 *      date_from: // value for 'date_from'
 *      date_to: // value for 'date_to'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      sort: // value for 'sort'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useGarminActivitiesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GarminActivitiesQuery, GarminActivitiesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminActivitiesQuery, GarminActivitiesQueryVariables>(GarminActivitiesDocument, options);
      }
export function useGarminActivitiesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminActivitiesQuery, GarminActivitiesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminActivitiesQuery, GarminActivitiesQueryVariables>(GarminActivitiesDocument, options);
        }
// @ts-ignore
export function useGarminActivitiesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminActivitiesQuery, GarminActivitiesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivitiesQuery, GarminActivitiesQueryVariables>;
export function useGarminActivitiesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivitiesQuery, GarminActivitiesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivitiesQuery | undefined, GarminActivitiesQueryVariables>;
export function useGarminActivitiesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivitiesQuery, GarminActivitiesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminActivitiesQuery, GarminActivitiesQueryVariables>(GarminActivitiesDocument, options);
        }
export type GarminActivitiesQueryHookResult = ReturnType<typeof useGarminActivitiesQuery>;
export type GarminActivitiesLazyQueryHookResult = ReturnType<typeof useGarminActivitiesLazyQuery>;
export type GarminActivitiesSuspenseQueryHookResult = ReturnType<typeof useGarminActivitiesSuspenseQuery>;
export type GarminActivitiesQueryResult = ApolloReactCommon.QueryResult<GarminActivitiesQuery, GarminActivitiesQueryVariables>;
export const GarminActivityDocument = gql`
    query GarminActivity($activity_id: String!) {
  garminActivity(activity_id: $activity_id) {
    activity_id
    sport
    sub_sport
    start_time
    end_time
    distance_km
    duration_seconds
    avg_heart_rate
    max_heart_rate
    hr_available
    min_heart_rate
    aerobic_training_effect
    anaerobic_training_effect
    exercise_load
    avg_respiration_rate
    min_respiration_rate
    max_respiration_rate
    sweat_loss_ml
    moderate_intensity_minutes
    vigorous_intensity_minutes
    total_intensity_minutes
    paved_distance_km
    unpaved_distance_km
    avg_cadence
    max_cadence
    total_strokes
    calories
    avg_speed_kmh
    max_speed_kmh
    total_ascent_m
    total_descent_m
    total_distance
    avg_pace
    device_manufacturer
    device {
      device_id
      manufacturer
      garmin_product
      model
      software_version
    }
    avg_temperature_c
    min_temperature_c
    max_temperature_c
    total_elapsed_time
    total_timer_time
    created_at
    uploaded_at
    track_point_count
  }
}
    `;

/**
 * __useGarminActivityQuery__
 *
 * To run a query within a React component, call `useGarminActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminActivityQuery({
 *   variables: {
 *      activity_id: // value for 'activity_id'
 *   },
 * });
 */
export function useGarminActivityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GarminActivityQuery, GarminActivityQueryVariables> & ({ variables: GarminActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminActivityQuery, GarminActivityQueryVariables>(GarminActivityDocument, options);
      }
export function useGarminActivityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminActivityQuery, GarminActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminActivityQuery, GarminActivityQueryVariables>(GarminActivityDocument, options);
        }
// @ts-ignore
export function useGarminActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityQuery, GarminActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivityQuery, GarminActivityQueryVariables>;
export function useGarminActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityQuery, GarminActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivityQuery | undefined, GarminActivityQueryVariables>;
export function useGarminActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityQuery, GarminActivityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminActivityQuery, GarminActivityQueryVariables>(GarminActivityDocument, options);
        }
export type GarminActivityQueryHookResult = ReturnType<typeof useGarminActivityQuery>;
export type GarminActivityLazyQueryHookResult = ReturnType<typeof useGarminActivityLazyQuery>;
export type GarminActivitySuspenseQueryHookResult = ReturnType<typeof useGarminActivitySuspenseQuery>;
export type GarminActivityQueryResult = ApolloReactCommon.QueryResult<GarminActivityQuery, GarminActivityQueryVariables>;
export const GarminTrackPointsDocument = gql`
    query GarminTrackPoints($activity_id: String!, $limit: Int, $offset: Int, $sort: String, $order: SortOrder, $simplify: Float) {
  garminTrackPoints(
    activity_id: $activity_id
    limit: $limit
    offset: $offset
    sort: $sort
    order: $order
    simplify: $simplify
  ) {
    items {
      id
      activity_id
      latitude
      longitude
      timestamp
      altitude
      distance_from_start_km
      speed_kmh
      heart_rate
      cadence
      temperature_c
      created_at
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useGarminTrackPointsQuery__
 *
 * To run a query within a React component, call `useGarminTrackPointsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminTrackPointsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminTrackPointsQuery({
 *   variables: {
 *      activity_id: // value for 'activity_id'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      sort: // value for 'sort'
 *      order: // value for 'order'
 *      simplify: // value for 'simplify'
 *   },
 * });
 */
export function useGarminTrackPointsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GarminTrackPointsQuery, GarminTrackPointsQueryVariables> & ({ variables: GarminTrackPointsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>(GarminTrackPointsDocument, options);
      }
export function useGarminTrackPointsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>(GarminTrackPointsDocument, options);
        }
// @ts-ignore
export function useGarminTrackPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>;
export function useGarminTrackPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminTrackPointsQuery | undefined, GarminTrackPointsQueryVariables>;
export function useGarminTrackPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>(GarminTrackPointsDocument, options);
        }
export type GarminTrackPointsQueryHookResult = ReturnType<typeof useGarminTrackPointsQuery>;
export type GarminTrackPointsLazyQueryHookResult = ReturnType<typeof useGarminTrackPointsLazyQuery>;
export type GarminTrackPointsSuspenseQueryHookResult = ReturnType<typeof useGarminTrackPointsSuspenseQuery>;
export type GarminTrackPointsQueryResult = ApolloReactCommon.QueryResult<GarminTrackPointsQuery, GarminTrackPointsQueryVariables>;
export const GarminDateRangeDocument = gql`
    query GarminDateRange {
  garminDateRange {
    min_date
    max_date
  }
}
    `;

/**
 * __useGarminDateRangeQuery__
 *
 * To run a query within a React component, call `useGarminDateRangeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminDateRangeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminDateRangeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGarminDateRangeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GarminDateRangeQuery, GarminDateRangeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminDateRangeQuery, GarminDateRangeQueryVariables>(GarminDateRangeDocument, options);
      }
export function useGarminDateRangeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminDateRangeQuery, GarminDateRangeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminDateRangeQuery, GarminDateRangeQueryVariables>(GarminDateRangeDocument, options);
        }
// @ts-ignore
export function useGarminDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminDateRangeQuery, GarminDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminDateRangeQuery, GarminDateRangeQueryVariables>;
export function useGarminDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminDateRangeQuery, GarminDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminDateRangeQuery | undefined, GarminDateRangeQueryVariables>;
export function useGarminDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminDateRangeQuery, GarminDateRangeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminDateRangeQuery, GarminDateRangeQueryVariables>(GarminDateRangeDocument, options);
        }
export type GarminDateRangeQueryHookResult = ReturnType<typeof useGarminDateRangeQuery>;
export type GarminDateRangeLazyQueryHookResult = ReturnType<typeof useGarminDateRangeLazyQuery>;
export type GarminDateRangeSuspenseQueryHookResult = ReturnType<typeof useGarminDateRangeSuspenseQuery>;
export type GarminDateRangeQueryResult = ApolloReactCommon.QueryResult<GarminDateRangeQuery, GarminDateRangeQueryVariables>;
export const GarminSportsDocument = gql`
    query GarminSports {
  garminSports {
    sport
    activity_count
  }
}
    `;

/**
 * __useGarminSportsQuery__
 *
 * To run a query within a React component, call `useGarminSportsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminSportsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminSportsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGarminSportsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GarminSportsQuery, GarminSportsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminSportsQuery, GarminSportsQueryVariables>(GarminSportsDocument, options);
      }
export function useGarminSportsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminSportsQuery, GarminSportsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminSportsQuery, GarminSportsQueryVariables>(GarminSportsDocument, options);
        }
// @ts-ignore
export function useGarminSportsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminSportsQuery, GarminSportsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminSportsQuery, GarminSportsQueryVariables>;
export function useGarminSportsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminSportsQuery, GarminSportsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminSportsQuery | undefined, GarminSportsQueryVariables>;
export function useGarminSportsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminSportsQuery, GarminSportsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminSportsQuery, GarminSportsQueryVariables>(GarminSportsDocument, options);
        }
export type GarminSportsQueryHookResult = ReturnType<typeof useGarminSportsQuery>;
export type GarminSportsLazyQueryHookResult = ReturnType<typeof useGarminSportsLazyQuery>;
export type GarminSportsSuspenseQueryHookResult = ReturnType<typeof useGarminSportsSuspenseQuery>;
export type GarminSportsQueryResult = ApolloReactCommon.QueryResult<GarminSportsQuery, GarminSportsQueryVariables>;
export const GarminActivityTotalsDocument = gql`
    query GarminActivityTotals($period: String!, $date_from: String, $date_to: String, $sport: String) {
  garminActivityTotals(
    period: $period
    date_from: $date_from
    date_to: $date_to
    sport: $sport
  ) {
    period_start
    activity_count
    total_distance_km
    total_duration_seconds
    total_ascent_m
    total_calories
  }
}
    `;

/**
 * __useGarminActivityTotalsQuery__
 *
 * To run a query within a React component, call `useGarminActivityTotalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminActivityTotalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminActivityTotalsQuery({
 *   variables: {
 *      period: // value for 'period'
 *      date_from: // value for 'date_from'
 *      date_to: // value for 'date_to'
 *      sport: // value for 'sport'
 *   },
 * });
 */
export function useGarminActivityTotalsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables> & ({ variables: GarminActivityTotalsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>(GarminActivityTotalsDocument, options);
      }
export function useGarminActivityTotalsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>(GarminActivityTotalsDocument, options);
        }
// @ts-ignore
export function useGarminActivityTotalsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>;
export function useGarminActivityTotalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminActivityTotalsQuery | undefined, GarminActivityTotalsQueryVariables>;
export function useGarminActivityTotalsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>(GarminActivityTotalsDocument, options);
        }
export type GarminActivityTotalsQueryHookResult = ReturnType<typeof useGarminActivityTotalsQuery>;
export type GarminActivityTotalsLazyQueryHookResult = ReturnType<typeof useGarminActivityTotalsLazyQuery>;
export type GarminActivityTotalsSuspenseQueryHookResult = ReturnType<typeof useGarminActivityTotalsSuspenseQuery>;
export type GarminActivityTotalsQueryResult = ApolloReactCommon.QueryResult<GarminActivityTotalsQuery, GarminActivityTotalsQueryVariables>;
export const GarminChartDataDocument = gql`
    query GarminChartData($activity_id: String!) {
  garminChartData(activity_id: $activity_id) {
    timestamp
    altitude
    distance_from_start_km
    speed_kmh
    heart_rate
    hr_zone
    respiration_rate
    cadence
    temperature_c
    latitude
    longitude
  }
}
    `;

/**
 * __useGarminChartDataQuery__
 *
 * To run a query within a React component, call `useGarminChartDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminChartDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminChartDataQuery({
 *   variables: {
 *      activity_id: // value for 'activity_id'
 *   },
 * });
 */
export function useGarminChartDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GarminChartDataQuery, GarminChartDataQueryVariables> & ({ variables: GarminChartDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminChartDataQuery, GarminChartDataQueryVariables>(GarminChartDataDocument, options);
      }
export function useGarminChartDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminChartDataQuery, GarminChartDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminChartDataQuery, GarminChartDataQueryVariables>(GarminChartDataDocument, options);
        }
// @ts-ignore
export function useGarminChartDataSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminChartDataQuery, GarminChartDataQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminChartDataQuery, GarminChartDataQueryVariables>;
export function useGarminChartDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminChartDataQuery, GarminChartDataQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminChartDataQuery | undefined, GarminChartDataQueryVariables>;
export function useGarminChartDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminChartDataQuery, GarminChartDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminChartDataQuery, GarminChartDataQueryVariables>(GarminChartDataDocument, options);
        }
export type GarminChartDataQueryHookResult = ReturnType<typeof useGarminChartDataQuery>;
export type GarminChartDataLazyQueryHookResult = ReturnType<typeof useGarminChartDataLazyQuery>;
export type GarminChartDataSuspenseQueryHookResult = ReturnType<typeof useGarminChartDataSuspenseQuery>;
export type GarminChartDataQueryResult = ApolloReactCommon.QueryResult<GarminChartDataQuery, GarminChartDataQueryVariables>;
export const TriggerGarminSyncDocument = gql`
    mutation TriggerGarminSync($window_hours: Int, $lookback: Int) {
  triggerGarminSync(window_hours: $window_hours, lookback: $lookback) {
    status
    message
    accepted
    triggered_at
    started_at
    window_hours
    window_start
    lookback
  }
}
    `;
export type TriggerGarminSyncMutationFn = ApolloReactCommon.MutationFunction<TriggerGarminSyncMutation, TriggerGarminSyncMutationVariables>;

/**
 * __useTriggerGarminSyncMutation__
 *
 * To run a mutation, you first call `useTriggerGarminSyncMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTriggerGarminSyncMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [triggerGarminSyncMutation, { data, loading, error }] = useTriggerGarminSyncMutation({
 *   variables: {
 *      window_hours: // value for 'window_hours'
 *      lookback: // value for 'lookback'
 *   },
 * });
 */
export function useTriggerGarminSyncMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<TriggerGarminSyncMutation, TriggerGarminSyncMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<TriggerGarminSyncMutation, TriggerGarminSyncMutationVariables>(TriggerGarminSyncDocument, options);
      }
export type TriggerGarminSyncMutationHookResult = ReturnType<typeof useTriggerGarminSyncMutation>;
export type TriggerGarminSyncMutationResult = ApolloReactCommon.MutationResult<TriggerGarminSyncMutation>;
export type TriggerGarminSyncMutationOptions = ApolloReactCommon.BaseMutationOptions<TriggerGarminSyncMutation, TriggerGarminSyncMutationVariables>;
export const GarminExportPointsDocument = gql`
    query GarminExportPoints($activity_id: String!, $limit: Int, $offset: Int) {
  garminTrackPoints(activity_id: $activity_id, limit: $limit, offset: $offset) {
    items {
      id
      activity_id
      timestamp
      latitude
      longitude
      altitude
      distance_from_start_km
      speed_kmh
      heart_rate
      hr_zone
      respiration_rate
      cadence
      temperature_c
      surface_type
      effort_level
      created_at
      address {
        display_address
        street
        housenumber
        neighbourhood
        locality
        region
        country
        postalcode
        confidence
        waypoint_kind
        status
        geocoded_at
      }
    }
    total
  }
}
    `;

/**
 * __useGarminExportPointsQuery__
 *
 * To run a query within a React component, call `useGarminExportPointsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGarminExportPointsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGarminExportPointsQuery({
 *   variables: {
 *      activity_id: // value for 'activity_id'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGarminExportPointsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GarminExportPointsQuery, GarminExportPointsQueryVariables> & ({ variables: GarminExportPointsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GarminExportPointsQuery, GarminExportPointsQueryVariables>(GarminExportPointsDocument, options);
      }
export function useGarminExportPointsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GarminExportPointsQuery, GarminExportPointsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GarminExportPointsQuery, GarminExportPointsQueryVariables>(GarminExportPointsDocument, options);
        }
// @ts-ignore
export function useGarminExportPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GarminExportPointsQuery, GarminExportPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminExportPointsQuery, GarminExportPointsQueryVariables>;
export function useGarminExportPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminExportPointsQuery, GarminExportPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GarminExportPointsQuery | undefined, GarminExportPointsQueryVariables>;
export function useGarminExportPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GarminExportPointsQuery, GarminExportPointsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GarminExportPointsQuery, GarminExportPointsQueryVariables>(GarminExportPointsDocument, options);
        }
export type GarminExportPointsQueryHookResult = ReturnType<typeof useGarminExportPointsQuery>;
export type GarminExportPointsLazyQueryHookResult = ReturnType<typeof useGarminExportPointsLazyQuery>;
export type GarminExportPointsSuspenseQueryHookResult = ReturnType<typeof useGarminExportPointsSuspenseQuery>;
export type GarminExportPointsQueryResult = ApolloReactCommon.QueryResult<GarminExportPointsQuery, GarminExportPointsQueryVariables>;
export const GeocodingStatusDocument = gql`
    query GeocodingStatus {
  geocodingStatus {
    total_locations
    geocoded
    success
    pending
    no_coverage
    errors
    coverage_percent
  }
}
    `;

/**
 * __useGeocodingStatusQuery__
 *
 * To run a query within a React component, call `useGeocodingStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGeocodingStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGeocodingStatusQuery({
 *   variables: {
 *   },
 * });
 */
export function useGeocodingStatusQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GeocodingStatusQuery, GeocodingStatusQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GeocodingStatusQuery, GeocodingStatusQueryVariables>(GeocodingStatusDocument, options);
      }
export function useGeocodingStatusLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GeocodingStatusQuery, GeocodingStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GeocodingStatusQuery, GeocodingStatusQueryVariables>(GeocodingStatusDocument, options);
        }
// @ts-ignore
export function useGeocodingStatusSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GeocodingStatusQuery, GeocodingStatusQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GeocodingStatusQuery, GeocodingStatusQueryVariables>;
export function useGeocodingStatusSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GeocodingStatusQuery, GeocodingStatusQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GeocodingStatusQuery | undefined, GeocodingStatusQueryVariables>;
export function useGeocodingStatusSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GeocodingStatusQuery, GeocodingStatusQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GeocodingStatusQuery, GeocodingStatusQueryVariables>(GeocodingStatusDocument, options);
        }
export type GeocodingStatusQueryHookResult = ReturnType<typeof useGeocodingStatusQuery>;
export type GeocodingStatusLazyQueryHookResult = ReturnType<typeof useGeocodingStatusLazyQuery>;
export type GeocodingStatusSuspenseQueryHookResult = ReturnType<typeof useGeocodingStatusSuspenseQuery>;
export type GeocodingStatusQueryResult = ApolloReactCommon.QueryResult<GeocodingStatusQuery, GeocodingStatusQueryVariables>;
export const TriggerGeocodingDocument = gql`
    mutation TriggerGeocoding($batch_size: Int, $retry_failed: Boolean) {
  triggerGeocoding(batch_size: $batch_size, retry_failed: $retry_failed) {
    processed
    remaining
    skipped_dedup
  }
}
    `;
export type TriggerGeocodingMutationFn = ApolloReactCommon.MutationFunction<TriggerGeocodingMutation, TriggerGeocodingMutationVariables>;

/**
 * __useTriggerGeocodingMutation__
 *
 * To run a mutation, you first call `useTriggerGeocodingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTriggerGeocodingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [triggerGeocodingMutation, { data, loading, error }] = useTriggerGeocodingMutation({
 *   variables: {
 *      batch_size: // value for 'batch_size'
 *      retry_failed: // value for 'retry_failed'
 *   },
 * });
 */
export function useTriggerGeocodingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<TriggerGeocodingMutation, TriggerGeocodingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<TriggerGeocodingMutation, TriggerGeocodingMutationVariables>(TriggerGeocodingDocument, options);
      }
export type TriggerGeocodingMutationHookResult = ReturnType<typeof useTriggerGeocodingMutation>;
export type TriggerGeocodingMutationResult = ApolloReactCommon.MutationResult<TriggerGeocodingMutation>;
export type TriggerGeocodingMutationOptions = ApolloReactCommon.BaseMutationOptions<TriggerGeocodingMutation, TriggerGeocodingMutationVariables>;
export const HealthDocument = gql`
    query Health {
  health {
    status
    version
  }
}
    `;

/**
 * __useHealthQuery__
 *
 * To run a query within a React component, call `useHealthQuery` and pass it any options that fit your needs.
 * When your component renders, `useHealthQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHealthQuery({
 *   variables: {
 *   },
 * });
 */
export function useHealthQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<HealthQuery, HealthQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<HealthQuery, HealthQueryVariables>(HealthDocument, options);
      }
export function useHealthLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<HealthQuery, HealthQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<HealthQuery, HealthQueryVariables>(HealthDocument, options);
        }
// @ts-ignore
export function useHealthSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<HealthQuery, HealthQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<HealthQuery, HealthQueryVariables>;
export function useHealthSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<HealthQuery, HealthQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<HealthQuery | undefined, HealthQueryVariables>;
export function useHealthSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<HealthQuery, HealthQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<HealthQuery, HealthQueryVariables>(HealthDocument, options);
        }
export type HealthQueryHookResult = ReturnType<typeof useHealthQuery>;
export type HealthLazyQueryHookResult = ReturnType<typeof useHealthLazyQuery>;
export type HealthSuspenseQueryHookResult = ReturnType<typeof useHealthSuspenseQuery>;
export type HealthQueryResult = ApolloReactCommon.QueryResult<HealthQuery, HealthQueryVariables>;
export const ReadyDocument = gql`
    query Ready {
  ready {
    status
    database
    version
  }
}
    `;

/**
 * __useReadyQuery__
 *
 * To run a query within a React component, call `useReadyQuery` and pass it any options that fit your needs.
 * When your component renders, `useReadyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReadyQuery({
 *   variables: {
 *   },
 * });
 */
export function useReadyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ReadyQuery, ReadyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ReadyQuery, ReadyQueryVariables>(ReadyDocument, options);
      }
export function useReadyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ReadyQuery, ReadyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ReadyQuery, ReadyQueryVariables>(ReadyDocument, options);
        }
// @ts-ignore
export function useReadySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<ReadyQuery, ReadyQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReadyQuery, ReadyQueryVariables>;
export function useReadySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReadyQuery, ReadyQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReadyQuery | undefined, ReadyQueryVariables>;
export function useReadySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReadyQuery, ReadyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ReadyQuery, ReadyQueryVariables>(ReadyDocument, options);
        }
export type ReadyQueryHookResult = ReturnType<typeof useReadyQuery>;
export type ReadyLazyQueryHookResult = ReturnType<typeof useReadyLazyQuery>;
export type ReadySuspenseQueryHookResult = ReturnType<typeof useReadySuspenseQuery>;
export type ReadyQueryResult = ApolloReactCommon.QueryResult<ReadyQuery, ReadyQueryVariables>;
export const LocationsDocument = gql`
    query Locations($device_id: String, $date_from: String, $date_to: String, $limit: Int, $offset: Int, $sort: String, $order: SortOrder) {
  locations(
    device_id: $device_id
    date_from: $date_from
    date_to: $date_to
    limit: $limit
    offset: $offset
    sort: $sort
    order: $order
  ) {
    items {
      id
      device_id
      tid
      latitude
      longitude
      accuracy
      altitude
      velocity
      battery
      battery_status
      connection_type
      trigger
      timestamp
      created_at
      display_address
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useLocationsQuery__
 *
 * To run a query within a React component, call `useLocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationsQuery({
 *   variables: {
 *      device_id: // value for 'device_id'
 *      date_from: // value for 'date_from'
 *      date_to: // value for 'date_to'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      sort: // value for 'sort'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useLocationsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<LocationsQuery, LocationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<LocationsQuery, LocationsQueryVariables>(LocationsDocument, options);
      }
export function useLocationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<LocationsQuery, LocationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<LocationsQuery, LocationsQueryVariables>(LocationsDocument, options);
        }
// @ts-ignore
export function useLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<LocationsQuery, LocationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationsQuery, LocationsQueryVariables>;
export function useLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationsQuery, LocationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationsQuery | undefined, LocationsQueryVariables>;
export function useLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationsQuery, LocationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<LocationsQuery, LocationsQueryVariables>(LocationsDocument, options);
        }
export type LocationsQueryHookResult = ReturnType<typeof useLocationsQuery>;
export type LocationsLazyQueryHookResult = ReturnType<typeof useLocationsLazyQuery>;
export type LocationsSuspenseQueryHookResult = ReturnType<typeof useLocationsSuspenseQuery>;
export type LocationsQueryResult = ApolloReactCommon.QueryResult<LocationsQuery, LocationsQueryVariables>;
export const LocationDetailDocument = gql`
    query LocationDetail($id: Int!) {
  location(id: $id) {
    id
    device_id
    tid
    latitude
    longitude
    accuracy
    altitude
    velocity
    battery
    battery_status
    connection_type
    trigger
    timestamp
    created_at
    raw_payload
    address {
      display_address
      street
      housenumber
      neighbourhood
      locality
      region
      country
      postalcode
      confidence
      status
      geocoded_at
    }
  }
}
    `;

/**
 * __useLocationDetailQuery__
 *
 * To run a query within a React component, call `useLocationDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocationDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useLocationDetailQuery(baseOptions: ApolloReactHooks.QueryHookOptions<LocationDetailQuery, LocationDetailQueryVariables> & ({ variables: LocationDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<LocationDetailQuery, LocationDetailQueryVariables>(LocationDetailDocument, options);
      }
export function useLocationDetailLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<LocationDetailQuery, LocationDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<LocationDetailQuery, LocationDetailQueryVariables>(LocationDetailDocument, options);
        }
// @ts-ignore
export function useLocationDetailSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<LocationDetailQuery, LocationDetailQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationDetailQuery, LocationDetailQueryVariables>;
export function useLocationDetailSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationDetailQuery, LocationDetailQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationDetailQuery | undefined, LocationDetailQueryVariables>;
export function useLocationDetailSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationDetailQuery, LocationDetailQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<LocationDetailQuery, LocationDetailQueryVariables>(LocationDetailDocument, options);
        }
export type LocationDetailQueryHookResult = ReturnType<typeof useLocationDetailQuery>;
export type LocationDetailLazyQueryHookResult = ReturnType<typeof useLocationDetailLazyQuery>;
export type LocationDetailSuspenseQueryHookResult = ReturnType<typeof useLocationDetailSuspenseQuery>;
export type LocationDetailQueryResult = ApolloReactCommon.QueryResult<LocationDetailQuery, LocationDetailQueryVariables>;
export const DevicesDocument = gql`
    query Devices {
  devices {
    device_id
  }
}
    `;

/**
 * __useDevicesQuery__
 *
 * To run a query within a React component, call `useDevicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useDevicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDevicesQuery({
 *   variables: {
 *   },
 * });
 */
export function useDevicesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DevicesQuery, DevicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DevicesQuery, DevicesQueryVariables>(DevicesDocument, options);
      }
export function useDevicesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DevicesQuery, DevicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DevicesQuery, DevicesQueryVariables>(DevicesDocument, options);
        }
// @ts-ignore
export function useDevicesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DevicesQuery, DevicesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesQuery, DevicesQueryVariables>;
export function useDevicesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesQuery, DevicesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesQuery | undefined, DevicesQueryVariables>;
export function useDevicesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesQuery, DevicesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DevicesQuery, DevicesQueryVariables>(DevicesDocument, options);
        }
export type DevicesQueryHookResult = ReturnType<typeof useDevicesQuery>;
export type DevicesLazyQueryHookResult = ReturnType<typeof useDevicesLazyQuery>;
export type DevicesSuspenseQueryHookResult = ReturnType<typeof useDevicesSuspenseQuery>;
export type DevicesQueryResult = ApolloReactCommon.QueryResult<DevicesQuery, DevicesQueryVariables>;
export const LocationCountDocument = gql`
    query LocationCount($date: String, $device_id: String) {
  locationCount(date: $date, device_id: $device_id) {
    count
    date
    device_id
  }
}
    `;

/**
 * __useLocationCountQuery__
 *
 * To run a query within a React component, call `useLocationCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocationCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationCountQuery({
 *   variables: {
 *      date: // value for 'date'
 *      device_id: // value for 'device_id'
 *   },
 * });
 */
export function useLocationCountQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<LocationCountQuery, LocationCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<LocationCountQuery, LocationCountQueryVariables>(LocationCountDocument, options);
      }
export function useLocationCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<LocationCountQuery, LocationCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<LocationCountQuery, LocationCountQueryVariables>(LocationCountDocument, options);
        }
// @ts-ignore
export function useLocationCountSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<LocationCountQuery, LocationCountQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationCountQuery, LocationCountQueryVariables>;
export function useLocationCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationCountQuery, LocationCountQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationCountQuery | undefined, LocationCountQueryVariables>;
export function useLocationCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationCountQuery, LocationCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<LocationCountQuery, LocationCountQueryVariables>(LocationCountDocument, options);
        }
export type LocationCountQueryHookResult = ReturnType<typeof useLocationCountQuery>;
export type LocationCountLazyQueryHookResult = ReturnType<typeof useLocationCountLazyQuery>;
export type LocationCountSuspenseQueryHookResult = ReturnType<typeof useLocationCountSuspenseQuery>;
export type LocationCountQueryResult = ApolloReactCommon.QueryResult<LocationCountQuery, LocationCountQueryVariables>;
export const LocationDateRangeDocument = gql`
    query LocationDateRange {
  locationDateRange {
    min_date
    max_date
  }
}
    `;

/**
 * __useLocationDateRangeQuery__
 *
 * To run a query within a React component, call `useLocationDateRangeQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocationDateRangeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationDateRangeQuery({
 *   variables: {
 *   },
 * });
 */
export function useLocationDateRangeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<LocationDateRangeQuery, LocationDateRangeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<LocationDateRangeQuery, LocationDateRangeQueryVariables>(LocationDateRangeDocument, options);
      }
export function useLocationDateRangeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<LocationDateRangeQuery, LocationDateRangeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<LocationDateRangeQuery, LocationDateRangeQueryVariables>(LocationDateRangeDocument, options);
        }
// @ts-ignore
export function useLocationDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<LocationDateRangeQuery, LocationDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationDateRangeQuery, LocationDateRangeQueryVariables>;
export function useLocationDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationDateRangeQuery, LocationDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<LocationDateRangeQuery | undefined, LocationDateRangeQueryVariables>;
export function useLocationDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<LocationDateRangeQuery, LocationDateRangeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<LocationDateRangeQuery, LocationDateRangeQueryVariables>(LocationDateRangeDocument, options);
        }
export type LocationDateRangeQueryHookResult = ReturnType<typeof useLocationDateRangeQuery>;
export type LocationDateRangeLazyQueryHookResult = ReturnType<typeof useLocationDateRangeLazyQuery>;
export type LocationDateRangeSuspenseQueryHookResult = ReturnType<typeof useLocationDateRangeSuspenseQuery>;
export type LocationDateRangeQueryResult = ApolloReactCommon.QueryResult<LocationDateRangeQuery, LocationDateRangeQueryVariables>;
export const ReferenceLocationsDocument = gql`
    query ReferenceLocations {
  referenceLocations {
    id
    name
    latitude
    longitude
    radius_meters
    description
    created_at
    updated_at
  }
}
    `;

/**
 * __useReferenceLocationsQuery__
 *
 * To run a query within a React component, call `useReferenceLocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReferenceLocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReferenceLocationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useReferenceLocationsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>(ReferenceLocationsDocument, options);
      }
export function useReferenceLocationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>(ReferenceLocationsDocument, options);
        }
// @ts-ignore
export function useReferenceLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>;
export function useReferenceLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReferenceLocationsQuery | undefined, ReferenceLocationsQueryVariables>;
export function useReferenceLocationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>(ReferenceLocationsDocument, options);
        }
export type ReferenceLocationsQueryHookResult = ReturnType<typeof useReferenceLocationsQuery>;
export type ReferenceLocationsLazyQueryHookResult = ReturnType<typeof useReferenceLocationsLazyQuery>;
export type ReferenceLocationsSuspenseQueryHookResult = ReturnType<typeof useReferenceLocationsSuspenseQuery>;
export type ReferenceLocationsQueryResult = ApolloReactCommon.QueryResult<ReferenceLocationsQuery, ReferenceLocationsQueryVariables>;
export const ReferenceLocationDocument = gql`
    query ReferenceLocation($id: Int!) {
  referenceLocation(id: $id) {
    id
    name
    latitude
    longitude
    radius_meters
    description
    created_at
    updated_at
  }
}
    `;

/**
 * __useReferenceLocationQuery__
 *
 * To run a query within a React component, call `useReferenceLocationQuery` and pass it any options that fit your needs.
 * When your component renders, `useReferenceLocationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReferenceLocationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReferenceLocationQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ReferenceLocationQuery, ReferenceLocationQueryVariables> & ({ variables: ReferenceLocationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ReferenceLocationQuery, ReferenceLocationQueryVariables>(ReferenceLocationDocument, options);
      }
export function useReferenceLocationLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ReferenceLocationQuery, ReferenceLocationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ReferenceLocationQuery, ReferenceLocationQueryVariables>(ReferenceLocationDocument, options);
        }
// @ts-ignore
export function useReferenceLocationSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationQuery, ReferenceLocationQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReferenceLocationQuery, ReferenceLocationQueryVariables>;
export function useReferenceLocationSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationQuery, ReferenceLocationQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<ReferenceLocationQuery | undefined, ReferenceLocationQueryVariables>;
export function useReferenceLocationSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ReferenceLocationQuery, ReferenceLocationQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ReferenceLocationQuery, ReferenceLocationQueryVariables>(ReferenceLocationDocument, options);
        }
export type ReferenceLocationQueryHookResult = ReturnType<typeof useReferenceLocationQuery>;
export type ReferenceLocationLazyQueryHookResult = ReturnType<typeof useReferenceLocationLazyQuery>;
export type ReferenceLocationSuspenseQueryHookResult = ReturnType<typeof useReferenceLocationSuspenseQuery>;
export type ReferenceLocationQueryResult = ApolloReactCommon.QueryResult<ReferenceLocationQuery, ReferenceLocationQueryVariables>;
export const NearbyPointsDocument = gql`
    query NearbyPoints($lat: Float!, $lon: Float!, $radius_meters: Float, $source: String, $limit: Int) {
  nearbyPoints(
    lat: $lat
    lon: $lon
    radius_meters: $radius_meters
    source: $source
    limit: $limit
  ) {
    source
    id
    latitude
    longitude
    distance_meters
    timestamp
  }
}
    `;

/**
 * __useNearbyPointsQuery__
 *
 * To run a query within a React component, call `useNearbyPointsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNearbyPointsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNearbyPointsQuery({
 *   variables: {
 *      lat: // value for 'lat'
 *      lon: // value for 'lon'
 *      radius_meters: // value for 'radius_meters'
 *      source: // value for 'source'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useNearbyPointsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<NearbyPointsQuery, NearbyPointsQueryVariables> & ({ variables: NearbyPointsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<NearbyPointsQuery, NearbyPointsQueryVariables>(NearbyPointsDocument, options);
      }
export function useNearbyPointsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<NearbyPointsQuery, NearbyPointsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<NearbyPointsQuery, NearbyPointsQueryVariables>(NearbyPointsDocument, options);
        }
// @ts-ignore
export function useNearbyPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<NearbyPointsQuery, NearbyPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<NearbyPointsQuery, NearbyPointsQueryVariables>;
export function useNearbyPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<NearbyPointsQuery, NearbyPointsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<NearbyPointsQuery | undefined, NearbyPointsQueryVariables>;
export function useNearbyPointsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<NearbyPointsQuery, NearbyPointsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<NearbyPointsQuery, NearbyPointsQueryVariables>(NearbyPointsDocument, options);
        }
export type NearbyPointsQueryHookResult = ReturnType<typeof useNearbyPointsQuery>;
export type NearbyPointsLazyQueryHookResult = ReturnType<typeof useNearbyPointsLazyQuery>;
export type NearbyPointsSuspenseQueryHookResult = ReturnType<typeof useNearbyPointsSuspenseQuery>;
export type NearbyPointsQueryResult = ApolloReactCommon.QueryResult<NearbyPointsQuery, NearbyPointsQueryVariables>;
export const CalculateDistanceDocument = gql`
    query CalculateDistance($from_lat: Float!, $from_lon: Float!, $to_lat: Float!, $to_lon: Float!) {
  calculateDistance(
    from_lat: $from_lat
    from_lon: $from_lon
    to_lat: $to_lat
    to_lon: $to_lon
  ) {
    distance_meters
    from_lat
    from_lon
    to_lat
    to_lon
  }
}
    `;

/**
 * __useCalculateDistanceQuery__
 *
 * To run a query within a React component, call `useCalculateDistanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useCalculateDistanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCalculateDistanceQuery({
 *   variables: {
 *      from_lat: // value for 'from_lat'
 *      from_lon: // value for 'from_lon'
 *      to_lat: // value for 'to_lat'
 *      to_lon: // value for 'to_lon'
 *   },
 * });
 */
export function useCalculateDistanceQuery(baseOptions: ApolloReactHooks.QueryHookOptions<CalculateDistanceQuery, CalculateDistanceQueryVariables> & ({ variables: CalculateDistanceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<CalculateDistanceQuery, CalculateDistanceQueryVariables>(CalculateDistanceDocument, options);
      }
export function useCalculateDistanceLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<CalculateDistanceQuery, CalculateDistanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<CalculateDistanceQuery, CalculateDistanceQueryVariables>(CalculateDistanceDocument, options);
        }
// @ts-ignore
export function useCalculateDistanceSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<CalculateDistanceQuery, CalculateDistanceQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<CalculateDistanceQuery, CalculateDistanceQueryVariables>;
export function useCalculateDistanceSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<CalculateDistanceQuery, CalculateDistanceQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<CalculateDistanceQuery | undefined, CalculateDistanceQueryVariables>;
export function useCalculateDistanceSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<CalculateDistanceQuery, CalculateDistanceQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<CalculateDistanceQuery, CalculateDistanceQueryVariables>(CalculateDistanceDocument, options);
        }
export type CalculateDistanceQueryHookResult = ReturnType<typeof useCalculateDistanceQuery>;
export type CalculateDistanceLazyQueryHookResult = ReturnType<typeof useCalculateDistanceLazyQuery>;
export type CalculateDistanceSuspenseQueryHookResult = ReturnType<typeof useCalculateDistanceSuspenseQuery>;
export type CalculateDistanceQueryResult = ApolloReactCommon.QueryResult<CalculateDistanceQuery, CalculateDistanceQueryVariables>;
export const WithinReferenceDocument = gql`
    query WithinReference($name: String!, $source: String, $limit: Int) {
  withinReference(name: $name, source: $source, limit: $limit) {
    reference_name
    radius_meters
    total_points
    points {
      source
      id
      latitude
      longitude
      distance_meters
      timestamp
    }
  }
}
    `;

/**
 * __useWithinReferenceQuery__
 *
 * To run a query within a React component, call `useWithinReferenceQuery` and pass it any options that fit your needs.
 * When your component renders, `useWithinReferenceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWithinReferenceQuery({
 *   variables: {
 *      name: // value for 'name'
 *      source: // value for 'source'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useWithinReferenceQuery(baseOptions: ApolloReactHooks.QueryHookOptions<WithinReferenceQuery, WithinReferenceQueryVariables> & ({ variables: WithinReferenceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<WithinReferenceQuery, WithinReferenceQueryVariables>(WithinReferenceDocument, options);
      }
export function useWithinReferenceLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<WithinReferenceQuery, WithinReferenceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<WithinReferenceQuery, WithinReferenceQueryVariables>(WithinReferenceDocument, options);
        }
// @ts-ignore
export function useWithinReferenceSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<WithinReferenceQuery, WithinReferenceQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<WithinReferenceQuery, WithinReferenceQueryVariables>;
export function useWithinReferenceSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<WithinReferenceQuery, WithinReferenceQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<WithinReferenceQuery | undefined, WithinReferenceQueryVariables>;
export function useWithinReferenceSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<WithinReferenceQuery, WithinReferenceQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<WithinReferenceQuery, WithinReferenceQueryVariables>(WithinReferenceDocument, options);
        }
export type WithinReferenceQueryHookResult = ReturnType<typeof useWithinReferenceQuery>;
export type WithinReferenceLazyQueryHookResult = ReturnType<typeof useWithinReferenceLazyQuery>;
export type WithinReferenceSuspenseQueryHookResult = ReturnType<typeof useWithinReferenceSuspenseQuery>;
export type WithinReferenceQueryResult = ApolloReactCommon.QueryResult<WithinReferenceQuery, WithinReferenceQueryVariables>;
export const UnifiedGpsDocument = gql`
    query UnifiedGps($source: String, $date_from: String, $date_to: String, $limit: Int, $offset: Int, $order: SortOrder, $exclude_stationary: Boolean, $deduplicate: Boolean) {
  unifiedGps(
    source: $source
    date_from: $date_from
    date_to: $date_to
    limit: $limit
    offset: $offset
    order: $order
    exclude_stationary: $exclude_stationary
    deduplicate: $deduplicate
  ) {
    items {
      source
      identifier
      latitude
      longitude
      timestamp
      accuracy
      battery
      speed_kmh
      heart_rate
      created_at
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useUnifiedGpsQuery__
 *
 * To run a query within a React component, call `useUnifiedGpsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnifiedGpsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnifiedGpsQuery({
 *   variables: {
 *      source: // value for 'source'
 *      date_from: // value for 'date_from'
 *      date_to: // value for 'date_to'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      order: // value for 'order'
 *      exclude_stationary: // value for 'exclude_stationary'
 *      deduplicate: // value for 'deduplicate'
 *   },
 * });
 */
export function useUnifiedGpsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<UnifiedGpsQuery, UnifiedGpsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<UnifiedGpsQuery, UnifiedGpsQueryVariables>(UnifiedGpsDocument, options);
      }
export function useUnifiedGpsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UnifiedGpsQuery, UnifiedGpsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<UnifiedGpsQuery, UnifiedGpsQueryVariables>(UnifiedGpsDocument, options);
        }
// @ts-ignore
export function useUnifiedGpsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<UnifiedGpsQuery, UnifiedGpsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<UnifiedGpsQuery, UnifiedGpsQueryVariables>;
export function useUnifiedGpsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UnifiedGpsQuery, UnifiedGpsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<UnifiedGpsQuery | undefined, UnifiedGpsQueryVariables>;
export function useUnifiedGpsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UnifiedGpsQuery, UnifiedGpsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<UnifiedGpsQuery, UnifiedGpsQueryVariables>(UnifiedGpsDocument, options);
        }
export type UnifiedGpsQueryHookResult = ReturnType<typeof useUnifiedGpsQuery>;
export type UnifiedGpsLazyQueryHookResult = ReturnType<typeof useUnifiedGpsLazyQuery>;
export type UnifiedGpsSuspenseQueryHookResult = ReturnType<typeof useUnifiedGpsSuspenseQuery>;
export type UnifiedGpsQueryResult = ApolloReactCommon.QueryResult<UnifiedGpsQuery, UnifiedGpsQueryVariables>;
export const DailySummaryDocument = gql`
    query DailySummary($date_from: String, $date_to: String, $limit: Int, $offset: Int) {
  dailySummary(
    date_from: $date_from
    date_to: $date_to
    limit: $limit
    offset: $offset
  ) {
    items {
      activity_date
      owntracks_device
      owntracks_points
      min_battery
      max_battery
      avg_accuracy
      garmin_sport
      garmin_activities
      total_distance_km
      total_duration_seconds
      avg_heart_rate
      total_calories
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useDailySummaryQuery__
 *
 * To run a query within a React component, call `useDailySummaryQuery` and pass it any options that fit your needs.
 * When your component renders, `useDailySummaryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDailySummaryQuery({
 *   variables: {
 *      date_from: // value for 'date_from'
 *      date_to: // value for 'date_to'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useDailySummaryQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DailySummaryQuery, DailySummaryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DailySummaryQuery, DailySummaryQueryVariables>(DailySummaryDocument, options);
      }
export function useDailySummaryLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DailySummaryQuery, DailySummaryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DailySummaryQuery, DailySummaryQueryVariables>(DailySummaryDocument, options);
        }
// @ts-ignore
export function useDailySummarySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryQuery, DailySummaryQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DailySummaryQuery, DailySummaryQueryVariables>;
export function useDailySummarySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryQuery, DailySummaryQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DailySummaryQuery | undefined, DailySummaryQueryVariables>;
export function useDailySummarySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryQuery, DailySummaryQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DailySummaryQuery, DailySummaryQueryVariables>(DailySummaryDocument, options);
        }
export type DailySummaryQueryHookResult = ReturnType<typeof useDailySummaryQuery>;
export type DailySummaryLazyQueryHookResult = ReturnType<typeof useDailySummaryLazyQuery>;
export type DailySummarySuspenseQueryHookResult = ReturnType<typeof useDailySummarySuspenseQuery>;
export type DailySummaryQueryResult = ApolloReactCommon.QueryResult<DailySummaryQuery, DailySummaryQueryVariables>;
export const DailySummaryDateRangeDocument = gql`
    query DailySummaryDateRange {
  dailySummaryDateRange {
    min_date
    max_date
  }
}
    `;

/**
 * __useDailySummaryDateRangeQuery__
 *
 * To run a query within a React component, call `useDailySummaryDateRangeQuery` and pass it any options that fit your needs.
 * When your component renders, `useDailySummaryDateRangeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDailySummaryDateRangeQuery({
 *   variables: {
 *   },
 * });
 */
export function useDailySummaryDateRangeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>(DailySummaryDateRangeDocument, options);
      }
export function useDailySummaryDateRangeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>(DailySummaryDateRangeDocument, options);
        }
// @ts-ignore
export function useDailySummaryDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>;
export function useDailySummaryDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DailySummaryDateRangeQuery | undefined, DailySummaryDateRangeQueryVariables>;
export function useDailySummaryDateRangeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>(DailySummaryDateRangeDocument, options);
        }
export type DailySummaryDateRangeQueryHookResult = ReturnType<typeof useDailySummaryDateRangeQuery>;
export type DailySummaryDateRangeLazyQueryHookResult = ReturnType<typeof useDailySummaryDateRangeLazyQuery>;
export type DailySummaryDateRangeSuspenseQueryHookResult = ReturnType<typeof useDailySummaryDateRangeSuspenseQuery>;
export type DailySummaryDateRangeQueryResult = ApolloReactCommon.QueryResult<DailySummaryDateRangeQuery, DailySummaryDateRangeQueryVariables>;