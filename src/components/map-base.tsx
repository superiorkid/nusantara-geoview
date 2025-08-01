import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { ProvinceFeature, ProvinceGeoJSON } from "../types/province";
import type { RegencyGeoJSON } from "../types/regency";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

const MapIndonesia = () => {
  const selectedProvinceRef = useRef<ProvinceFeature | null>(null);
  const [provinceData, setProvinceData] = useState<ProvinceGeoJSON | null>(
    null
  );
  const [regencyData, setRegencyData] = useState<RegencyGeoJSON | null>(null);
  const [selectedRegency, setSelectedRegency] =
    useState<GeoJSON.Feature | null>(null);
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceFeature | null>(null);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>(
    {}
  );
  const [regencyColors, setRegencyColors] = useState<Record<string, string>>(
    {}
  );
  const [mapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [mapZoom] = useState<number>(5);
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

      // Assign random colors to related regencies
      if (regencyData) {
        const provinceName = feature.properties.PROVINSI;
        const relatedRegencies = regencyData.features.filter(
          (f) => f.properties.WADMPR === provinceName
        );

        const newColors: Record<string, string> = {};
        relatedRegencies.forEach((r) => {
          const name = r.properties.WADMKK!;
          newColors[name] = `hsl(${Math.floor(Math.random() * 360)}, 65%, 75%)`;
        });
        setRegencyColors(newColors);
      }
    },
    [regencyData]
  );

  const provinceStyle = useCallback(
    (feature?: ProvinceFeature): L.PathOptions => {
      if (!feature) return {};
      const provinceName = feature.properties.PROVINSI;
      const isSelected =
        selectedProvince?.properties?.PROVINSI === provinceName;

      return {
        fillColor: isSelected
          ? "#60a5fa"
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
    setSelectedRegency(null);
    selectedProvinceRef.current = null;
    if (mapRef.current) {
      mapRef.current.flyTo(mapCenter, mapZoom);
    }
  };

  return (
    <div className="relative">
      {(selectedProvince || selectedRegency) && (
        <div className="absolute left-4 top-4 z-[1000] w-80 max-h-[90vh] overflow-auto">
          <Card className="bg-white text-gray-800 shadow-xl rounded-2xl p-4 space-y-4">
            {selectedProvince && (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedProvince.properties.PROVINSI}
                </h2>
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            )}

            {selectedRegency && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-base font-medium">Detail</h3>

                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 font-semibold pr-2">Kabupaten:</td>
                        <td className="py-2">
                          {selectedRegency.properties?.WADMKK}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold pr-2">Provinsi:</td>
                        <td className="py-2">
                          {selectedRegency.properties?.WADMPR}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold pr-2">
                          Luas Wilayah:
                        </td>
                        <td className="py-2">
                          {selectedRegency.properties?.LUAS} km²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold pr-2">
                          Kode Wilayah:
                        </td>
                        <td className="py-2">
                          {selectedRegency.properties?.KDEPUM}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Tempat Menarik */}
                  {Array.isArray(selectedRegency.properties?.tempatMenarik) &&
                    selectedRegency.properties.tempatMenarik.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-base font-medium">
                          Tempat Menarik
                        </h3>
                        <ul className="space-y-4 text-sm">
                          {selectedRegency.properties.tempatMenarik.map(
                            (tempat, idx) => (
                              <li
                                key={idx}
                                className="border p-3 rounded-md bg-gray-50 space-y-2"
                              >
                                <div className="font-semibold">
                                  {tempat.nama}
                                </div>
                                <div className="text-gray-600">
                                  {tempat.deskripsi}
                                </div>
                                <div className="text-gray-400 italic">
                                  {tempat.alamat}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {tempat.images?.map((src, i) => (
                                    <img
                                      key={i}
                                      src={src}
                                      alt={tempat.nama}
                                      className="rounded-md object-cover w-full h-24"
                                    />
                                  ))}
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSelectedRegency(null)}
                    className="w-full mt-4"
                  >
                    Close Regency
                  </Button>
                </div>
              </>
            )}
          </Card>
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
            style={(feature) => {
              const regencyName = feature?.properties?.WADMKK;
              const isSelected =
                selectedRegency?.properties?.WADMKD ===
                feature?.properties?.WADMKD;

              return {
                color: isSelected ? "#ef4444" : "#555555",
                weight: isSelected ? 3 : 1.2,
                fillColor: regencyColors[regencyName] || "#555555",
                fillOpacity: isSelected ? 0.6 : 0.2,
              };
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.WADMKK) {
                layer.bindPopup(`<b>${feature.properties.WADMKK}</b>`);
                layer.on({
                  click: () => {
                    setSelectedRegency(feature);
                  },
                });
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapIndonesia;
