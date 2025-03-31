import React from 'react';

interface MapMetadataProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MapMetadata({ isOpen, onToggle }: MapMetadataProps) {
  const contentId = 'map-metadata-content';
  const headingId = 'map-metadata-heading';
  
  return (
    <section 
      className="bg-card rounded-lg shadow-sm border border-border p-4"
      aria-labelledby={headingId}
      role="region"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 id={headingId} className="text-base font-semibold">About This Map</h2>
        <button 
          onClick={onToggle}
          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
          aria-expanded={isOpen}
          aria-controls={contentId}
          type="button"
        >
          {isOpen ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      <div 
        id={contentId}
        className={`text-sm space-y-3 ${isOpen ? 'animate-in fade-in duration-200' : 'hidden'}`}
        aria-hidden={!isOpen}
      >
        <section>
          <h3 className="font-medium mb-1">Data Source</h3>
          <p className="text-muted-foreground">
            Population density data is sourced from the Thailand GeoJSON project, which provides geographical data for Thailand's provinces along with population density metrics.
          </p>
        </section>
        
        <section>
          <h3 className="font-medium mb-1">Map Features</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1" role="list">
            <li>Hover over provinces to see detailed population density</li>
            <li>Click on a province to zoom in for a closer view</li>
            <li>Toggle the background map on/off for different visualization styles</li>
            <li>Adjust background opacity to highlight province boundaries</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-medium mb-1">Color Legend</h3>
          <p className="text-muted-foreground">
            The map uses a color gradient from yellow to dark red to represent population density ranges, with darker colors indicating higher density areas.
          </p>
        </section>
      </div>
    </section>
  );
}
