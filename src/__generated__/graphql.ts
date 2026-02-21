/* eslint-disable */
// @ts-nocheck
import { gql } from '@apollo/client';
import type * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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

export type DailyActivitySummary = {
  __typename?: 'DailyActivitySummary';
  activity_date?: Maybe<Scalars['String']['output']>;
  avg_accuracy?: Maybe<Scalars['Float']['output']>;
  avg_heart_rate?: Maybe<Scalars['Int']['output']>;
  garmin_activities?: Maybe<Scalars['Int']['output']>;
  garmin_sport?: Maybe<Scalars['String']['output']>;
  max_battery?: Maybe<Scalars['Int']['output']>;
  min_battery?: Maybe<Scalars['Int']['output']>;
  owntracks_device?: Maybe<Scalars['String']['output']>;
  owntracks_points?: Maybe<Scalars['Int']['output']>;
  total_calories?: Maybe<Scalars['Int']['output']>;
  total_distance_km?: Maybe<Scalars['Float']['output']>;
  total_duration_seconds?: Maybe<Scalars['Float']['output']>;
};

export type DeviceInfo = {
  __typename?: 'DeviceInfo';
  device_id: Scalars['String']['output'];
};

export type DistanceResult = {
  __typename?: 'DistanceResult';
  distance_meters: Scalars['Float']['output'];
  from_lat: Scalars['Float']['output'];
  from_lon: Scalars['Float']['output'];
  to_lat: Scalars['Float']['output'];
  to_lon: Scalars['Float']['output'];
};

export type GarminActivity = {
  __typename?: 'GarminActivity';
  activity_id: Scalars['String']['output'];
  avg_cadence?: Maybe<Scalars['Int']['output']>;
  avg_heart_rate?: Maybe<Scalars['Int']['output']>;
  avg_pace?: Maybe<Scalars['Float']['output']>;
  avg_speed_kmh?: Maybe<Scalars['Float']['output']>;
  avg_temperature_c?: Maybe<Scalars['Int']['output']>;
  calories?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  device_manufacturer?: Maybe<Scalars['String']['output']>;
  distance_km?: Maybe<Scalars['Float']['output']>;
  duration_seconds?: Maybe<Scalars['Float']['output']>;
  end_time?: Maybe<Scalars['String']['output']>;
  max_cadence?: Maybe<Scalars['Int']['output']>;
  max_heart_rate?: Maybe<Scalars['Int']['output']>;
  max_speed_kmh?: Maybe<Scalars['Float']['output']>;
  max_temperature_c?: Maybe<Scalars['Int']['output']>;
  min_temperature_c?: Maybe<Scalars['Int']['output']>;
  sport: Scalars['String']['output'];
  start_time?: Maybe<Scalars['String']['output']>;
  sub_sport?: Maybe<Scalars['String']['output']>;
  total_ascent_m?: Maybe<Scalars['Float']['output']>;
  total_descent_m?: Maybe<Scalars['Float']['output']>;
  total_distance?: Maybe<Scalars['Float']['output']>;
  total_elapsed_time?: Maybe<Scalars['Float']['output']>;
  total_timer_time?: Maybe<Scalars['Float']['output']>;
  track_point_count?: Maybe<Scalars['Int']['output']>;
  uploaded_at?: Maybe<Scalars['String']['output']>;
};

export type GarminActivityConnection = {
  __typename?: 'GarminActivityConnection';
  items: Array<GarminActivity>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type GarminChartPoint = {
  __typename?: 'GarminChartPoint';
  altitude?: Maybe<Scalars['Float']['output']>;
  cadence?: Maybe<Scalars['Int']['output']>;
  distance_from_start_km?: Maybe<Scalars['Float']['output']>;
  heart_rate?: Maybe<Scalars['Int']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  temperature_c?: Maybe<Scalars['Float']['output']>;
  timestamp: Scalars['DateTime']['output'];
};

export type GarminTrackPoint = {
  __typename?: 'GarminTrackPoint';
  activity_id: Scalars['String']['output'];
  altitude?: Maybe<Scalars['Float']['output']>;
  cadence?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  distance_from_start_km?: Maybe<Scalars['Float']['output']>;
  heart_rate?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  temperature_c?: Maybe<Scalars['Float']['output']>;
  timestamp: Scalars['DateTime']['output'];
};

export type GarminTrackPointConnection = {
  __typename?: 'GarminTrackPointConnection';
  items: Array<GarminTrackPoint>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type HealthStatus = {
  __typename?: 'HealthStatus';
  status: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type Location = {
  __typename?: 'Location';
  accuracy?: Maybe<Scalars['Float']['output']>;
  altitude?: Maybe<Scalars['Float']['output']>;
  battery?: Maybe<Scalars['Int']['output']>;
  battery_status?: Maybe<Scalars['Int']['output']>;
  connection_type?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  device_id: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  tid?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  trigger?: Maybe<Scalars['String']['output']>;
  velocity?: Maybe<Scalars['Float']['output']>;
};

export type LocationConnection = {
  __typename?: 'LocationConnection';
  items: Array<Location>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type LocationCount = {
  __typename?: 'LocationCount';
  count: Scalars['Int']['output'];
  date?: Maybe<Scalars['String']['output']>;
  device_id?: Maybe<Scalars['String']['output']>;
};

export type LocationDetail = {
  __typename?: 'LocationDetail';
  accuracy?: Maybe<Scalars['Float']['output']>;
  altitude?: Maybe<Scalars['Float']['output']>;
  battery?: Maybe<Scalars['Int']['output']>;
  battery_status?: Maybe<Scalars['Int']['output']>;
  connection_type?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  device_id: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  raw_payload?: Maybe<Scalars['JSON']['output']>;
  tid?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  trigger?: Maybe<Scalars['String']['output']>;
  velocity?: Maybe<Scalars['Float']['output']>;
};

export type NearbyPoint = {
  __typename?: 'NearbyPoint';
  distance_meters: Scalars['Float']['output'];
  id: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  source: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  calculateDistance: DistanceResult;
  dailySummary: Array<DailyActivitySummary>;
  devices: Array<DeviceInfo>;
  garminActivities: GarminActivityConnection;
  garminActivity?: Maybe<GarminActivity>;
  garminChartData: Array<GarminChartPoint>;
  garminSports: Array<SportInfo>;
  garminTrackPoints: GarminTrackPointConnection;
  health: HealthStatus;
  location?: Maybe<LocationDetail>;
  locationCount: LocationCount;
  locations: LocationConnection;
  nearbyPoints: Array<NearbyPoint>;
  ready: ReadyStatus;
  referenceLocation?: Maybe<ReferenceLocation>;
  referenceLocations: Array<ReferenceLocation>;
  unifiedGps: UnifiedGpsConnection;
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

export type ReadyStatus = {
  __typename?: 'ReadyStatus';
  database?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

export type ReferenceLocation = {
  __typename?: 'ReferenceLocation';
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  radius_meters: Scalars['Float']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type SortOrder =
  | 'asc'
  | 'desc';

export type SportInfo = {
  __typename?: 'SportInfo';
  activity_count: Scalars['Int']['output'];
  sport: Scalars['String']['output'];
};

export type UnifiedGpsConnection = {
  __typename?: 'UnifiedGpsConnection';
  items: Array<UnifiedGpsPoint>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type UnifiedGpsPoint = {
  __typename?: 'UnifiedGpsPoint';
  accuracy?: Maybe<Scalars['Float']['output']>;
  battery?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  heart_rate?: Maybe<Scalars['Int']['output']>;
  identifier: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  source: Scalars['String']['output'];
  speed_kmh?: Maybe<Scalars['Float']['output']>;
  timestamp: Scalars['DateTime']['output'];
};

export type WithinReferenceResult = {
  __typename?: 'WithinReferenceResult';
  points: Array<NearbyPoint>;
  radius_meters: Scalars['Float']['output'];
  reference_name: Scalars['String']['output'];
  total_points: Scalars['Int']['output'];
};

export type GarminActivitiesQueryVariables = Exact<{
  sport?: InputMaybe<Scalars['String']['input']>;
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SortOrder>;
}>;


export type GarminActivitiesQuery = { __typename?: 'Query', garminActivities: { __typename?: 'GarminActivityConnection', total: number, limit: number, offset: number, items: Array<{ __typename?: 'GarminActivity', activity_id: string, sport: string, sub_sport?: string | null, start_time?: string | null, end_time?: string | null, distance_km?: number | null, duration_seconds?: number | null, avg_heart_rate?: number | null, max_heart_rate?: number | null, avg_cadence?: number | null, max_cadence?: number | null, calories?: number | null, avg_speed_kmh?: number | null, max_speed_kmh?: number | null, total_ascent_m?: number | null, total_descent_m?: number | null, total_distance?: number | null, avg_pace?: number | null, device_manufacturer?: string | null, created_at?: string | null, uploaded_at?: string | null, track_point_count?: number | null }> } };

export type GarminActivityQueryVariables = Exact<{
  activity_id: Scalars['String']['input'];
}>;


export type GarminActivityQuery = { __typename?: 'Query', garminActivity?: { __typename?: 'GarminActivity', activity_id: string, sport: string, sub_sport?: string | null, start_time?: string | null, end_time?: string | null, distance_km?: number | null, duration_seconds?: number | null, avg_heart_rate?: number | null, max_heart_rate?: number | null, avg_cadence?: number | null, max_cadence?: number | null, calories?: number | null, avg_speed_kmh?: number | null, max_speed_kmh?: number | null, total_ascent_m?: number | null, total_descent_m?: number | null, total_distance?: number | null, avg_pace?: number | null, device_manufacturer?: string | null, avg_temperature_c?: number | null, min_temperature_c?: number | null, max_temperature_c?: number | null, total_elapsed_time?: number | null, total_timer_time?: number | null, created_at?: string | null, uploaded_at?: string | null, track_point_count?: number | null } | null };

export type GarminTrackPointsQueryVariables = Exact<{
  activity_id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SortOrder>;
  simplify?: InputMaybe<Scalars['Float']['input']>;
}>;


export type GarminTrackPointsQuery = { __typename?: 'Query', garminTrackPoints: { __typename?: 'GarminTrackPointConnection', total: number, limit: number, offset: number, items: Array<{ __typename?: 'GarminTrackPoint', id: number, activity_id: string, latitude: number, longitude: number, timestamp: string, altitude?: number | null, distance_from_start_km?: number | null, speed_kmh?: number | null, heart_rate?: number | null, cadence?: number | null, temperature_c?: number | null, created_at?: string | null }> } };

export type GarminSportsQueryVariables = Exact<{ [key: string]: never; }>;


export type GarminSportsQuery = { __typename?: 'Query', garminSports: Array<{ __typename?: 'SportInfo', sport: string, activity_count: number }> };

export type GarminChartDataQueryVariables = Exact<{
  activity_id: Scalars['String']['input'];
}>;


export type GarminChartDataQuery = { __typename?: 'Query', garminChartData: Array<{ __typename?: 'GarminChartPoint', timestamp: string, altitude?: number | null, distance_from_start_km?: number | null, speed_kmh?: number | null, heart_rate?: number | null, cadence?: number | null, temperature_c?: number | null, latitude: number, longitude: number }> };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { __typename?: 'Query', health: { __typename?: 'HealthStatus', status: string, version: string } };

export type ReadyQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadyQuery = { __typename?: 'Query', ready: { __typename?: 'ReadyStatus', status: string, database?: string | null, version?: string | null } };

export type LocationsQueryVariables = Exact<{
  device_id?: InputMaybe<Scalars['String']['input']>;
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SortOrder>;
}>;


export type LocationsQuery = { __typename?: 'Query', locations: { __typename?: 'LocationConnection', total: number, limit: number, offset: number, items: Array<{ __typename?: 'Location', id: number, device_id: string, tid?: string | null, latitude: number, longitude: number, accuracy?: number | null, altitude?: number | null, velocity?: number | null, battery?: number | null, battery_status?: number | null, connection_type?: string | null, trigger?: string | null, timestamp: string, created_at?: string | null }> } };

export type LocationDetailQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type LocationDetailQuery = { __typename?: 'Query', location?: { __typename?: 'LocationDetail', id: number, device_id: string, tid?: string | null, latitude: number, longitude: number, accuracy?: number | null, altitude?: number | null, velocity?: number | null, battery?: number | null, battery_status?: number | null, connection_type?: string | null, trigger?: string | null, timestamp: string, created_at?: string | null, raw_payload?: Record<string, unknown> | null } | null };

export type DevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'DeviceInfo', device_id: string }> };

export type LocationCountQueryVariables = Exact<{
  date?: InputMaybe<Scalars['String']['input']>;
  device_id?: InputMaybe<Scalars['String']['input']>;
}>;


export type LocationCountQuery = { __typename?: 'Query', locationCount: { __typename?: 'LocationCount', count: number, date?: string | null, device_id?: string | null } };

export type ReferenceLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ReferenceLocationsQuery = { __typename?: 'Query', referenceLocations: Array<{ __typename?: 'ReferenceLocation', id: number, name: string, latitude: number, longitude: number, radius_meters: number, description?: string | null, created_at?: string | null, updated_at?: string | null }> };

export type ReferenceLocationQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type ReferenceLocationQuery = { __typename?: 'Query', referenceLocation?: { __typename?: 'ReferenceLocation', id: number, name: string, latitude: number, longitude: number, radius_meters: number, description?: string | null, created_at?: string | null, updated_at?: string | null } | null };

export type NearbyPointsQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
  radius_meters?: InputMaybe<Scalars['Float']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NearbyPointsQuery = { __typename?: 'Query', nearbyPoints: Array<{ __typename?: 'NearbyPoint', source: string, id: number, latitude: number, longitude: number, distance_meters: number, timestamp: string }> };

export type CalculateDistanceQueryVariables = Exact<{
  from_lat: Scalars['Float']['input'];
  from_lon: Scalars['Float']['input'];
  to_lat: Scalars['Float']['input'];
  to_lon: Scalars['Float']['input'];
}>;


export type CalculateDistanceQuery = { __typename?: 'Query', calculateDistance: { __typename?: 'DistanceResult', distance_meters: number, from_lat: number, from_lon: number, to_lat: number, to_lon: number } };

export type WithinReferenceQueryVariables = Exact<{
  name: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type WithinReferenceQuery = { __typename?: 'Query', withinReference: { __typename?: 'WithinReferenceResult', reference_name: string, radius_meters: number, total_points: number, points: Array<{ __typename?: 'NearbyPoint', source: string, id: number, latitude: number, longitude: number, distance_meters: number, timestamp: string }> } };

export type UnifiedGpsQueryVariables = Exact<{
  source?: InputMaybe<Scalars['String']['input']>;
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
}>;


export type UnifiedGpsQuery = { __typename?: 'Query', unifiedGps: { __typename?: 'UnifiedGpsConnection', total: number, limit: number, offset: number, items: Array<{ __typename?: 'UnifiedGpsPoint', source: string, identifier: string, latitude: number, longitude: number, timestamp: string, accuracy?: number | null, battery?: number | null, speed_kmh?: number | null, heart_rate?: number | null, created_at?: string | null }> } };

export type DailySummaryQueryVariables = Exact<{
  date_from?: InputMaybe<Scalars['String']['input']>;
  date_to?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type DailySummaryQuery = { __typename?: 'Query', dailySummary: Array<{ __typename?: 'DailyActivitySummary', activity_date?: string | null, owntracks_device?: string | null, owntracks_points?: number | null, min_battery?: number | null, max_battery?: number | null, avg_accuracy?: number | null, garmin_sport?: string | null, garmin_activities?: number | null, total_distance_km?: number | null, total_duration_seconds?: number | null, avg_heart_rate?: number | null, total_calories?: number | null }> };


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
      calories
      avg_speed_kmh
      max_speed_kmh
      total_ascent_m
      total_descent_m
      total_distance
      avg_pace
      device_manufacturer
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
    avg_cadence
    max_cadence
    calories
    avg_speed_kmh
    max_speed_kmh
    total_ascent_m
    total_descent_m
    total_distance
    avg_pace
    device_manufacturer
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
export const GarminChartDataDocument = gql`
    query GarminChartData($activity_id: String!) {
  garminChartData(activity_id: $activity_id) {
    timestamp
    altitude
    distance_from_start_km
    speed_kmh
    heart_rate
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
    query UnifiedGps($source: String, $date_from: String, $date_to: String, $limit: Int, $offset: Int, $order: SortOrder) {
  unifiedGps(
    source: $source
    date_from: $date_from
    date_to: $date_to
    limit: $limit
    offset: $offset
    order: $order
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
    query DailySummary($date_from: String, $date_to: String, $limit: Int) {
  dailySummary(date_from: $date_from, date_to: $date_to, limit: $limit) {
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