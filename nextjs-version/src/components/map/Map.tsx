"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { Loading } from "@/components/ui/loading";

// Import Leaflet CSS in the component to avoid SSR issues
import "leaflet/dist/leaflet.css";

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

  // Style function for GeoJSON
  const style = (feature: GeoJSONFeature) => {
    return {
      fillColor: getColor(feature.properties.p),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  // Highlight feature on hover
  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    infoControlRef.current?.update(layer.feature.properties);
  };

  // Reset highlight on mouseout
  const resetHighlight = (e: L.LeafletEvent) => {
    if (geoJSONData) {
      const layer = e.target;
      layer.setStyle(style(layer.feature));
      infoControlRef.current?.update();
    }
  };

  // Zoom to feature on click
  const zoomToFeature = (e: L.LeafletEvent) => {
    const map = e.target._map;
    map.fitBounds(e.target.getBounds());
  };

  // Set up event handlers for each feature
  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,
    });
  };

  // Fetch GeoJSON data only once
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we already have data
        if (geoJSONData) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        
        console.log("Fetching GeoJSON data from local file...");
        const response = await fetch("/geo-data/thailandwithdensity.json");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.text();
        setGeoJSONData(JSON.parse(data));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching GeoJSON data:", error);
        setError(error instanceof Error ? error.message : "Failed to load map data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize the map
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

    // Only initialize once and when data is available
    if (!containerRef.current || mapRef.current || !geoJSONData) return cleanup;

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
      
      // Add custom CSS to style the info control
      const style = document.createElement('style');
      style.innerHTML = `
        .info {
          padding: 8px 10px;
          background: rgba(255,255,255,0.95);
          color: #333;
          box-shadow: 0 0 15px rgba(0,0,0,0.3);
          border-radius: 6px;
          max-width: 250px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .info h4 {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: bold;
          color: #000;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          padding-bottom: 5px;
        }
        .info p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }
        .dark .info {
          background: rgba(30,30,30,0.95);
          color: #f0f0f0;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .dark .info h4 {
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        @media (max-width: 640px) {
          .info {
            max-width: 200px;
            font-size: 12px;
          }
        }
      `;
      document.head.appendChild(style);

      // Create legend control with improved styling
      const legendControl = new CustomLegendControl(getColor);
      legendControl.addTo(map);
      legendControlRef.current = legendControl;
      
      // Add custom CSS to style the legend control
      const legendStyle = document.createElement('style');
      legendStyle.innerHTML = `
        .legend {
          padding: 6px 8px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
          border-radius: 4px;
          line-height: 1.6;
        }
        .legend i {
          width: 18px;
          height: 18px;
          float: left;
          margin-right: 8px;
          opacity: 0.7;
        }
        .legend div {
          clear: both;
          margin-bottom: 3px;
          font-size: 12px;
        }
        .legend div.title {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 5px;
        }
        @media (max-width: 640px) {
          .legend {
            max-width: 200px;
            padding: 4px 6px;
          }
          .legend i {
            width: 16px;
            height: 16px;
          }
        }
      `;
      document.head.appendChild(legendStyle);

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

      // Make sure the map is properly sized
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return cleanup;
  }, []);

  // Update tile layer when background settings change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Update existing tile layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    // Create new tile layer with updated opacity
    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        opacity: showBackground ? backgroundOpacity : 0,
      }
    ).addTo(mapRef.current);

    // Store reference
    tileLayerRef.current = tileLayer;
  }, [showBackground, backgroundOpacity, isMapReady]);

  // Add GeoJSON layer when data is available and map is ready
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !geoJSONData) return;

    // Remove existing GeoJSON layer if it exists
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
    }

    // Create GeoJSON layer
    const geoJsonLayer = L.geoJSON(geoJSONData, {
      style: (feature) => ({
        fillColor: getColor(feature?.properties?.p || 0),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 5,
              color: "#666",
              dashArray: "",
              fillOpacity: 0.7,
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              layer.bringToFront();
            }

            infoControlRef.current?.update(feature.properties);
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
            infoControlRef.current?.update();
          },
          click: (e) => {
            mapRef.current?.fitBounds(e.target.getBounds());
          },
        });
      },
    }).addTo(mapRef.current);

    // Store reference
    geoJsonLayerRef.current = geoJsonLayer;
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
