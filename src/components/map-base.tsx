import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2Icon, MapPinIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { useDebounce } from "../hooks/use-debounce";
import type { ProvinceFeature, ProvinceGeoJSON } from "../types/province";
import type { RegencyFeature, RegencyGeoJSON } from "../types/regency";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

const MapIndonesia = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const debouncedKeyword = useDebounce(searchKeyword, 300);
  const [searchResults, setSearchResults] = useState<RegencyFeature[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const selectedProvinceRef = useRef<ProvinceFeature | null>(null);
  const [provinceData, setProvinceData] = useState<ProvinceGeoJSON | null>(
    null
  );
  const [regencyData, setRegencyData] = useState<RegencyGeoJSON | null>(null);
  const [selectedRegency, setSelectedRegency] =
    useState<GeoJSON.Feature | null>(null);
  const selectedRegencyRef = useRef<GeoJSON.Feature | null>(null);

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

  const handleInputBlur = (e: React.FocusEvent) => {
    // Check if the blur is happening because we're clicking on a result
    const isClickingResult = resultsRef.current?.contains(
      e.relatedTarget as Node
    );

    if (!isClickingResult) {
      setIsInputFocused(false);
    }
  };

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
    const handleSearch = () => {
      if (!debouncedKeyword.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const results =
          regencyData?.features.filter((regency) =>
            regency.properties.WADMKK?.toLowerCase().includes(
              debouncedKeyword.toLowerCase()
            )
          ) || [];

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    handleSearch();
  }, [debouncedKeyword, regencyData]);

  const zoomToRegency = useCallback((feature: GeoJSON.Feature) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const bounds = L.geoJSON(feature).getBounds();

    const mapWidth = map.getSize().x;
    const offsetPixels = mapWidth * 0.3;

    map.flyToBounds(bounds, {
      paddingTopLeft: [offsetPixels, 50],
      paddingBottomRight: [50, 50],
      duration: 1,
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
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
      .catch((err) => console.error("Error loading province data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch("/data/regency.json")
      .then((res) => res.json())
      .then((data: RegencyGeoJSON) => setRegencyData(data))
      .catch((err) => console.error("Error loading regency data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleReset = () => {
    setSelectedProvince(null);
    setSelectedRegency(null);
    selectedProvinceRef.current = null;
    selectedRegencyRef.current = null;
    if (mapRef.current) {
      mapRef.current.flyTo(mapCenter, mapZoom);
    }
  };

  return (
    <div className="relative">
      {/* loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-lg">
            <Loader2Icon
              size={35}
              strokeWidth={2}
              className="animate-spin stroke-sky-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Loading map data...
            </span>
          </div>
        </div>
      )}

      {(selectedProvince || selectedRegency) && (
        <div className="absolute left-4 top-4 z-[1000] w-[341px] 2lx:w-[473px] max-h-[90dvh]">
          <Card className="bg-background text-foreground shadow-2xl rounded-2xl border h-full flex flex-col">
            {selectedProvince && (
              <div className="px-4">
                <div className="flex items-center justify-between">
                  <h2 className="2xl:text-xl text-base font-bold line-clamp-1">
                    {selectedProvince.properties.PROVINSI}
                  </h2>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {selectedRegency && (
              <>
                <Separator />
                <div className="flex-1 overflow-auto">
                  <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 sticky top-0 bg-background z-10 py-2">
                      Details
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-max">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="py-2 font-semibold pr-2 whitespace-nowrap">
                              Object ID:
                            </td>
                            <td className="py-2 whitespace-nowrap">
                              {selectedRegency.properties?.OBJECTID}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Feature Code:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.FCODE}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Province:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.WADMPR}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Regency:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.WADMKK}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Area (km²):
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.LUAS}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Region Code (KDEPUM):
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.KDEPUM}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              PUM Code (KDCPUM):
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.KDCPUM}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Administrative Type:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.TIPADM}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Legal Basis:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.UUPP}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Metadata Source:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.METADATA}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-semibold pr-2">
                              Coordinate System:
                            </td>
                            <td className="py-2">
                              {selectedRegency.properties?.SRS_ID}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedRegency(null);
                        selectedRegencyRef.current = null;
                        if (selectedProvince) {
                          zoomToProvince(selectedProvince);
                        }
                      }}
                      className="w-full mt-4"
                    >
                      Close Regency
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <div className="z-[1000] absolute top-5 right-5 bg-background">
        <div className="relative">
          <Input
            className="peer ps-9"
            placeholder="Search regencies..."
            type="search"
            onChange={(event) => setSearchKeyword(event.target.value)}
            value={searchKeyword}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            disabled={!!selectedProvince || !!selectedRegency}
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>

        {isInputFocused && searchKeyword && searchResults.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute right-0 w-[341px] max-w-[calc(100vw-2.5rem)] bg-background mt-1 border rounded-md shadow-lg max-h-[400px] overflow-y-auto"
          >
            {searchResults.map((regency, index) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!selectedRegencyRef.current) {
                    setSearchKeyword(regency.properties.WADMKK || "");
                    setSearchResults([]);
                    setSelectedRegency(regency);
                    selectedRegencyRef.current = regency;
                    zoomToRegency(regency);
                    setIsInputFocused(false);

                    if (
                      !selectedProvince ||
                      selectedProvince.properties.PROVINSI !==
                        regency.properties.WADMPR
                    ) {
                      const parentProvince = provinceData?.features.find(
                        (p) =>
                          p.properties.PROVINSI === regency.properties.WADMPR
                      );
                      if (parentProvince) {
                        setSelectedProvince(parentProvince);
                        selectedProvinceRef.current = parentProvince;
                      }
                    }
                  }
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {regency.properties.WADMKK}
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    <span className="inline-flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {regency.properties.WADMPR}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isInputFocused &&
          searchKeyword &&
          searchResults.length === 0 &&
          !isSearching && (
            <div className="absolute right-0 w-[341px] max-w-[calc(100vw-2.5rem)] bg-background mt-1 border rounded-md shadow-lg p-3 text-muted-foreground">
              No results found
            </div>
          )}

        {isInputFocused && isSearching && (
          <div className="absolute right-0 w-[500px] max-w-[calc(100vw-2.5rem)] bg-background mt-1 border rounded-md shadow-lg p-3 text-muted-foreground">
            Searching...
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        className="h-[100dvh] w-[100vw]"
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
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
                    if (!selectedRegencyRef.current) {
                      setSelectedRegency(feature);
                      selectedRegencyRef.current = feature;
                      zoomToRegency(feature);
                    }
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
