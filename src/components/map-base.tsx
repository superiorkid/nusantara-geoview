import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { ProvinceFeature, ProvinceGeoJSON } from "../types/province";
import type { RegencyGeoJSON } from "../types/regency";

const MapIndonesia = () => {
  const selectedProvinceRef = useRef<ProvinceFeature | null>(null);
  const [provinceData, setProvinceData] = useState<ProvinceGeoJSON | null>(
    null
  );
  const [regencyData, setRegencyData] = useState<RegencyGeoJSON | null>(null);
  const [regencyColors, setRegencyColors] = useState<Record<string, string>>(
    {}
  );

  const [mapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [mapZoom] = useState<number>(5);
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceFeature | null>(null);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>(
    {}
  );

  const mapRef = useRef<L.Map | null>(null);

  const zoomToProvince = useCallback(
    (feature: ProvinceFeature) => {
      if (!mapRef.current) return;

      setSelectedProvince(feature);
      selectedProvinceRef.current = feature;

      const map = mapRef.current;
      const bounds = L.geoJSON(feature).getBounds();
      const mapWidth = map.getSize().x;
      const offsetPixels = mapWidth * 0.25;

      map.flyToBounds(bounds, {
        paddingTopLeft: [offsetPixels, 0],
        paddingBottomRight: [0, 0],
        duration: 1,
      });

      // // Assign random color to each regency
      // if (regencyData) {
      //   const provinceName = feature.properties.PROVINSI;
      //   const relatedRegencies = regencyData.features.filter(
      //     (f) => f.properties.WADMPR === provinceName
      //   );

      //   const newColors: Record<string, string> = {};
      //   relatedRegencies.forEach((r) => {
      //     const name = r.properties.WADMKK!;
      //     newColors[name] = `hsl(${Math.floor(Math.random() * 360)}, 65%, 75%)`;
      //   });
      //   setRegencyColors(newColors);
      // }
    },
    [selectedProvinceRef]
  );

  const provinceStyle = useCallback(
    (feature?: ProvinceFeature): L.PathOptions => {
      if (!feature) return {};
      const provinceName = feature.properties.PROVINSI;
      const isSelected =
        selectedProvince?.properties?.PROVINSI === provinceName;

      return {
        fillColor: isSelected
          ? "#60a5fa" // blue-400
          : provinceColors[provinceName] || "#f1f5f9",
        color: isSelected ? "#ffffff" : "#e2e8f0",
        weight: 1,
        fillOpacity: isSelected ? 0 : 0.6,
        opacity: 1,
      };
    },
    [selectedProvince, provinceColors]
  );

  const onEachProvince = useCallback(
    (feature: ProvinceFeature, layer: L.Layer) => {
      if ("setStyle" in layer) {
        const pathLayer = layer as L.Path;
        if (feature.properties?.PROVINSI) {
          pathLayer.bindPopup(`<b>${feature.properties.PROVINSI}</b>`);
        }

        pathLayer.on({
          click: () => {
            if (!selectedProvinceRef.current) {
              zoomToProvince(feature);
            }
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

  const visibleProvinces = useMemo(() => {
    if (!provinceData) return null;
    if (!selectedProvince) return provinceData;

    return {
      ...provinceData,
      features: provinceData.features.filter(
        (f) => f.properties.PROVINSI === selectedProvince.properties.PROVINSI
      ),
    };
  }, [provinceData, selectedProvince]);

  useEffect(() => {
    fetch("/data/province.json")
      .then((res) => res.json())
      .then((data: ProvinceGeoJSON) => {
        setProvinceData(data);
        const colors: Record<string, string> = {};
        data.features.forEach((feature) => {
          const name = feature.properties.PROVINSI;
          colors[name] = `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;
        });
        setProvinceColors(colors);
      })
      .catch((err) => console.error("Error loading province data:", err));
  }, []);

  useEffect(() => {
    fetch("/data/regency.json")
      .then((res) => res.json())
      .then((data: RegencyGeoJSON) => setRegencyData(data))
      .catch((err) => console.error("Error loading regency data:", err));
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

        {visibleProvinces && (
          <GeoJSON
            data={visibleProvinces}
            style={provinceStyle}
            onEachFeature={onEachProvince}
          />
        )}

        {filteredRegencies && (
          <GeoJSON
            data={filteredRegencies}
            style={() => {
              // const regencyName = feature?.properties?.WADMKK;
              return {
                color: "#555555", // dark blue stroke
                weight: 1.2,
                fillColor: "#555555",
                fillOpacity: 0.18,
              };
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
