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
    // Add ARIA role and live region for screen readers
    this._div.setAttribute('role', 'region');
    this._div.setAttribute('aria-label', 'Province Information');
    this._div.setAttribute('aria-live', 'polite');
    
    this._div.innerHTML =
      "<h4 id='info-title'>Thai Population Density</h4>" +
      (props
        ? "<p><strong style='font-weight:600'>" +
          props.name +
          "</strong><br />" +
          (props.p ? props.p.toLocaleString() : props.p) +
          " <span style='font-weight:500'>people / km<sup>2</sup></span></p>"
        : "<p>Hover over a province</p>");
    
    // Ensure the control is keyboard focusable
    if (!this._div.hasAttribute('tabindex')) {
      this._div.setAttribute('tabindex', '0');
    }
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
    
    // Add ARIA attributes for accessibility
    this._div.setAttribute('role', 'region');
    this._div.setAttribute('aria-label', 'Map Legend');
    this._div.setAttribute('tabindex', '0');
    
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    let labels = [];
    
    // Add a title to the legend with proper heading semantics
    labels.push('<div class="title" id="legend-title" role="heading" aria-level="2">Population Density</div>');

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];

      labels.push(
        '<div class="legend-item"><i style="background:' +
          this.getColor(from + 1) +
          '" role="presentation" aria-hidden="true"></i> ' +
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

  // Highlight feature on hover - with improved handling for fast movements and accessibility
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
      const props = layer.feature.properties;
      infoControlRef.current?.update(props);
      
      // Announce province information for screen readers
      const announcement = `${props.name}: ${props.p ? props.p.toLocaleString() : 'Unknown'} people per square kilometer`;
      announceToScreenReader(announcement);
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
    
    // Use a more robust approach for event handling with touch support
    const leafletLayer = layer as L.Layer;
    
    // Standard mouse events
    leafletLayer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,
    });
    
    // Add touch support for mobile devices using DOM events
    if (leafletLayer instanceof L.Path) {
      const element = leafletLayer.getElement();
      if (element) {
        element.addEventListener('touchstart', (domEvent) => {
          domEvent.preventDefault();
          highlightFeature({ target: leafletLayer } as L.LeafletEvent);
        });
        
        element.addEventListener('touchend', (domEvent) => {
          domEvent.preventDefault();
          // Prevent immediate reset on touch devices
          setTimeout(() => {
            // Only reset if this is still the highlighted layer
            if (highlightedLayerRef.current === leafletLayer) {
              resetHighlight({ target: leafletLayer } as L.LeafletEvent);
            }
          }, 1000);
          
          // Zoom on touch
          zoomToFeature({ target: leafletLayer } as L.LeafletEvent);
        });
      }
    }
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

      // Add tile layer with safer initialization
      const tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          opacity: 0, // Start with 0 opacity and update after map is fully initialized
          className: 'background-tile-layer', // Add class for better CSS targeting
        }
      ).addTo(map);
      
      // Wait for the tile layer to load before setting opacity
      tileLayer.on('load', () => {
        console.log('Tile layer loaded, setting initial opacity');
        setTimeout(() => {
          tileLayer.setOpacity(showBackground ? backgroundOpacity : 0);
        }, 200);
      });
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

  // Update tile layer when background settings change - with improved safety checks
  useEffect(() => {
    // Safety check to ensure map is fully initialized and ready
    if (!mapRef.current || !isMapReady) {
      console.log('Map not ready for opacity changes, skipping update');
      return;
    }
    
    // Safer approach to handle opacity changes with proper error handling
    const safelyUpdateOpacity = (opacity: number) => {
      try {
        // Validate map state before making changes
        if (mapRef.current && tileLayerRef.current) {
          console.log(`Setting tile layer opacity to ${opacity}`);
          // Use setTimeout to ensure the map is stable before changing opacity
          setTimeout(() => {
            if (tileLayerRef.current) {
              tileLayerRef.current.setOpacity(opacity);
            }
          }, 50);
        } else {
          console.log('Tile layer or map not ready for opacity update');
        }
      } catch (error) {
        console.error('Error updating tile layer opacity:', error);
      }
    };

    // Only update opacity when showBackground or backgroundOpacity changes
    if (showBackground) {
      if (tileLayerRef.current) {
        // Just update opacity if layer exists
        safelyUpdateOpacity(backgroundOpacity);
      } else {
        // Create new tile layer with better caching options
        const tileLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            opacity: 0, // Start with 0 opacity and gradually increase for stability
            updateWhenIdle: true,  // Only update when map is idle for better performance
            updateWhenZooming: false,  // Don't update during zoom for better performance
            keepBuffer: 2,  // Keep more tiles in memory for smoother panning
            maxNativeZoom: 19,  // Maximum zoom level for which tiles are available
            maxZoom: 22,  // Allow zooming beyond available tiles
            crossOrigin: true,  // Enable CORS for better caching
            className: 'background-tile-layer' // Add class for better CSS targeting
          }
        ).addTo(mapRef.current);
        
        // Store reference
        tileLayerRef.current = tileLayer;
        
        // Wait a moment before setting opacity to ensure the layer is fully loaded
        setTimeout(() => {
          if (tileLayerRef.current) {
            tileLayerRef.current.setOpacity(backgroundOpacity);
          }
        }, 100);
      }
    } else if (tileLayerRef.current) {
      // Remove tile layer if showBackground is false
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    
    // No cleanup needed for setTimeout
    return () => {};
  }, [showBackground, backgroundOpacity, isMapReady]);

  // Add keyboard navigation support for accessibility
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    // Create a keyboard handler for map navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mapRef.current) return;
      
      const map = mapRef.current;
      const panAmount = 50; // pixels to pan
      const zoomAmount = 1; // zoom level change
      
      switch (e.key) {
        case 'ArrowUp': // Pan up
          map.panBy([0, -panAmount]);
          break;
        case 'ArrowDown': // Pan down
          map.panBy([0, panAmount]);
          break;
        case 'ArrowLeft': // Pan left
          map.panBy([-panAmount, 0]);
          break;
        case 'ArrowRight': // Pan right
          map.panBy([panAmount, 0]);
          break;
        case '+': // Zoom in
        case '=': // Also zoom in (= is the unshifted + key)
          map.setZoom(map.getZoom() + zoomAmount);
          break;
        case '-': // Zoom out
          map.setZoom(map.getZoom() - zoomAmount);
          break;
        case 'Home': // Reset view
          map.setView([13, 101.5], 5);
          break;
        default:
          return; // Exit for other keys
      }
      
      // Prevent default browser behavior for these keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '=', '-', 'Home'].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    // Add keyboard event listener when map container is focused
    const mapContainer = mapRef.current.getContainer();
    mapContainer.setAttribute('tabindex', '0'); // Make container focusable
    mapContainer.setAttribute('aria-label', 'Interactive map of Thailand population density. Use arrow keys to pan, + and - to zoom.');
    mapContainer.addEventListener('keydown', handleKeyDown);
    
    // Add focus indicator styles
    mapContainer.addEventListener('focus', () => {
      mapContainer.style.outline = '2px solid #0070f3';
      mapContainer.style.outlineOffset = '2px';
    });
    
    mapContainer.addEventListener('blur', () => {
      mapContainer.style.outline = 'none';
    });
    
    return () => {
      if (mapContainer) {
        mapContainer.removeEventListener('keydown', handleKeyDown);
        mapContainer.removeEventListener('focus', () => {});
        mapContainer.removeEventListener('blur', () => {});
      }
    };
  }, [isMapReady]);
  
  // Helper function to announce text to screen readers
  const announceToScreenReader = (text: string) => {
    // Create or get the live region element
    let liveRegion = document.getElementById('map-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'map-announcer';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    
    // Update the content to trigger screen reader announcement
    liveRegion.textContent = text;
    
    // Clear after a delay to prevent multiple rapid announcements
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 3000);
  };

  // Add touch event handling for better mobile accessibility
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    const map = mapRef.current;
    const container = map.getContainer();
    
    // Add touch instructions for screen readers
    const touchInstructions = document.createElement('div');
    touchInstructions.className = 'sr-only';
    touchInstructions.setAttribute('aria-live', 'polite');
    touchInstructions.textContent = 'Map loaded. Use two fingers to pan, pinch to zoom, and tap on provinces to see details.';
    container.appendChild(touchInstructions);
    
    // Clear instructions after they've been read
    setTimeout(() => {
      touchInstructions.textContent = '';
    }, 5000);
    
    // Add CSS for screen reader only elements if not already present
    if (!document.getElementById('sr-only-style')) {
      const style = document.createElement('style');
      style.id = 'sr-only-style';
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      if (container.contains(touchInstructions)) {
        container.removeChild(touchInstructions);
      }
    };
  }, [isMapReady]);
  
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
