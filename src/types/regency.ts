import type { GeoJsonObject } from "geojson";

export interface RegencyGeoJSON extends GeoJsonObject {
  type: "FeatureCollection";
  features: RegencyFeature[];
}

export interface RegencyFeature extends GeoJSON.Feature {
  geometry: GeoJSON.Geometry;
  properties: RegencyProperties;
}

export interface RegencyProperties {
  OBJECTID: number;
  NAMOBJ: string;
  FCODE: string;
  REMARK?: string;
  METADATA: string;
  SRS_ID?: string;
  KDBBPS?: string;
  KDCBPS?: string;
  KDCPUM?: string;
  KDEBPS?: string;
  KDEPUM?: string;
  KDPBPS?: string;
  KDPKAB?: string;
  KDPPUM?: string;
  LUASWH: number;
  TIPADM: number;
  WADMKC?: string;
  WADMKD?: string;
  WADMKK?: string;
  WADMPR: string;
  WIADKC?: string;
  WIADKK?: string;
  WIADPR?: string;
  WIADKD?: string;
  UUPP?: string;
  LUAS?: number;
  tempatMenarik?: TTempatMenarik[];
}

type TTempatMenarik = {
  nama: string;
  deskripsi: string;
  alamat: string;
  images: string[];
};
