"use client"

import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { locations } from "./map"
import { useMap } from "./map-context"

export default function LocationSidebar() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false) // Update 1: Added state for controlling the sheet
  const { mapRef } = useMap()

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(search.toLowerCase()) ||
      location.address.toLowerCase().includes(search.toLowerCase())
  )

  const handleLocationClick = (coordinates: [number, number]) => {
    mapRef.current?.flyTo(coordinates, 16, {
      duration: 1.5,
    })
    setOpen(false) // Update 3: Added setOpen(false) to close the sheet after clicking a location
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}> {/* Update 2: Updated Sheet component to use the state */}
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute left-6 top-6 z-[1000] border-white/10 bg-black/90 backdrop-blur-xl hover:border-[#95ff00]/20 hover:bg-black/95"
        >
          <Search className="h-4 w-4 text-[#95ff00]" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] border-r border-[#95ff00]/10 bg-black/95 p-0 backdrop-blur-xl"
      >
        <SheetHeader className="border-b border-[#95ff00]/10 p-6">
          <SheetTitle className="text-lg font-light tracking-wider text-[#95ff00]">LOCATIONS</SheetTitle>
        </SheetHeader>
        <div className="p-6">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none bg-white/5 font-light tracking-wide text-white placeholder:text-white/30"
          />
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-2 p-6">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationClick(location.coordinates as [number, number])}
                className="group w-full space-y-1.5 rounded-lg border border-white/5 bg-white/5 p-4 text-left transition-colors hover:border-[#95ff00]/20 hover:bg-white/10"
              >
                <h3 className="font-light tracking-wide text-white">{location.name}</h3>
                <p className="text-sm text-white/50">{location.address}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {location.variants.map((variant) => (
                    <span
                      key={variant}
                      className="rounded-full bg-[#95ff00]/10 px-2 py-0.5 text-xs font-light text-[#95ff00]"
                    >
                      {variant}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

