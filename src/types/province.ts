import type { GeoJsonObject } from "geojson";

export interface ProvinceProperties {
  id: number;
  name: string;
  // eslint-disable-next-line
  [key: string]: any;
}

export interface ProvinceGeoJSON extends GeoJsonObject {
  type: "FeatureCollection";
  features: ProvinceFeature[];
}

export interface ProvinceFeature extends GeoJSON.Feature {
  properties: ProvinceProperties;
  geometry: GeoJSON.Geometry;
}
