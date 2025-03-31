"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Loading } from "@/components/ui/loading";
import { Container } from "@/components/layout/container";
import { MapMetadata } from "./MapMetadata";
import { MobileMapControls } from "./MobileMapControls";
import type { Map as LeafletMap } from "leaflet";

// Dynamically import the Map component with no SSR to avoid Leaflet issues
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full rounded-lg bg-gray-100 flex items-center justify-center">
      <Loading size="lg" message="Loading map..." />
    </div>
  ),
});

export default function ThaiDensityMap() {
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  
  // Function to handle map instance reference
  const handleMapInstance = (map: LeafletMap) => {
    mapRef.current = map;
  };
  
  // Function to reset map view to default
  const resetMapView = () => {
    if (mapRef.current) {
      // Reset to Thailand bounds
      mapRef.current.setView([13.7563, 100.5018], 6);
    }
  };

  return (
    <Container maxWidth="xl" className="py-6">
      <div className="flex flex-col gap-6" role="region" aria-label="Thai Population Density Map application">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Thai Population Density Map</h1>
        <p className="text-center text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">Interactive visualization of population density across Thailand's provinces</p>
      </div>
      
      {/* Map Metadata */}
      <MapMetadata isOpen={isInfoOpen} onToggle={() => setIsInfoOpen(!isInfoOpen)} />
      
      {/* Controls Card */}
      <div className="flex flex-col gap-4 p-4 bg-card rounded-lg shadow-sm border border-border" role="region" aria-labelledby="map-controls-heading">
        <h2 id="map-controls-heading" className="text-base font-semibold mb-2">Map Controls</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2" role="group" aria-labelledby="background-map-label">
            <label id="background-map-label" className="text-sm font-medium">Background Map</label>
            <div className="flex items-center gap-2">
              <Toggle 
                pressed={showBackground} 
                onPressedChange={setShowBackground}
                aria-label={showBackground ? "Turn off background map" : "Turn on background map"}
                aria-pressed={showBackground}
                aria-describedby="background-status"
                className="data-[state=on]:bg-black dark:data-[state=on]:bg-white data-[state=on]:text-white dark:data-[state=on]:text-black font-semibold border data-[state=on]:border-black dark:data-[state=on]:border-white min-w-[50px] flex justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {showBackground ? "ON" : "OFF"}
              </Toggle>
              <span id="background-status" className="text-sm font-medium text-foreground">
                {showBackground ? "Background visible" : "Background hidden"}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2" role="group" aria-labelledby="opacity-label">
            <label id="opacity-label" className="text-sm font-medium">Background Opacity</label>
            <div className="flex items-center gap-3 w-full">
              <Slider
                disabled={!showBackground}
                value={[backgroundOpacity]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value: number[]) => setBackgroundOpacity(value[0])}
                aria-label="Background opacity"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={backgroundOpacity}
                aria-valuetext={`${Math.round(backgroundOpacity * 100)}%`}
                className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Container with accessibility attributes */}
      <div 
        className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] rounded-lg overflow-hidden shadow-md border border-border bg-card/50"
        role="application"
        aria-label="Interactive map of Thailand population density"
        aria-describedby="map-instructions"
      >
        <div id="map-instructions" className="sr-only">
          This is an interactive map showing population density across Thailand's provinces. 
          Use arrow keys to navigate the map, plus and minus keys to zoom, and Enter to select provinces. 
          Information about selected provinces will be announced to screen readers.
          On mobile devices, use touch gestures to navigate and tap on provinces for details.
        </div>
        <Map
          key={`map-${showBackground}-${backgroundOpacity}`}
          showBackground={showBackground}
          backgroundOpacity={backgroundOpacity}
          onMapInstance={handleMapInstance}
        />
        {/* Mobile-specific map controls */}
        <MobileMapControls map={mapRef.current} onResetView={resetMapView} />
      </div>
      
      <footer className="mt-6 text-center text-xs sm:text-sm text-muted-foreground" role="contentinfo">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>© {new Date().getFullYear()} Thai Population Density Map</span>
          <div className="flex items-center gap-2" aria-label="Technology credits">
            <span>Powered by:</span>
            <a 
              href="https://nextjs.org" 
              className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Next.js (opens in a new window)"
            >
              Next.js
            </a>
            <span>|</span>
            <a 
              href="https://leafletjs.com" 
              className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Leaflet (opens in a new window)"
            >
              Leaflet
            </a>
          </div>
        </div>
      </footer>
      </div>
    </Container>
  );
}
