"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smartphone, ZoomIn, ZoomOut, Compass, Info } from "lucide-react";

interface MobileMapControlsProps {
  map: L.Map | null;
  onResetView?: () => void;
}

/**
 * MobileMapControls component provides touch-friendly controls for mobile devices
 * It includes large touch targets and mobile-specific interactions
 */
export function MobileMapControls({ map, onResetView }: MobileMapControlsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Only render on mobile devices
  if (!isMobile || !map) return null;

  const handleZoomIn = () => {
    map.zoomIn();
    // Announce to screen readers
    const announcement = document.getElementById('map-announcer');
    if (announcement) {
      announcement.textContent = `Zoomed in to level ${map.getZoom()}`;
    }
  };

  const handleZoomOut = () => {
    map.zoomOut();
    // Announce to screen readers
    const announcement = document.getElementById('map-announcer');
    if (announcement) {
      announcement.textContent = `Zoomed out to level ${map.getZoom()}`;
    }
  };

  const handleResetView = () => {
    if (onResetView) {
      onResetView();
      // Announce to screen readers
      const announcement = document.getElementById('map-announcer');
      if (announcement) {
        announcement.textContent = 'Map view reset to default';
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000]" aria-label="Mobile map controls">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="default" 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground"
            aria-label="Map controls"
          >
            <Smartphone className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2 flex flex-col gap-2" 
          side="top"
          align="end"
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10" 
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10" 
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10" 
            onClick={handleResetView}
            aria-label="Reset map view"
          >
            <Compass className="h-5 w-5" />
          </Button>
        </PopoverContent>
      </Popover>
      
      {/* Screen reader announcement area (visually hidden) */}
      <div 
        id="map-announcer" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
    </div>
  );
}
