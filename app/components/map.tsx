"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import type { Location } from "@/types/Location"
import { useMap } from "./map-context"
import { useLocations } from "@/hooks/useLocations"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import EditLocationModal from "./editmodal"

const Map = () => {
  const router = useRouter();
  const { locations, loading, error, refetch } = useLocations();
  const [mounted, setMounted] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { mapRef } = useMap();

  useEffect(() => {
    setMounted(true);
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setUserLocation([data.latitude, data.longitude]);
      })
      .catch(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              setUserLocation([position.coords.latitude, position.coords.longitude]);
            },
            () => setUserLocation([52.3676, 4.9041])
          );
        }
      });
  }, []);

  if (!mounted || loading || !userLocation) return null;
  if (error) return <div>Error loading locations</div>;

  const MapComponent = () => {
    const center = userLocation;

    const svgIcon = `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37892 10.2236L8 16L12.6211 10.2236C13.5137 9.10788 14 7.72154 14 6.29266V6C14 2.68629 11.3137 0 8 0C4.68629 0 2 2.68629 2 6V6.29266C2 7.72154 2.4863 9.10788 3.37892 10.2236ZM8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" fill="#95ff00"/>
      </svg>
    `;

    const L = require('leaflet');
    const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
    require("leaflet/dist/leaflet.css");

    const customIcon = L.divIcon({
      html: `<div>${svgIcon}</div>`,
      className: 'custom-marker',
      iconSize: [28, 28],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    return (
      <div className="h-screen w-full">
        <Button
          variant="outline"
          className="absolute right-6 top-6 z-[1000] border-white/10 bg-black/90 backdrop-blur-xl hover:border-[#95ff00]/20 hover:bg-black/95 text-[#95ff00]"
          onClick={() => router.push('/submit')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Location
        </Button>
        <style jsx global>{`
          .custom-marker {
            background: none;
            border: none;
          }
          
          .leaflet-popup-content-wrapper {
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(16px);
            border-radius: 8px;
            border: 1px solid rgba(149, 255, 0, 0.1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          
          .leaflet-popup-content {
            margin: 0;
            color: white;
          }
          
          .leaflet-popup-tip {
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(149, 255, 0, 0.1);
          }
          
          .leaflet-popup-close-button {
            color: rgba(255, 255, 255, 0.5) !important;
            margin: 4px !important;
          }
          
          .leaflet-popup-close-button:hover {
            color: rgba(149, 255, 0, 0.8) !important;
          }

          .leaflet-container {
            background: rgba(0, 0, 0, 0.95);
          }

          .leaflet-tile-pane {
            background: rgba(0, 0, 0, 0.95);
          }

          .leaflet-tile-loading {
            background: radial-gradient(#95ff00 1px, transparent 1px);
            background-size: 16px 16px;
            opacity: 0.1;
          }

          .leaflet-control-attribution {
            background: rgba(0, 0, 0, 0.95) !important;
            backdrop-filter: blur(8px);
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
          }

          .leaflet-control-attribution,
          .leaflet-control-attribution a {
            color: #9ca3af !important; 
            opacity: 1;
            transition: all 0.2s ease;
            text-decoration: none !important;
          }

          .leaflet-control-attribution a:hover {
            color: #d1d5db !important; 
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
          <div className="absolute inset-0 bg-[radial-gradient(#95ff00_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
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
              <Popup>
                <div className="p-4">
                  <h3 className="text-lg font-light tracking-wide text-white">{location.name}</h3>
                  <p className="mt-2 text-sm text-white/50">{location.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {location.variants.map((variant) => (
                      <span
                        key={variant}
                        className="rounded-full bg-[#95ff00]/10 px-2.5 py-1 text-xs font-light text-[#95ff00]"
                      >
                        {variant}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setSelectedLocation(location);
                        setEditModalOpen(true);
                      }}
                      className="w-full bg-[#95ff00]/10 hover:bg-[#95ff00]/20 text-[#95ff00]"
                    >
                      Edit Location
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  const MapWithNoSSR = dynamic(() => Promise.resolve(MapComponent), {
    ssr: false
  });

  return (
    <>
      <MapWithNoSSR />
      <EditLocationModal
        location={selectedLocation}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedLocation(null);
        }}
        onLocationUpdated={() => refetch()}
      />
    </>
  );
};

export default Map;