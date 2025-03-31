# Thai Population Density Map

![Thai Population Density Map](https://img.shields.io/badge/Status-Active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

An interactive web application that visualizes population density data across Thailand's provinces using Next.js and Leaflet.

## 📋 Overview

This project provides an interactive choropleth map of Thailand showing population density by province. Users can hover over provinces to see detailed information and click on provinces to zoom in for a closer look.

## 🌟 Features

- **Interactive Map**: Hover over provinces to see population density data
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Dynamic Zooming**: Click on provinces to zoom in and explore specific regions
- **Color-coded Visualization**: Provinces are colored based on population density ranges
- **Background Toggle**: Switch between showing only Thailand or including surrounding countries
- **Opacity Control**: Adjust the opacity of the background mask with a slider
- **User-friendly Interface**: Clean, modern UI with intuitive controls
- **Detailed Information**: View province names and exact population density figures

## 🚀 Project Structure

The project contains multiple implementations:

- `/nextjs-version`: Modern implementation using Next.js 15, React 19, and TypeScript
- `/html-version`: Simple HTML/JS implementation
- `/geo-data`: Source GeoJSON data for Thailand provinces

## 🛠️ Technologies Used

### Next.js Version

- **Frontend Framework**: Next.js 15.2.4
- **UI Library**: React 19.1.0
- **Mapping Library**: Leaflet 1.9.4 with React-Leaflet 4.2.1
- **Styling**: TailwindCSS
- **Language**: TypeScript

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8.15.1 or higher)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/thai-density-by-province.git
   cd thai-density-by-province
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

## 🌐 Usage

- **View Population Density**: Hover over any province to see its name and population density
- **Zoom In**: Click on a province to zoom in
- **Reset View**: Use the reset button to return to the default view
- **Toggle Background**: Use the toggle switch to show or hide countries surrounding Thailand
- **Adjust Opacity**: Use the slider to control how much of the surrounding area is visible
- **Legend**: Refer to the color-coded legend in the bottom right to understand the density ranges

## 📊 Data Sources

- Thailand GeoJSON data: [github.com/apisit/thailand.json](https://github.com/apisit/thailand.json)
- Implementation inspired by: [Leaflet Choropleth Example](http://leafletjs.com/examples/choropleth/)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Contact

If you have any questions or feedback, please open an issue in the repository.

---

Built with ❤️ using Next.js and Leaflet
