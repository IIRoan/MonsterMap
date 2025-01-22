"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import type { Location } from "@/types/Location"
import { useMap } from "./map-context"
import { useLocations } from "@/hooks/useLocations"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import EditLocationModal from "./editmodal"
import { motion, AnimatePresence } from "framer-motion"

const Map = () => {
  const router = useRouter()
  const { locations, loading, error, refetch } = useLocations()
  const [mounted, setMounted] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const { mapRef } = useMap()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setMounted(true)
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setUserLocation([data.latitude, data.longitude])
      })
      .catch(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              setUserLocation([position.coords.latitude, position.coords.longitude])
            },
            () => setUserLocation([52.3676, 4.9041])
          )
        }
      })
  }, [])

  if (!mounted || loading || !userLocation) return null
  if (error) return <div>Error loading locations</div>

  const MapComponent = () => {
    const center = userLocation

    const svgIcon = `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37892 10.2236L8 16L12.6211 10.2236C13.5137 9.10788 14 7.72154 14 6.29266V6C14 2.68629 11.3137 0 8 0C4.68629 0 2 2.68629 2 6V6.29266C2 7.72154 2.4863 9.10788 3.37892 10.2236ZM8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" fill="#95ff00"/>
      </svg>
    `

    const L = require('leaflet')
    const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet')
    require("leaflet/dist/leaflet.css")

    const customIcon = L.divIcon({
      html: `<div style="width: 28px; height: 28px;">${svgIcon}</div>`,
      className: 'custom-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    })

    return (
      <div className="relative h-screen w-full">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="fixed right-4 top-4 z-[49] md:right-6 md:top-6"
          >
            <Button
              variant="outline"
              className="flex h-10 items-center gap-2 border-white/20 bg-black/90 px-4 text-sm text-[#95ff00] backdrop-blur-xl transition-all duration-300 hover:border-[#95ff00]/30 hover:bg-black/95 hover:text-[#95ff00]/90 hover:shadow-lg hover:shadow-[#95ff00]/10 active:scale-[0.98] md:h-11 md:text-base"
              onClick={() => router.push('/submit')}
            >
              <Plus className="h-4 w-4" />
              New Location
            </Button>
          </motion.div>
        </AnimatePresence>

        <style jsx global>{`
          .custom-marker {
            background: none;
            border: none;
            transition: transform 0.2s ease;
          }
          
          .custom-marker:hover {
            transform: scale(1.1);
          }
          
          .leaflet-popup-content-wrapper {
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(16px);
            border-radius: 12px;
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
            margin: 8px !important;
            transition: all 0.2s ease !important;
          }
          
          .leaflet-popup-close-button:hover {
            color: rgba(149, 255, 0, 0.8) !important;
            transform: rotate(90deg);
          }

          .leaflet-container {
            background: rgba(0, 0, 0, 0.8);
          }

          .leaflet-tile {
            filter: grayscale(100%) brightness(1.5);
          }

          .leaflet-control-attribution {
            background: rgba(0, 0, 0, 0.95) !important;
            backdrop-filter: blur(8px);
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 11px;
          }

          .leaflet-control-attribution,
          .leaflet-control-attribution a {
            color: #9ca3af !important; 
            opacity: 0.6;
            transition: all 0.2s ease;
            text-decoration: none !important;
          }

          .leaflet-control-attribution a:hover {
            color: #d1d5db !important;
            opacity: 1;
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
              <Popup>
                <div className="p-4 md:p-6">
                  <h3 className="text-base font-light tracking-wide text-white md:text-lg">
                    {location.name}
                  </h3>
                  <p className="mt-2 text-xs text-white/50 md:text-sm">
                    {location.address}
                  </p>
                  {location.variants.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2">
                      {location.variants.map((variant) => (
                        <span
                          key={variant}
                          className="rounded-full bg-[#95ff00]/10 px-2 py-1 text-[10px] font-light text-[#95ff00] transition-all duration-300 hover:bg-[#95ff00]/20 md:px-2.5 md:py-1 md:text-xs"
                        >
                          {variant}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setSelectedLocation(location)
                        setEditModalOpen(true)
                      }}
                      className="w-full bg-[#95ff00]/10 text-[#95ff00] transition-all duration-300 hover:bg-[#95ff00]/20 active:scale-[0.98]"
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
    )
  }

  const MapWithNoSSR = dynamic(() => Promise.resolve(MapComponent), {
    ssr: false
  })

  return (
    <>
      <MapWithNoSSR />
      <EditLocationModal
        location={selectedLocation}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedLocation(null)
        }}
        onLocationUpdated={() => refetch()}
      />
    </>
  )
}

export default Map