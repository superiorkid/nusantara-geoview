export interface Province {
  type: string;
  features: Feature[];
}

export interface Feature {
  type: string;
  geometry: Geometry;
  properties: Properties;
  id: string;
}

export interface Geometry {
  type: string;
  coordinates: any[][][];
}

export interface Properties {
  KODE_PROV: string;
  PROVINSI: string;
}
