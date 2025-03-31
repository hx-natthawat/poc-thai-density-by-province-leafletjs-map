# Thai Population Density Map

An interactive choropleth map showing population density by province in Thailand, built with modern web technologies.

## Features

- Interactive choropleth map showing population density by province
- Background toggle to show/hide surrounding countries
- Opacity control slider for background visibility
- Hover information display for province details
- Dynamic zooming on province click
- Color-coded legend for density ranges

## Technologies Used

- Next.js 15.2.4
- React 19.1.0
- TypeScript 5.3.3
- TailwindCSS 3.4.1
- ShadCN UI components
- Leaflet 1.9.4 with React-Leaflet 4.2.1
- pnpm 8.15.1

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/components/map/` - Map-related components
  - `ThaiDensityMap.tsx` - Main component with controls
  - `Map.tsx` - Leaflet map implementation
- `/src/components/ui/` - ShadCN UI components
- `/src/app/` - Next.js app router pages

## Data Source

The map uses GeoJSON data from [apisit/thailand.json](https://github.com/apisit/thailand.json).

## License

MIT
