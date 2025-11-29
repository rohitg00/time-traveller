import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { getLocationEnrichment } from '../../services/google/locationEnrichment';

const queryParamsSchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number)
});

export const config: ApiRouteConfig = {
  name: 'GetLocationInfo',
  type: 'api',
  path: '/location/info',
  method: 'GET',
  description: 'Gets weather, air quality, and nearby places for a location',
  emits: [],
  flows: ['time-traveller-flow'],
  queryParams: [
    { name: 'lat', description: 'Latitude' },
    { name: 'lng', description: 'Longitude' }
  ]
};

export const handler: Handlers['GetLocationInfo'] = async (req, { logger, traceId }) => {
  try {
    const lat = parseFloat(req.queryParams.lat as string);
    const lng = parseFloat(req.queryParams.lng as string);
    
    if (isNaN(lat) || isNaN(lng)) {
      return {
        status: 400,
        body: { error: 'Invalid coordinates' }
      };
    }
    
    logger.info('Fetching location enrichment data', { traceId, lat, lng });
    
    const enrichment = await getLocationEnrichment(lat, lng);
    
    logger.info('Location enrichment fetched', { 
      traceId, 
      hasWeather: !!enrichment.weather,
      hasAirQuality: !!enrichment.airQuality,
      placesCount: enrichment.nearbyPlaces?.length || 0
    });
    
    return {
      status: 200,
      body: enrichment
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get location info';
    logger.error('Location info fetch failed', { traceId, error: message });
    return {
      status: 500,
      body: { error: message }
    };
  }
};

