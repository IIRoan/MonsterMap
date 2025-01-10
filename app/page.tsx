import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader2, Heart } from 'lucide-react'
import LocationSidebar from "./components/location-sidebar"
import { MapProvider } from "./components/map-context"

const Map = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-black/95">
      <div className="absolute inset-0 bg-[radial-gradient(#95ff00_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
      <Loader2 className="h-8 w-8 animate-spin text-[#95ff00]" />
    </div>
  ),
})

export default function Page() {
  return (
    <MapProvider>
      <main className="relative flex h-screen w-full overflow-hidden bg-black/95">
        <div className="absolute inset-0 bg-[radial-gradient(#95ff00_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
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
        <div className="absolute bottom-4 left-4 text-xs text-gray-400 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by{" "}
            <a 
              href="https://github.com/IIRoan/MonsterMap" 
              className="hover:text-[#95ff00] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              @IIRoan
            </a>
          </div>
          <span>Not affiliated with Monster Energy</span>
        </div>
      </main>
    </MapProvider>
  )
}