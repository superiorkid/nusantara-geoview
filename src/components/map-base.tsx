import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";

interface ProvinceProperties {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface ProvinceGeoJSON extends GeoJsonObject {
  type: "FeatureCollection";
  features: ProvinceFeature[];
}

interface ProvinceFeature extends GeoJSON.Feature {
  properties: ProvinceProperties;
  geometry: GeoJSON.Geometry;
}

// const defaultIcon = L.icon({
//   iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });

const MapIndonesia = () => {
  const [provinceData, setProvinceData] = useState<ProvinceGeoJSON | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -2.5489, 118.0149,
  ]);
  const [mapZoom, setMapZoom] = useState<number>(5);
  const mapRef = useRef<L.Map | null>(null);

  const getRandomColor = useCallback(() => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }, []);

  const provinceStyle = useCallback(
    (feature?: ProvinceFeature): L.PathOptions => {
      if (!feature) return {};

      return {
        fillColor: getRandomColor(),
        weight: 1,
        opacity: 1,
        color: "#fff",
        fillOpacity: 0.8,
      };
    },
    [getRandomColor]
  );

  const onEachProvince = useCallback(
    (feature: ProvinceFeature, layer: L.Layer) => {
      if ("setStyle" in layer) {
        const pathLayer = layer as L.Path;
        const defaultStyle = provinceStyle(feature);

        const originalColor = defaultStyle.fillColor;
        if (feature.properties?.PROVINSI) {
          pathLayer.bindPopup(`<b>${feature.properties.PROVINSI}</b>`);
        }

        pathLayer.on({
          mouseover: () => {
            pathLayer.setStyle({
              weight: 3,
              color: "#fff",
              dashArray: "",
              fillOpacity: 0.9,
              fillColor: originalColor,
            });
            pathLayer.bringToFront();
          },
          mouseout: () => {
            pathLayer.setStyle({ ...defaultStyle, fillColor: originalColor });
          },
        });
      }
    },
    [provinceStyle]
  );

  useEffect(() => {
    fetch("/data/province.json")
      .then((response) => response.json())
      .then((data: ProvinceGeoJSON) => setProvinceData(data))
      .catch((error) =>
        console.error("Error loading province GeoJSON:", error)
      );
  }, []);

  return (
    <div className="">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        className="h-[100dvh] w-[100vw]"
        dragging={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {provinceData && (
          <GeoJSON
            data={provinceData}
            style={provinceStyle}
            onEachFeature={onEachProvince}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapIndonesia;
