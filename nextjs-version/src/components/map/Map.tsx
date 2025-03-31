"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import L from "leaflet";
import { Loading } from "@/components/ui/loading";
import { debounce, throttle, lazyLoad } from "@/utils/performance";

// Import Leaflet CSS in the component to avoid SSR issues
import "leaflet/dist/leaflet.css";
// Import optimized map styles - using relative path to ensure it works
import "../../styles/map.css";

type MapProps = {
  showBackground: boolean;
  backgroundOpacity: number;
};

type ProvinceProperties = {
  name: string;
  p: number; // population density
};

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry, ProvinceProperties>;

// Define custom control classes
class CustomInfoControl extends L.Control {
  _div: HTMLElement;

  constructor(options?: L.ControlOptions) {
    super(options || { position: "topright" });
    this._div = document.createElement("div");
  }

  onAdd(map: L.Map): HTMLElement {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  }

  update(props?: ProvinceProperties): void {
    this._div.innerHTML =
      "<h4>Thai Population Density</h4>" +
      (props
        ? "<p><strong style='font-weight:600'>" +
          props.name +
          "</strong><br />" +
          (props.p ? props.p.toLocaleString() : props.p) +
          " <span style='font-weight:500'>people / km<sup>2</sup></span></p>"
        : "<p>Hover over a province</p>");
  }
}

class CustomLegendControl extends L.Control {
  _div: HTMLElement;
  getColor: (d: number) => string;

  constructor(getColorFn: (d: number) => string, options?: L.ControlOptions) {
    super(options || { position: "bottomright" });
    this._div = document.createElement("div");
    this.getColor = getColorFn;
  }

  onAdd(map: L.Map): HTMLElement {
    this._div = L.DomUtil.create("div", "info legend");
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    let labels = [];
    
    // Add a title to the legend
    labels.push('<div class="title">Population Density</div>');

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];

      labels.push(
        '<div><i style="background:' +
          this.getColor(from + 1) +
          '"></i> ' +
          '<span style="line-height:18px">' + 
          from.toLocaleString() + 
          (to ? "&ndash;" + to.toLocaleString() : "+") + 
          ' people/km²</span></div>'
      );
    }

    this._div.innerHTML = labels.join('');
    return this._div;
  }
}

// No need for MapEvents component with our custom hook approach

export default function Map({ showBackground, backgroundOpacity }: MapProps) {
  // Use refs to store map-related objects
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const infoControlRef = useRef<CustomInfoControl | null>(null);
  const legendControlRef = useRef<CustomLegendControl | null>(null);

  // State for tracking map readiness and data
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoJSONData, setGeoJSONData] = useState<GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    ProvinceProperties
  > | null>(null);

  // Function to determine color based on population density
  const getColor = (d: number) => {
    return d > 1000
      ? "#800026"
      : d > 500
      ? "#BD0026"
      : d > 200
      ? "#E31A1C"
      : d > 100
      ? "#FC4E2A"
      : d > 50
      ? "#FD8D3C"
      : d > 20
      ? "#FEB24C"
      : d > 10
      ? "#FED976"
      : "#FFEDA0";
  };

  // Style function for GeoJSON - memoized for better performance
  const style = useMemo(() => {
    // Use the correct type for Leaflet GeoJSON style function
    return (feature: GeoJSON.Feature<GeoJSON.Geometry, ProvinceProperties> | undefined) => {
      if (!feature) return {};
      return {
        fillColor: getColor(feature.properties.p),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
      };
    };
  }, [getColor]);

  // Define a more specific type for the GeoJSON layers
  type GeoJSONLayer = L.Layer & {
    feature?: GeoJSON.Feature<GeoJSON.Geometry, ProvinceProperties>;
    setStyle?: (style: L.PathOptions) => void;
  };

  // Track the currently highlighted layer with proper typing
  const highlightedLayerRef = useRef<GeoJSONLayer | null>(null);
  // Track all highlighted layers for cleanup
  const highlightedLayersRef = useRef<Set<GeoJSONLayer>>(new Set());

  // Reset all highlights - used to ensure only one feature is highlighted at a time
  const resetAllHighlights = useCallback(() => {
    if (geoJSONData) {
      // Reset all highlighted layers
      highlightedLayersRef.current.forEach(layer => {
        if (layer && layer.feature && layer.setStyle) {
          layer.setStyle(style(layer.feature));
        }
      });
      // Clear the set
      highlightedLayersRef.current.clear();
      highlightedLayerRef.current = null;
      infoControlRef.current?.update();
    }
  }, [geoJSONData, style]);

  // Highlight feature on hover - with improved handling for fast movements
  const highlightFeature = useCallback((e: L.LeafletEvent) => {
    // Reset any existing highlights first
    resetAllHighlights();
    
    const layer = e.target as GeoJSONLayer;
    // Apply highlight style if the layer has setStyle method
    if (layer.setStyle) {
      layer.setStyle({
        weight: 5,
        color: "#666",
        dashArray: "",
        fillOpacity: 0.7,
      });
    }

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      if ('bringToFront' in layer) {
        (layer as any).bringToFront();
      }
    }

    // Track this layer as highlighted
    highlightedLayerRef.current = layer;
    highlightedLayersRef.current.add(layer);
    // Only update info if feature exists and has properties
    if (layer.feature && layer.feature.properties) {
      infoControlRef.current?.update(layer.feature.properties);
    }
  }, [resetAllHighlights]);

  // Reset highlight on mouseout - with improved handling
  const resetHighlight = useCallback((e: L.LeafletEvent) => {
    // Use a small timeout to prevent flickering during fast mouse movements
    setTimeout(() => {
      const layer = e.target as GeoJSONLayer;
      // Only reset if we're not already hovering over another feature
      if (highlightedLayerRef.current === layer) {
        if (layer.setStyle && layer.feature) {
          layer.setStyle(style(layer.feature));
        }
        highlightedLayersRef.current.delete(layer);
        highlightedLayerRef.current = null;
        infoControlRef.current?.update();
      }
    }, 30);
  }, [style]);

  // Zoom to feature on click - throttled to prevent multiple rapid zooms
  const zoomToFeature = useCallback(
    throttle((e: L.LeafletEvent) => {
      const map = e.target._map;
      map.fitBounds(e.target.getBounds());
    }, 300), // Throttle to prevent multiple rapid zooms
    []
  );

  // Set up event handlers for each feature - with proper typing and improved event handling
  const onEachFeature = useCallback((feature: GeoJSON.Feature<GeoJSON.Geometry, ProvinceProperties>, layer: L.Layer) => {
    if (!feature || !layer) return;
    
    // Use a more robust approach for event handling
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,
    });
  }, [highlightFeature, resetHighlight, zoomToFeature]);

  // Add a reference to store the GeoJSON layer for global operations
  const geoJSONLayerRef = useRef<L.GeoJSON | null>(null);

  // Direct fetch for GeoJSON data without lazy loading to debug the issue
  const fetchGeoJSON = async () => {
    console.log("Directly fetching GeoJSON data from local file...");
    try {
      const response = await fetch("/geo-data/thailandwithdensity.json");
      
      if (!response.ok) {
        console.error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log("GeoJSON data fetched, length:", text.length);
      
      try {
        const parsed = JSON.parse(text);
        console.log("GeoJSON data parsed successfully");
        return parsed;
      } catch (parseError: unknown) {
        console.error("Error parsing GeoJSON data:", parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Error parsing GeoJSON data: ${errorMessage}`);
      }
    } catch (fetchError) {
      console.error("Error fetching GeoJSON data:", fetchError);
      throw fetchError;
    }
  };

  // Fetch GeoJSON data directly without lazy loading for debugging
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we already have data
        if (geoJSONData) {
          console.log('Using cached GeoJSON data');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        console.log('Starting direct GeoJSON data fetch...');
        
        // Direct fetch without lazy loading to debug the issue
        try {
          const data = await fetchGeoJSON();
          console.log('GeoJSON data loaded successfully:', data ? 'Data received' : 'No data received');
          
          if (!data) {
            throw new Error('Received empty GeoJSON data');
          }
          
          setGeoJSONData(data);
          setIsLoading(false);
        } catch (fetchError) {
          console.error('Error fetching GeoJSON:', fetchError);
          throw fetchError; // Re-throw to be caught by outer try/catch
        }
      } catch (error) {
        console.error("Error in GeoJSON data loading:", error);
        setError(error instanceof Error ? error.message : "Failed to load map data");
        setIsLoading(false);
        
        // Attempt to retry loading after a delay
        setTimeout(() => {
          console.log('Retrying GeoJSON data fetch...');
          fetchData();
        }, 3000);
      }
    };

    fetchData();
  }, [geoJSONData]);

  // Initialize the map - improved to ensure proper initialization after data is loaded
  useEffect(() => {
    // Skip on server side or if there's an error
    if (typeof window === "undefined" || error) return;

    // Clean up function
    const cleanup = () => {
      if (mapRef.current) {
        console.log("Cleaning up map...");
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };

    // Only initialize when data is available and container is ready
    if (!containerRef.current || !geoJSONData) {
      console.log("Map initialization waiting for container and data...");
      console.log("Container ready:", !!containerRef.current);
      console.log("GeoJSON data ready:", !!geoJSONData);
      return;
    }
    
    // If map is already initialized, clean it up first
    if (mapRef.current) {
      console.log("Map already exists, cleaning up before reinitializing...");
      cleanup();
    }
    
    // Ensure the container is properly mounted in the DOM before initializing
    if (!document.body.contains(containerRef.current)) {
      console.log("Container is not in the DOM yet, delaying initialization...");
      const checkInterval = setInterval(() => {
        if (containerRef.current && document.body.contains(containerRef.current)) {
          console.log("Container is now in the DOM, proceeding with initialization");
          clearInterval(checkInterval);
          // Call this effect again now that the container is ready
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    try {
      console.log("Initializing map...");
      // Create map instance with mobile-friendly options
      const map = L.map(containerRef.current, {
        center: [13, 101.5],
        zoom: 5,
        zoomControl: false, // We'll add zoom control in a better position for mobile
        attributionControl: false, // We'll add attribution control in a better position
        minZoom: 4,
        maxZoom: 10,
        maxBounds: L.latLngBounds(
          L.latLng(5, 95), // Southwest corner
          L.latLng(21, 110) // Northeast corner
        ),
        bounceAtZoomLimits: true
      });
      
      // Add zoom control to top-left (better for mobile)
      L.control.zoom({ position: 'topleft' }).addTo(map);
      
      // Add attribution control to bottom-left
      L.control.attribution({
        position: 'bottomleft',
        prefix: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Store map reference
      mapRef.current = map;

      // Create info control with improved styling
      const infoControl = new CustomInfoControl();
      // Add custom styling for better mobile appearance
      infoControl.addTo(map);
      infoControlRef.current = infoControl;
      
      // CSS is now loaded from external file for better performance

      // Create legend control with improved styling
      const legendControl = new CustomLegendControl(getColor);
      legendControl.addTo(map);
      legendControlRef.current = legendControl;
      
      // CSS is now loaded from external file for better performance

      // Add tile layer
      const tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          opacity: showBackground ? backgroundOpacity : 0,
        }
      ).addTo(map);
      tileLayerRef.current = tileLayer;

      // Set map as ready
      setIsMapReady(true);

      // Make sure the map is properly sized - with safer check and longer delay
      setTimeout(() => {
        try {
          // Check if map is valid and has a container using proper API methods
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            console.log('Map container is ready, invalidating size...');
            map.invalidateSize({ animate: false });
          } else {
            console.log('Map container not ready yet, skipping invalidateSize');
          }
        } catch (e) {
          console.error('Error when trying to invalidate map size:', e);
        }
      }, 300);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return cleanup;
  }, [geoJSONData, error, containerRef, style, highlightFeature, resetHighlight, zoomToFeature]);

  // Update tile layer when background settings change - with performance optimizations
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    // Use a debounced function to handle opacity changes
    const updateOpacity = debounce((opacity: number) => {
      if (tileLayerRef.current) {
        tileLayerRef.current.setOpacity(opacity);
      }
    }, 50);

    // Only recreate the tile layer when showBackground changes, not on every opacity change
    if (showBackground) {
      if (tileLayerRef.current) {
        // Just update opacity if layer exists
        updateOpacity(backgroundOpacity);
      } else {
        // Create new tile layer with better caching options
        const tileLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            opacity: backgroundOpacity,
            updateWhenIdle: true,  // Only update when map is idle for better performance
            updateWhenZooming: false,  // Don't update during zoom for better performance
            keepBuffer: 2,  // Keep more tiles in memory for smoother panning
            maxNativeZoom: 19,  // Maximum zoom level for which tiles are available
            maxZoom: 22,  // Allow zooming beyond available tiles
            crossOrigin: true  // Enable CORS for better caching
          }
        ).addTo(mapRef.current);
        
        // Store reference
        tileLayerRef.current = tileLayer;
      }
    } else if (tileLayerRef.current) {
      // Remove tile layer if showBackground is false
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    
    // Clean up debounced function
    return () => {
      // TypeScript doesn't know about the cancel property on debounced functions
      (updateOpacity as any).cancel && (updateOpacity as any).cancel();
    };
  }, [showBackground, backgroundOpacity, isMapReady]);

  // Add GeoJSON layer when data is available and map is ready - with performance optimizations
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !geoJSONData) return;

    // Remove existing GeoJSON layer if it exists
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
    }

    // Performance optimization: Use a worker to process GeoJSON data if it's large
    const isLargeDataset = JSON.stringify(geoJSONData).length > 1000000; // 1MB threshold
    console.log(`GeoJSON data size: ${JSON.stringify(geoJSONData).length} bytes`);

    // Create GeoJSON layer with optimized options
    const geoJsonLayer = L.geoJSON(geoJSONData, {
      // Use memoized style function for better performance
      style,
      // Use optimized event handlers
      onEachFeature,
      // Standard GeoJSON options that are supported
      interactive: true,
      bubblingMouseEvents: true
    }).addTo(mapRef.current);
    
    // Apply performance optimizations after layer creation
    // Set the renderer to canvas for better performance with many features
    if (mapRef.current) {
      // @ts-ignore - Apply canvas renderer to the map
      mapRef.current.getRenderer = function() { return L.canvas({ padding: 0.5, tolerance: 10 }); };
    }
    
    // Apply smoothFactor to each path in the layer after creation
    const deviceIsMobile = window.innerWidth < 768;
    const smoothFactor = deviceIsMobile ? 1.5 : 1.0; // Higher smoothFactor = less points = better performance on mobile
    geoJsonLayer.eachLayer((layer) => {
      if (layer instanceof L.Path) {
        // @ts-ignore - Apply smoothFactor to path options
        layer.options.smoothFactor = smoothFactor;
      }
    });

    // Store reference
    geoJsonLayerRef.current = geoJsonLayer;
    
    // Fit map to GeoJSON bounds - with animation disabled for better performance on mobile
    mapRef.current.fitBounds(geoJsonLayer.getBounds(), {
      animate: !deviceIsMobile, // Disable animation on mobile for better performance
      duration: deviceIsMobile ? 0 : 0.5, // Shorter duration on desktop, none on mobile
      padding: [20, 20], // Add padding around bounds
      maxZoom: deviceIsMobile ? 6 : 8 // Lower max zoom on mobile for better performance
    });
    
    // Add resize handler with throttling for better performance
    const handleResize = throttle(() => {
      if (mapRef.current) {
        // Invalidate size to handle container resizing properly
        mapRef.current.invalidateSize();
        
        // Adjust view based on device type when resizing
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== deviceIsMobile && geoJsonLayerRef.current) {
          // Adjust zoom level based on new device type
          mapRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), {
            animate: false,
            padding: [20, 20],
            maxZoom: newIsMobile ? 6 : 8
          });
        }
      }
    }, 200);
    
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      // TypeScript doesn't know about the cancel property on throttled functions
      (handleResize as any).cancel && (handleResize as any).cancel();
    };
  }, [geoJSONData, isMapReady, getColor]);

  // Function to retry data loading
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Force re-fetch by setting geoJSONData to null
    setGeoJSONData(null);
  };
  
  // Server-side rendering fallback
  if (typeof window === "undefined") {
    return (
      <div className="h-full w-full rounded-lg bg-card flex items-center justify-center">
        <Loading size="md" message="Loading map..." />
      </div>
    );
  }

  // Return the map container div with improved responsive styling
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loading size="lg" message="Loading map data..." />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10 p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive text-4xl mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Failed to load map</h3>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Retry loading map data"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {!isMapReady && !error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loading size="lg" message="Initializing map..." />
        </div>
      )}
      
      <div
        ref={containerRef}
        className="h-full w-full z-0"
        aria-label="Interactive map of Thailand showing population density by province"
        role="application"
        aria-busy={isLoading}
        aria-live="polite"
      />
    </div>
  );
}
