"use client"

import { Search, X, MapPin, ChevronRight } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { useLocations } from "@/hooks/useLocations"
import { useMap } from "./map-context"
import type { Location } from "@/types/Location"
import { motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export default function LocationSidebar() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const { mapRef } = useMap()
  const { locations, loading } = useLocations()
  const [mounted, setMounted] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredLocations = locations.filter(
    (location: Location) =>
      location.name.toLowerCase().includes(search.toLowerCase()) ||
      location.address.toLowerCase().includes(search.toLowerCase())
  )

  const handleLocationClick = (coordinates: [number, number]) => {
    mapRef.current?.flyTo(coordinates, 16, {
      duration: 2,
      animate: true,
      easeLinearity: 0.25
    })
    setOpen(false)
  }

  if (!mounted || loading) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!open && (
        <SheetTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed left-4 top-4 z-[49] md:left-6 md:top-6"
          >
            <Button
              variant="outline"
              size="icon"
              className="flex h-10 items-center gap-2 border-white/20 bg-black/90 px-4 backdrop-blur-xl transition-all duration-500 hover:border-[#95ff00]/30 hover:bg-black/95 hover:shadow-lg hover:shadow-[#95ff00]/10 md:h-11"
            >
              <Search className="h-4 w-4 text-[#95ff00]" />
            </Button>
          </motion.div>
        </SheetTrigger>
      )}
      <SheetContent
        side="left"
        className={`z-50 border-r border-[#95ff00]/10 bg-black/95 p-0 backdrop-blur-xl transition-transform duration-500 ${
          isMobile ? 'w-full' : 'w-[400px]'
        }`}
      >
        <SheetHeader className="border-b border-[#95ff00]/10 p-4 md:p-8">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-light tracking-wider text-[#95ff00]">
              <MapPin className="h-5 w-5 md:h-6 md:w-6" />
              LOCATIONS
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="transition-all duration-300 hover:bg-white/10 hover:rotate-90"
            >
              <X className="h-4 w-4 text-white/50" />
            </Button>
          </div>
        </SheetHeader>
        <div className="p-4 md:p-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 md:h-12 border-none bg-white/5 pl-10 font-light tracking-wide text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#95ff00]/20 transition-all duration-300"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-11rem)] md:h-[calc(100vh-12rem)]">
          <div className="grid gap-3 md:gap-4 p-4 md:p-8">
            {filteredLocations.map((location) => (
              <motion.button
                key={location.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleLocationClick(location.coordinates)}
                className="group w-full space-y-2 rounded-xl border border-white/5 bg-white/5 p-4 md:p-6 text-left transition-all duration-300 hover:border-[#95ff00]/20 hover:bg-white/10 hover:shadow-lg hover:shadow-[#95ff00]/5 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-base md:text-lg font-light tracking-wide text-white transition-colors duration-300 group-hover:text-[#95ff00]">
                      {location.name}
                    </h3>
                    <p className="text-xs md:text-sm text-white/50">{location.address}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-white/30 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#95ff00]" />
                </div>
                {location.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {location.variants.map((variant) => (
                      <span
                        key={variant}
                        className="rounded-full bg-[#95ff00]/10 px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-light text-[#95ff00] transition-all duration-300 group-hover:bg-[#95ff00]/20"
                      >
                        {variant}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}