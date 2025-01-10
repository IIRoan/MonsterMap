import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader2 } from 'lucide-react'
import LocationSidebar from "./components/location-sidebar"
import { MapProvider } from "./components/map-context"

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-[#95ff00]" />
    </div>
  ),
})

export default function Page() {
  return (
    <MapProvider>
      <main className="flex h-screen w-full overflow-hidden bg-black">
        <LocationSidebar />
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#95ff00]" />
            </div>
          }
        >
          <Map />
        </Suspense>
      </main>
    </MapProvider>
  )
}

