
import React, { useState, useRef, useEffect } from 'react';
import { Crosshair, Eye, Map as MapIcon, RefreshCw, AlertTriangle, Loader2, Globe, ShieldAlert, Zap, Search, Navigation } from 'lucide-react';

interface MapSelectorProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
}

declare global {
  interface Window {
    google: any;
    L: any; // Leaflet
    gm_authFailure: () => void;
  }
}

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#050b14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0ea5e9" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ visibility: "off" }] 
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f2942" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#0ea5e9" }, { lightness: -60 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const DEFAULT_CENTER = { lat: 47.5763831, lng: -122.4211769 };

export const MapSelector: React.FC<MapSelectorProps> = ({ onSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const panoramaContainerRef = useRef<HTMLDivElement>(null);
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  
  const mapInstanceRef = useRef<any>(null);
  const panoramaInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const selectedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [engine, setEngine] = useState<'google' | 'leaflet'>('google');
  const [viewMode, setViewMode] = useState<'map' | 'street'>('map');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    selectedCoordsRef.current = selectedCoords;
  }, [selectedCoords]);

  const [streetViewAvailable, setStreetViewAvailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsScriptLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    window.gm_authFailure = () => {
      setErrorMsg("Maps API Key Rejected");
    };

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (engine !== 'google' || !isScriptLoaded || !mapContainerRef.current) return;
    
    if (retryTrigger > 0 && mapContainerRef.current) {
    }

    if (mapInstanceRef.current && retryTrigger === 0) return;

    if (retryTrigger > 0) {
      if (mapContainerRef.current) mapContainerRef.current.innerHTML = '';
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    }

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
        styles: MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: false,
        backgroundColor: '#050b14',
        mapTypeControl: false,
        streetViewControl: false,
      });

      map.addListener("click", (e: any) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        handleGoogleSelect(lat, lng);
      });

      mapInstanceRef.current = map;

      const svService = new window.google.maps.StreetViewService();
      mapInstanceRef.current.svService = svService;

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
           window.google.maps.event.trigger(mapInstanceRef.current, "resize");
           mapInstanceRef.current.setCenter(selectedCoordsRef.current || DEFAULT_CENTER);
        }
      });
      
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };

    } catch (e) {
      setErrorMsg("Map System Failure: " + (e as Error).message);
    }
  }, [isScriptLoaded, engine, retryTrigger]);

  useEffect(() => {
    if (engine !== 'google' || !isScriptLoaded || !panoramaContainerRef.current) return;
    if (panoramaInstanceRef.current && retryTrigger === 0) return;

    if (retryTrigger > 0 && panoramaContainerRef.current) {
        panoramaContainerRef.current.innerHTML = '';
        panoramaInstanceRef.current = null;
    }

    try {
      const panorama = new window.google.maps.StreetViewPanorama(panoramaContainerRef.current, {
        position: DEFAULT_CENTER,
        pov: { heading: 0, pitch: 0 },
        disableDefaultUI: true,
        zoomControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        linksControl: true,
        panControl: false,
        enableCloseButton: false,
        visible: false,
      });

      panoramaInstanceRef.current = panorama;
    } catch {
    }
  }, [isScriptLoaded, engine, retryTrigger]);

  useEffect(() => {
    if (engine !== 'leaflet' || !leafletContainerRef.current) return;
    if (leafletMapRef.current) return;

    if (window.L) {
      const map = window.L.map(leafletContainerRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      map.on('click', (e: any) => {
        handleLeafletSelect(e.latlng.lat, e.latlng.lng);
      });

      leafletMapRef.current = map;
      
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [engine]);


  const handleGoogleSelect = (lat: number, lng: number) => {
    const newCoords = { lat, lng };
    setSelectedCoords(newCoords);
    onSelect(newCoords);
    setErrorMsg(null);

    if (mapInstanceRef.current) {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(newCoords);
      } else {
        markerInstanceRef.current = new window.google.maps.Marker({
          position: newCoords,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#0ea5e9",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      }
    }

    const svService = mapInstanceRef.current?.svService;
    if (svService) {
      svService.getPanorama({ location: newCoords, radius: 2000 }, (data: any, status: any) => {
         if (status === "OK") {
            setStreetViewAvailable(true);
            if (panoramaInstanceRef.current) {
                panoramaInstanceRef.current.setPosition(data.location.latLng);
                panoramaInstanceRef.current.setPov({
                    heading: data.tiles.centerHeading || 0,
                    pitch: 0
                });
            }
         } else {
            setStreetViewAvailable(false);
            if (viewMode === 'street') {
                setViewMode('map');
                if (panoramaInstanceRef.current) panoramaInstanceRef.current.setVisible(false);
            }
         }
      });
    }
  };

  const handleLeafletSelect = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    onSelect({ lat, lng });
    
    if (leafletMapRef.current) {
        if (leafletMarkerRef.current) {
            leafletMarkerRef.current.setLatLng([lat, lng]);
        } else if (window.L) {
            leafletMarkerRef.current = window.L.marker([lat, lng]).addTo(leafletMapRef.current);
        }
    }
    setStreetViewAvailable(false);
  };

  const toggleViewMode = () => {
    if (viewMode === 'map' && streetViewAvailable) {
        setViewMode('street');
        if (panoramaInstanceRef.current) panoramaInstanceRef.current.setVisible(true);
    } else {
        setViewMode('map');
        if (panoramaInstanceRef.current) panoramaInstanceRef.current.setVisible(false);
    }
  };

  const handleRetry = () => {
      setErrorMsg(null);
      setRetryTrigger(prev => prev + 1);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      if (engine === 'google' && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
          setIsSearching(false);
          
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Center map on result
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter({ lat, lng });
              mapInstanceRef.current.setZoom(15);
            }
            
            // Select this location
            handleGoogleSelect(lat, lng);
            setSearchQuery('');
          } else {
            setSearchError('Location not found. Try a different search.');
          }
        });
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        const data = await response.json();
        setIsSearching(false);
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 15);
          }
          
          handleLeafletSelect(lat, lng);
          setSearchQuery('');
        } else {
          setSearchError('Location not found. Try a different search.');
        }
      }
    } catch {
      setIsSearching(false);
      setSearchError('Search failed. Please try again.');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    setSearchError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setIsLocating(false);
        
        if (engine === 'google' && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(15);
          handleGoogleSelect(lat, lng);
        } else if (engine === 'leaflet' && leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 15);
          handleLeafletSelect(lat, lng);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setSearchError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setSearchError('Location unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            setSearchError('Location request timed out. Please try again.');
            break;
          default:
            setSearchError('Failed to get location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full h-full bg-black">
      {engine === 'google' && (
          <>
            <div ref={mapContainerRef} className={`w-full h-full absolute inset-0 transition-opacity ${viewMode === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />
            <div ref={panoramaContainerRef} className={`w-full h-full absolute inset-0 transition-opacity ${viewMode === 'street' ? 'opacity-100 z-20' : 'opacity-0 z-0'}`} />
          </>
      )}
      
      {engine === 'leaflet' && (
          <div ref={leafletContainerRef} className="w-full h-full absolute inset-0 z-10" />
      )}

      {(!isScriptLoaded && engine === 'google') && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
              <Loader2 className="w-8 h-8 text-cyber-500 animate-spin" />
          </div>
      )}

      {errorMsg && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl text-white font-bold mb-2">SATELLITE LINK FAILED</h3>
              <p className="text-slate-400 mb-6 font-mono text-sm max-w-xs">{errorMsg}</p>
              
              <div className="flex gap-4">
                  <button 
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-cyber-900 border border-cyber-600 rounded text-cyber-400 hover:text-white hover:border-cyber-400 font-mono text-xs"
                  >
                      <RefreshCw className="w-3 h-3" /> RECONNECT
                  </button>
                  {window.L && (
                      <button 
                        onClick={() => setEngine('leaflet')}
                        className="flex items-center gap-2 px-4 py-2 bg-cyber-500 text-black rounded font-mono text-xs font-bold"
                      >
                          <Globe className="w-3 h-3" /> USE BACKUP LINK
                      </button>
                  )}
              </div>
          </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-40 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search address, pincode, city..."
              className="w-full bg-black/90 backdrop-blur-md border border-cyber-500/50 rounded-lg py-2.5 pl-10 pr-20 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyber-400 focus:ring-1 focus:ring-cyber-400/50 shadow-lg"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-500" />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyber-500 hover:bg-cyber-400 disabled:bg-cyber-900 disabled:text-slate-500 text-black text-xs font-bold rounded transition-colors"
            >
              {isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'GO'
              )}
            </button>
          </div>
          {searchError && (
            <div className="mt-2 bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-lg p-2 px-3 text-[10px] font-mono text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono">
              Try: "E17 4GA, London" or "Tokyo Tower"
            </span>
            <button
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex items-center gap-1 px-2 py-1 bg-cyber-900/80 border border-cyber-500/50 rounded text-[10px] font-mono text-cyber-400 hover:text-white hover:border-cyber-400 transition-colors disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
              {isLocating ? 'LOCATING...' : 'USE MY LOCATION'}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-2">
             {engine === 'google' && streetViewAvailable && !errorMsg && (
                 <button 
                    onClick={toggleViewMode}
                    className={`p-3 rounded-full border shadow-lg transition-all ${
                        viewMode === 'street' 
                        ? 'bg-cyber-500 text-black border-cyber-400' 
                        : 'bg-black/80 text-cyber-500 border-cyber-500/50 hover:bg-cyber-900'
                    }`}
                 >
                     {viewMode === 'street' ? <MapIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
             )}
          </div>

          {selectedCoords && (
             <div className="flex flex-col gap-2 items-end pointer-events-auto">
               {!streetViewAvailable && (
                 <div className="bg-amber-900/90 backdrop-blur-md border border-amber-500/50 rounded-lg p-2 px-3 text-[10px] font-mono text-amber-300 flex items-center gap-2 shadow-lg max-w-[200px]">
                     <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                     <span>Street View unavailable - AI will visualize</span>
                 </div>
               )}
               {streetViewAvailable && (
                 <div className="bg-green-900/90 backdrop-blur-md border border-green-500/50 rounded-lg p-2 px-3 text-[10px] font-mono text-green-300 flex items-center gap-2 shadow-lg">
                     <Eye className="w-3 h-3" />
                     <span>Street View available</span>
                 </div>
               )}
               <div className="bg-black/80 backdrop-blur-md border border-cyber-500/30 rounded-lg p-2 px-4 text-xs font-mono text-cyber-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                 <div className="flex items-center gap-2">
                     <Crosshair className="w-3 h-3" />
                     {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                   </div>
                 </div>
             </div>
          )}
      </div>
    </div>
  );
};
