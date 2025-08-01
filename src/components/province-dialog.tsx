// components/ProvinceDialog.tsx

import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { LatLngExpression } from "leaflet";

interface ProvinceDialogProps {
  open: boolean;
  onClose: () => void;
  provinceFeature: GeoJSON.Feature | null;
}

export function ProvinceDialog({
  open,
  onClose,
  provinceFeature,
}: ProvinceDialogProps) {
  const center =
    provinceFeature?.geometry?.type === "Polygon"
      ? getPolygonCenter(provinceFeature.geometry.coordinates[0])
      : [0, 0]; // fallback

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {provinceFeature?.properties?.PROVINSI || "Selected Province"}
          </DialogTitle>
        </DialogHeader>

        {provinceFeature && (
          <MapContainer
            center={center as LatLngExpression}
            zoom={7}
            style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            doubleClickZoom={false}
            attributionControl={false}
          >
            <GeoJSON
              key={provinceFeature.properties?.PROVINSI}
              data={provinceFeature}
              style={{
                fillColor: "#4ADE80", // green
                fillOpacity: 0.7,
                color: "#16A34A",
                weight: 2,
              }}
            />
          </MapContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Utility to get polygon center
function getPolygonCenter(coords: number[][]): [number, number] {
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [lat, lng];
}
