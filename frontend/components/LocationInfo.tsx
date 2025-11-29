import React, { useEffect, useState } from 'react';
import { Cloud, Wind, Droplets, ThermometerSun, Leaf, MapPin, Star, Loader2 } from 'lucide-react';
import * as api from '../apiClient';

interface LocationInfoProps {
  coordinates?: { lat: number; lng: number };
  onWeatherUpdate?: (condition: string) => void;
}

export const LocationInfo: React.FC<LocationInfoProps> = ({ coordinates, onWeatherUpdate }) => {
  const [data, setData] = useState<api.LocationEnrichment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const enrichment = await api.getLocationInfo(coordinates.lat, coordinates.lng);
        setData(enrichment);
        
        if (enrichment.weather && onWeatherUpdate) {
          onWeatherUpdate(enrichment.weather.description);
        }
      } catch {
        setError('Failed to load location data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coordinates?.lat, coordinates?.lng]);

  if (!coordinates) return null;

  if (loading) {
    return (
      <div className="bg-cyber-900/50 backdrop-blur-md border border-cyber-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-cyber-400 text-sm font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading location data...</span>
        </div>
      </div>
    );
  }

  if (error || !data || (!data.weather && !data.airQuality && !data.nearbyPlaces)) {
    return null; // Silently fail - these are bonus features
  }

  return (
    <div className="bg-cyber-900/50 backdrop-blur-md border border-cyber-700 rounded-lg p-4 space-y-4">
      <h4 className="text-xs font-mono text-cyber-400 uppercase tracking-wider flex items-center gap-2">
        <MapPin className="w-3 h-3" />
        Location Intelligence
      </h4>

      {/* Weather */}
      {data.weather && (
        <div className="flex items-center gap-4 p-3 bg-black/30 rounded-lg border border-cyber-800">
          <div className="flex-shrink-0">
            <Cloud className="w-8 h-8 text-cyber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{Math.round(data.weather.temperature)}°C</span>
              <span className="text-xs text-slate-400">Feels {Math.round(data.weather.feelsLike)}°</span>
            </div>
            <p className="text-sm text-slate-300 truncate">{data.weather.description}</p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>{data.weather.windSpeed} m/s</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>{data.weather.humidity}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Air Quality */}
      {data.airQuality && (
        <div className="p-3 bg-black/30 rounded-lg border border-cyber-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-white">Air Quality</span>
            </div>
            <div 
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ 
                backgroundColor: data.airQuality.color + '20',
                color: data.airQuality.color,
                border: `1px solid ${data.airQuality.color}50`
              }}
            >
              AQI {data.airQuality.aqi} · {data.airQuality.category}
            </div>
          </div>
          {data.airQuality.healthRecommendation && (
            <p className="text-xs text-slate-400 line-clamp-2">
              {data.airQuality.healthRecommendation}
            </p>
          )}
        </div>
      )}

      {/* Nearby Places */}
      {data.nearbyPlaces && data.nearbyPlaces.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-mono text-slate-400 uppercase">Nearby Places</h5>
          <div className="grid gap-2">
            {data.nearbyPlaces.slice(0, 3).map((place, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-black/30 rounded border border-cyber-800/50">
                <MapPin className="w-3 h-3 text-cyber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{place.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{place.type}</p>
                </div>
                {place.rating && (
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px]">{place.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

