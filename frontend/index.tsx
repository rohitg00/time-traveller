import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Load Google Maps API dynamically
const loadGoogleMapsApi = () => {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (mapsApiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  } else {
    console.warn('⚠️ GOOGLE_API_KEY not set in .env - Map features will be limited to Leaflet only');
  }
};

loadGoogleMapsApi();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);