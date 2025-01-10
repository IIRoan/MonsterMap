
"use client"
import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from 'leaflet'
import "leaflet/dist/leaflet.css"
import { useMap } from "./map-context"
import { useLocations } from "@/hooks/useLocations"
import type { Location } from "@/types/Location"

const svgIcon = `
<svg width="36" height="36" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37892 10.2236L8 16L12.6211 10.2236C13.5137 9.10788 14 7.72154 14 6.29266V6C14 2.68629 11.3137 0 8 0C4.68629 0 2 2.68629 2 6V6.29266C2 7.72154 2.4863 9.10788 3.37892 10.2236ZM8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" fill="#95ff00"/>
</svg>
`

const customIcon = L.divIcon({
  html: `<div style="filter: drop-shadow(0 0 6px rgba(149, 255, 0, 0.5));">${svgIcon}</div>`,
  className: 'custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

export default function Map() {
  const { locations, loading, error } = useLocations();
  const [mounted, setMounted] = useState(false);
  const { mapRef } = useMap();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;
  if (error) return <div>Error loading locations</div>;

  const defaultCenter: [number, number] = [52.3676, 4.9041];
  const center = locations[0]?.coordinates || defaultCenter;

  return (
    <div className="h-screen w-full">
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        className="z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        {locations.map((location: Location) => (
          <Marker
            key={location.id}
            position={location.coordinates}
            icon={customIcon}
          >
            <Popup className="rounded-lg border-none bg-black/95 text-white backdrop-blur-xl">
              <div className="p-3">
                <h3 className="font-light tracking-wide">{location.name}</h3>
                <p className="mt-1 text-sm text-white/50">{location.address}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {location.variants.map((variant) => (
                    <span
                      key={variant}
                      className="rounded-full bg-[#95ff00]/10 px-2 py-0.5 text-xs font-light text-[#95ff00]"
                    >
                      {variant}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}