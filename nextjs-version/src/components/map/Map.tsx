"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";

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
    super(options || { position: 'topright' });
    this._div = document.createElement('div');
  }
  
  onAdd(map: L.Map): HTMLElement {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  }
  
  update(props?: ProvinceProperties): void {
    this._div.innerHTML = '<h4>Thai Population Density</h4>' + 
      (props ? '<b>' + props.name + '</b><br />' + props.p + ' people / km<sup>2</sup>' : 'Hover over a province');
  }
}

class CustomLegendControl extends L.Control {
  _div: HTMLElement;
  getColor: (d: number) => string;
  
  constructor(getColorFn: (d: number) => string, options?: L.ControlOptions) {
    super(options || { position: 'bottomright' });
    this._div = document.createElement('div');
    this.getColor = getColorFn;
  }
  
  onAdd(map: L.Map): HTMLElement {
    this._div = L.DomUtil.create('div', 'info legend');
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    let labels = [];
    
    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];
      
      labels.push(
        '<i style="background:' + this.getColor(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
    }
    
    this._div.innerHTML = labels.join('<br>');
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
  const [geoJSONData, setGeoJSONData] = useState<GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinceProperties> | null>(null);

  // Function to determine color based on population density
  const getColor = (d: number) => {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
  };

  // Style function for GeoJSON
  const style = (feature: GeoJSONFeature) => {
    return {
      fillColor: getColor(feature.properties.p),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Highlight feature on hover
  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
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
      click: zoomToFeature
    });
  };

  // Fetch GeoJSON data only once
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we already have data
        if (geoJSONData) return;
        
        console.log('Fetching GeoJSON data...');
        const response = await fetch('https://raw.githubusercontent.com/apisit/thailand.json/master/thailandwithdensity.json');
        const data = await response.text();
        setGeoJSONData(JSON.parse(data));
      } catch (error) {
        console.error('Error fetching GeoJSON data:', error);
      }
    };

    fetchData();
  }, [geoJSONData]);

  // Initialize the map
  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') return;
    
    // Clean up function
    const cleanup = () => {
      if (mapRef.current) {
        console.log('Cleaning up map...');
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
    
    // Only initialize once
    if (!containerRef.current || mapRef.current) return cleanup;
    
    try {
      console.log('Initializing map...');
      // Create map instance
      const map = L.map(containerRef.current, {
        center: [13, 101.5],
        zoom: 5,
        zoomControl: true
      });
      
      // Store map reference
      mapRef.current = map;
      
      // Create info control
      const infoControl = new CustomInfoControl();
      infoControl.addTo(map);
      infoControlRef.current = infoControl;
      
      // Create legend control
      const legendControl = new CustomLegendControl(getColor);
      legendControl.addTo(map);
      legendControlRef.current = legendControl;
      
      // Add tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        opacity: showBackground ? backgroundOpacity : 0
      }).addTo(map);
      tileLayerRef.current = tileLayer;
      
      // Set map as ready
      setIsMapReady(true);
      
      // Make sure the map is properly sized
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
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
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      opacity: showBackground ? backgroundOpacity : 0
    }).addTo(mapRef.current);
    
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
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 5,
              color: '#666',
              dashArray: '',
              fillOpacity: 0.7
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
          }
        });
      }
    }).addTo(mapRef.current);
    
    // Store reference
    geoJsonLayerRef.current = geoJsonLayer;
  }, [geoJSONData, isMapReady, getColor]);
  
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return <div className="h-[80vh] w-full rounded-md bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>;
  }
  
  // Return the map container div
  return (
    <div 
      ref={containerRef} 
      className="h-[80vh] w-full z-0"
      style={{ position: 'relative' }}
    >
      {!isMapReady && (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Initializing map...</p>
        </div>
      )}
    </div>
  );
}
