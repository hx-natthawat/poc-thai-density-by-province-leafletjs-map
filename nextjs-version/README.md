# Thai Population Density Map

An interactive choropleth map showing population density by province in Thailand, built with modern web technologies. This project demonstrates the use of Leaflet.js with Next.js to create an interactive and responsive map visualization.

## Features

- Interactive choropleth map showing population density by province in Thailand
- Background toggle to show/hide surrounding countries with opacity control
- Hover information display for province details (name and population density)
- Dynamic zooming on province click for detailed exploration
- Color-coded legend for density ranges with clear visual indicators
- Responsive design optimized for mobile, tablet, and desktop devices
- Dark/light theme support with system preference detection
- Accessibility features including keyboard navigation and screen reader support
- Performance optimizations for smooth interaction on all devices
- Clean, modern UI built with ShadCN components

## Technologies Used

- **Next.js 15.2.4**: React framework with App Router architecture
- **React 19.1.0**: UI library with latest features and improvements
- **TypeScript 5.3.3**: Type-safe development environment
- **TailwindCSS 3.4.1**: Utility-first CSS framework for styling
- **ShadCN UI**: Accessible and customizable component library
- **Leaflet 1.9.4**: Interactive map library
- **React-Leaflet 4.2.1**: React components for Leaflet maps
- **pnpm 8.15.1**: Fast, disk space efficient package manager

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/thai-density-map.git
cd thai-density-map/nextjs-version

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

- `/public/geo-data/` - GeoJSON data files for the map
- `/src/components/map/` - Map-related components
  - `ThaiDensityMap.tsx` - Main component with interactive controls
  - `Map.tsx` - Client-side Leaflet map implementation
  - `MapMetadata.tsx` - Information panel about the map and data sources
  - `MobileMapControls.tsx` - Mobile-specific map controls
- `/src/components/ui/` - ShadCN UI components
  - Various UI components including Loading, Toggle, Slider, etc.
- `/src/components/layout/` - Layout components
  - `Container.tsx` - Responsive container component
  - `Header.tsx` - Application header with theme toggle
  - `Footer.tsx` - Application footer with credits
- `/src/app/` - Next.js app router pages and layouts

## Recent Improvements

- Fixed GeoJSON data fetching and parsing issues
- Improved map initialization and rendering performance
- Enhanced background tile layer handling with better opacity controls
- Optimized memory usage and event listener cleanup
- Implemented better error handling and recovery mechanisms
- Improved accessibility features throughout the application

## Data Source

The map uses GeoJSON data derived from [apisit/thailand.json](https://github.com/apisit/thailand.json) with population density information added.

## License

MIT
