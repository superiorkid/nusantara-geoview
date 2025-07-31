import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { ProvinceFeature, ProvinceGeoJSON } from "../types/province";
import type { RegencyGeoJSON } from "../types/regency";

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
  const selectedProvinceRef = useRef<ProvinceFeature | null>(null);
  const [provinceData, setProvinceData] = useState<ProvinceGeoJSON | null>(
    null
  );

  const [regencyData, setRegencyData] = useState<RegencyGeoJSON | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -2.5489, 118.0149,
  ]);
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceFeature | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const zoomToProvince = useCallback((feature: ProvinceFeature) => {
    if (!mapRef.current) return;

    setSelectedProvince(feature);
    selectedProvinceRef.current = feature;

    const map = mapRef.current;
    const bounds = L.geoJSON(feature).getBounds();

    // Calculate the offset - we'll reserve 25% of the map width for sidebar
    const mapWidth = map.getSize().x;
    const offsetPercentage = 0.25;
    const offsetPixels = mapWidth * offsetPercentage;

    // Fly to the bounds with left padding
    map.flyToBounds(bounds, {
      paddingTopLeft: [offsetPixels, 0], // Leave space on the left
      paddingBottomRight: [0, 0], // No padding on right
      duration: 1,
    });

    setSelectedProvince(feature);
  }, []);

  const provinceStyle = useCallback(
    (feature?: ProvinceFeature): L.PathOptions => {
      if (!feature) return {};

      const isSelected =
        selectedProvince?.properties?.PROVINSI === feature.properties.PROVINSI;

      return {
        fillColor: isSelected ? "#3b82f6" : "#f1f5f9",
        weight: isSelected ? 2 : 1,
        color: isSelected ? "#fff" : "#e2e8f0",
        fillOpacity: isSelected ? 0.8 : 0.6,
        opacity: isSelected ? 1 : 0.7,
      };
    },
    [selectedProvince]
  );

  const onEachProvince = useCallback(
    (feature: ProvinceFeature, layer: L.Layer) => {
      if ("setStyle" in layer) {
        const pathLayer = layer as L.Path;
        // const defaultStyle = provinceStyle(feature);

        // const originalColor = defaultStyle.fillColor;
        if (feature.properties?.PROVINSI) {
          pathLayer.bindPopup(`<b>${feature.properties.PROVINSI}</b>`);
        }

        pathLayer.on({
          // mouseover: () => {
          //   pathLayer.setStyle({
          //     weight: 2,
          //     color: "#fff",
          //     dashArray: "",
          //     fillOpacity: 0.9,
          //     fillColor: originalColor,
          //   });
          //   pathLayer.bringToFront();
          // },
          // mouseout: () => {
          //   pathLayer.setStyle({ ...defaultStyle, fillColor: originalColor });
          // },
          click: () => {
            if (selectedProvinceRef.current) return;
            zoomToProvince(feature);
          },
        });
      }
    },
    [zoomToProvince]
  );

  const filteredRegencies = useMemo(() => {
    if (!selectedProvince || !regencyData) return null;

    const provinceName = selectedProvince.properties.PROVINSI;

    return {
      ...regencyData,
      features: regencyData.features.filter(
        (feature) => feature.properties.WADMPR === provinceName
      ),
    };
  }, [selectedProvince, regencyData]);

  useEffect(() => {
    fetch("/data/province.json")
      .then((response) => response.json())
      .then((data: ProvinceGeoJSON) => setProvinceData(data))
      .catch((error) =>
        console.error("Error loading province GeoJSON:", error)
      );
  }, []);

  useEffect(() => {
    fetch("/data/regency.json")
      .then((res) => res.json())
      .then((data: RegencyGeoJSON) => setRegencyData(data))
      .catch((err) => console.error("Failed to load regency data", err));
  }, []);

  const handleReset = () => {
    setSelectedProvince(null);
    selectedProvinceRef.current = null;
    if (mapRef.current) {
      mapRef.current.flyTo(mapCenter, mapZoom);
    }
  };

  return (
    <div className="relative">
      {selectedProvince && (
        <div className="absolute left-4 top-4 z-[1000] bg-white p-4 rounded-lg shadow-lg w-64">
          <h2 className="text-xl font-bold mb-2">
            {selectedProvince.properties.PROVINSI}
          </h2>
          <button
            onClick={handleReset}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reset View
          </button>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        className="h-[100dvh] w-[100vw]"
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
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

        {filteredRegencies && (
          <GeoJSON
            data={filteredRegencies}
            style={{
              color: "#38bdf8", // border color: sky-400
              weight: 1,
              fillColor: "#bae6fd", // fill: sky-200
              fillOpacity: 0.6,
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.WADMKK) {
                layer.bindPopup(`<b>${feature.properties.WADMKK}</b>`);
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapIndonesia;
