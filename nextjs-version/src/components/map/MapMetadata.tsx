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
      tabIndex={0} // Make the section focusable for keyboard navigation
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
        role="region"
        aria-live="polite" // Announce changes to screen readers
      >
        <section aria-labelledby="data-source-heading">
          <h3 id="data-source-heading" className="font-medium mb-1">Data Source</h3>
          <p className="text-muted-foreground">
            Population density data is sourced from the Thailand GeoJSON project, which provides geographical data for Thailand's provinces along with population density metrics.
          </p>
        </section>
        
        <section aria-labelledby="map-features-heading">
          <h3 id="map-features-heading" className="font-medium mb-1">Map Features</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1" role="list" aria-label="Available map interactions">
            <li>Hover or focus on provinces to see detailed population density</li>
            <li>Click or press Enter on a province to zoom in for a closer view</li>
            <li>Toggle the background map on/off for different visualization styles</li>
            <li>Adjust background opacity to highlight province boundaries</li>
            <li>Use keyboard arrow keys to navigate the map, plus and minus to zoom</li>
          </ul>
        </section>
        
        <section aria-labelledby="accessibility-heading">
          <h3 id="accessibility-heading" className="font-medium mb-1">Accessibility</h3>
          <p className="text-muted-foreground">
            This map is designed to be accessible to all users, including those using screen readers and keyboard navigation.
            Features include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2" role="list" aria-label="Accessibility features">
            <li>Keyboard navigation support for the map (arrow keys, +/- for zoom)</li>
            <li>Screen reader announcements for province information</li>
            <li>Skip to content link for keyboard users</li>
            <li>ARIA labels and roles for all interactive elements</li>
            <li>High contrast color options for better visibility</li>
            <li>Focus indicators for keyboard navigation</li>
          </ul>
        </section>
        
        <section aria-labelledby="color-legend-heading">
          <h3 id="color-legend-heading" className="font-medium mb-1">Color Legend</h3>
          <p className="text-muted-foreground">
            The map uses a color gradient from yellow to dark red to represent population density ranges, with darker colors indicating higher density areas.
          </p>
          <div 
            className="grid grid-cols-2 gap-2 mt-3" 
            role="list" 
            aria-label="Population density color legend"
          >
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#800026] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">Over 500 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#BD0026] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">200-500 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#E31A1C] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">100-200 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#FC4E2A] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">50-100 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#FD8D3C] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">20-50 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#FEB24C] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">10-20 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#FED976] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">5-10 people/km²</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div 
                className="w-4 h-4 bg-[#FFEDA0] rounded-sm" 
                aria-hidden="true"
                style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}
              ></div>
              <span className="text-xs text-muted-foreground">0-5 people/km²</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
