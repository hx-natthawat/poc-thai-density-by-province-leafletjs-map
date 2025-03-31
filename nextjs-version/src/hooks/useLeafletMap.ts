"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

type UseLeafletMapOptions = {
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
};

// Global registry to track map instances by container ID
// This helps prevent duplicate initialization
const mapRegistry: Record<string, boolean> = {};

export function useLeafletMap(containerId: string, options: UseLeafletMapOptions) {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const initAttemptedRef = useRef(false);

  // Cleanup function to properly remove map instance
  const cleanupMap = () => {
    if (mapRef.current) {
      // Remove the map instance
      mapRef.current.remove();
      mapRef.current = null;
      
      // Remove from registry
      delete mapRegistry[containerId];
      
      // Update state
      setIsMapReady(false);
    }
  };

  useEffect(() => {
    // Skip server-side rendering
    if (typeof window === 'undefined') return;
    
    // Clean up any existing map instance first
    cleanupMap();
    
    // Clear any existing initialization flags
    initAttemptedRef.current = false;
    
    // Initialize map with a delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      // Check if we already tried to initialize
      if (initAttemptedRef.current) return;
      initAttemptedRef.current = true;
      
      // Check if this container already has a map in the registry
      if (mapRegistry[containerId]) {
        console.warn(`Map already exists for container '${containerId}'. Skipping initialization.`);
        return;
      }
      
      // Get the container element
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Map container with id '${containerId}' not found`);
        return;
      }
      
      // Force cleanup of any existing Leaflet data on the container
      // This addresses the "Map container is already initialized" error
      const leafletContainer = container as HTMLElement & { _leaflet_id?: number };
      if (leafletContainer._leaflet_id) {
        console.warn(`Cleaning up existing Leaflet data on container '${containerId}'`);
        delete leafletContainer._leaflet_id;
      }
      
      try {
        // Register this map in our registry
        mapRegistry[containerId] = true;
        
        // Create the map instance
        console.log(`Creating new map for container '${containerId}'`);
        const map = L.map(container, {
          center: options.center,
          zoom: options.zoom,
          zoomControl: options.zoomControl ?? true,
        });
        
        // Store the map reference and update state
        mapRef.current = map;
        setIsMapReady(true);
        
        // Make sure the map is properly sized
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } catch (error) {
        console.error(`Error initializing map for container '${containerId}':`, error);
        // Clean up registry on error
        delete mapRegistry[containerId];
      }
    }, 200);
    
    // Clean up on unmount or when dependencies change
    return () => {
      clearTimeout(initTimer);
      cleanupMap();
    };
  }, [containerId]); // Only re-run when containerId changes
  
  // Handle options changes separately to avoid full re-initialization
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    // Update map options when they change
    mapRef.current.setView(options.center, options.zoom);
    
    // Update zoom control
    if (options.zoomControl !== undefined) {
      if (options.zoomControl) {
        mapRef.current.addControl(new L.Control.Zoom());
      } else {
        // Find and remove zoom control
        mapRef.current.getContainer().querySelectorAll('.leaflet-control-zoom').forEach(el => {
          el.remove();
        });
      }
    }
  }, [options.center, options.zoom, options.zoomControl, isMapReady]);

  return { map: mapRef.current, isMapReady };
}
