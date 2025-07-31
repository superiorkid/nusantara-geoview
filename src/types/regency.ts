export interface Regency {
  type: string;
  features: Feature[];
}

export interface Feature {
  type: string;
  geometry?: Geometry;
  properties: Properties;
}

export interface Geometry {
  type: string;
  coordinates: any[][][];
}

export interface Properties {
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
}
