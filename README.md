# Thai Population Density Map

![Thai Population Density Map](https://img.shields.io/badge/Status-Active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-blue)

An interactive web application that visualizes population density data across Thailand's provinces using Next.js and Leaflet. This project demonstrates modern web development techniques with a focus on performance, accessibility, and user experience.

## 📋 Overview

This project provides an interactive choropleth map of Thailand showing population density by province. Users can hover over provinces to see detailed information and click on provinces to zoom in for a closer look. The application is built with modern web technologies and follows best practices for performance and accessibility.

## 🌟 Features

- **Interactive Choropleth Map**: Visualize population density across Thailand's provinces
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Dynamic Zooming**: Click on provinces to zoom in and explore specific regions
- **Color-coded Visualization**: Intuitive color scheme based on population density ranges
- **Background Toggle**: Switch between showing only Thailand or including surrounding countries
- **Opacity Control**: Adjust the opacity of the background map with a slider
- **Hover Information**: View province names and exact population density figures on hover
- **Accessibility Support**: Keyboard navigation and screen reader compatibility
- **Dark/Light Themes**: System preference detection with smooth transitions
- **Performance Optimized**: Debounced events and optimized rendering for smooth interaction

## 🚀 Project Structure

The project contains multiple implementations:

- `/nextjs-version`: Modern implementation using Next.js 15, React 19, TypeScript, and TailwindCSS
- `/html-version`: Simple HTML/JS implementation (original version)
- `/public/geo-data`: GeoJSON data for Thailand provinces with population density information

## 🛠️ Technologies Used

### Next.js Version

- **Frontend Framework**: Next.js 15.2.4 with App Router
- **UI Library**: React 19.1.0
- **Mapping Library**: Leaflet 1.9.4 with React-Leaflet 4.2.1
- **Styling**: TailwindCSS 3.4.1 with ShadCN UI components
- **Language**: TypeScript 5.3.3
- **Package Manager**: pnpm 8.15.1
- **Theme Management**: next-themes for dark/light mode

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8.15.1 or higher)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/thai-density-by-province-leafletjs-map.git
   cd thai-density-by-province-leafletjs-map
   ```

2. Install dependencies for the Next.js version

   ```bash
   cd nextjs-version
   pnpm install
   ```

3. Start the development server

   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to http://localhost:3000

### Building for Production

```bash
pnpm build
pnpm start
```

## 🌐 Usage

- **View Population Density**: Hover over any province to see its name and population density
- **Zoom In**: Click on a province to zoom in for detailed exploration
- **Reset View**: Use the reset button to return to the default view of Thailand
- **Toggle Background**: Use the toggle switch to show or hide countries surrounding Thailand
- **Adjust Opacity**: Use the slider to control the opacity of the background map
- **Theme Toggle**: Switch between light and dark mode using the theme toggle in the header
- **Legend**: Refer to the color-coded legend to understand the density ranges

## 🔄 Recent Improvements

- **Fixed GeoJSON Data Loading**: Resolved issues with fetching and parsing GeoJSON data
- **Enhanced Map Initialization**: Improved map rendering and component lifecycle management
- **Optimized Tile Layer Handling**: Better background map controls with smoother opacity transitions
- **Memory Management**: Implemented proper cleanup for event listeners and map instances
- **Error Handling**: Added robust error recovery mechanisms for data loading failures
- **Accessibility Enhancements**: Improved keyboard navigation and screen reader support
- **Mobile Optimizations**: Better touch controls and responsive layout for mobile devices

## 📊 Data Sources

- Thailand GeoJSON data: [github.com/apisit/thailand.json](https://github.com/apisit/thailand.json)
- Population density data added to the original GeoJSON
- Implementation inspired by: [Leaflet Choropleth Example](http://leafletjs.com/examples/choropleth/)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Contact

If you have any questions or feedback, please open an issue in the repository.

---

Built with ❤️ using Next.js and Leaflet
