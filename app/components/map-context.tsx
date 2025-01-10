"use client"

import { createContext, useContext, useRef } from "react"
import { Map as LeafletMap } from "leaflet"

type MapContextType = {
  mapRef: React.MutableRefObject<LeafletMap | null>
}

const MapContext = createContext<MapContextType | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<LeafletMap | null>(null)

  return (
    <MapContext.Provider value={{ mapRef }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}

