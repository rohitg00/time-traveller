const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  uvIndex?: number;
}

export interface AirQualityData {
  aqi: number;
  category: string;
  dominantPollutant: string;
  healthRecommendation: string;
  color: string;
}

export interface NearbyPlace {
  name: string;
  type: string;
  rating?: number;
  address?: string;
  distance?: string;
}

export interface LocationEnrichment {
  weather?: WeatherData;
  airQuality?: AirQualityData;
  nearbyPlaces?: NearbyPlace[];
}

/**
 * Get current weather for a location using Google Weather API
 */
export async function getWeather(lat: number, lng: number): Promise<WeatherData | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      temperature: data.temperature?.degrees || 0,
      feelsLike: data.feelsLikeTemperature?.degrees || 0,
      humidity: data.relativeHumidity || 0,
      description: data.weatherCondition?.description?.text || data.weatherCondition?.type || 'Unknown',
      icon: data.weatherCondition?.iconBaseUri || '',
      windSpeed: data.wind?.speed?.value || 0,
      uvIndex: data.uvIndex
    };
  } catch {
    return null;
  }
}

export async function getAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng },
          extraComputations: ['HEALTH_RECOMMENDATIONS', 'DOMINANT_POLLUTANT_CONCENTRATION']
        })
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const index = data.indexes?.[0];
    
    if (!index) return null;
    
    const aqi = index.aqi || 0;
    let category = 'Unknown';
    let color = '#808080';
    
    if (aqi <= 50) { category = 'Good'; color = '#00e400'; }
    else if (aqi <= 100) { category = 'Moderate'; color = '#ffff00'; }
    else if (aqi <= 150) { category = 'Unhealthy for Sensitive'; color = '#ff7e00'; }
    else if (aqi <= 200) { category = 'Unhealthy'; color = '#ff0000'; }
    else if (aqi <= 300) { category = 'Very Unhealthy'; color = '#8f3f97'; }
    else { category = 'Hazardous'; color = '#7e0023'; }
    
    return {
      aqi,
      category,
      dominantPollutant: index.dominantPollutant || 'Unknown',
      healthRecommendation: data.healthRecommendations?.generalPopulation || '',
      color
    };
  } catch {
    return null;
  }
}

export async function getNearbyPlaces(lat: number, lng: number): Promise<NearbyPlace[]> {
  if (!GOOGLE_API_KEY) return [];
  
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.types,places.rating,places.formattedAddress'
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 1000
            }
          },
          includedTypes: ['tourist_attraction', 'museum', 'park', 'historical_landmark', 'art_gallery'],
          maxResultCount: 5
        })
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    return (data.places || []).map((place: any) => ({
      name: place.displayName?.text || 'Unknown',
      type: place.types?.[0]?.replace(/_/g, ' ') || 'Place',
      rating: place.rating,
      address: place.formattedAddress
    }));
  } catch {
    return [];
  }
}

export async function getLocationEnrichment(lat: number, lng: number): Promise<LocationEnrichment> {
  const [weather, airQuality, nearbyPlaces] = await Promise.all([
    getWeather(lat, lng),
    getAirQuality(lat, lng),
    getNearbyPlaces(lat, lng)
  ]);
  
  return {
    weather: weather || undefined,
    airQuality: airQuality || undefined,
    nearbyPlaces: nearbyPlaces.length > 0 ? nearbyPlaces : undefined
  };
}
