"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";

// Dynamically import the Map component with no SSR to avoid Leaflet issues
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[80vh] w-full max-w-5xl rounded-md bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function ThaiDensityMap() {
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-center">Thai Population Density Map</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-card rounded-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Background:</span>
          <Toggle 
            pressed={showBackground} 
            onPressedChange={setShowBackground}
            aria-label="Toggle background"
          >
            {showBackground ? "On" : "Off"}
          </Toggle>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-1/2">
          <span className="text-sm font-medium whitespace-nowrap">Opacity:</span>
          <Slider
            disabled={!showBackground}
            value={[backgroundOpacity]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(value: number[]) => setBackgroundOpacity(value[0])}
            aria-label="Background opacity"
          />
          <span className="text-sm w-8">{Math.round(backgroundOpacity * 100)}%</span>
        </div>
      </div>
      
      <div className="relative w-full h-[80vh] rounded-md overflow-hidden shadow-md border border-border">
        <Map
          key={`map-${showBackground}-${backgroundOpacity}`}
          showBackground={showBackground}
          backgroundOpacity={backgroundOpacity}
        />
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Data sources: <a href="https://github.com/apisit/thailand.json" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">Thailand GeoJSON</a> | 
        Map powered by <a href="https://leafletjs.com" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">Leaflet</a>
      </div>
    </div>
  );
}
