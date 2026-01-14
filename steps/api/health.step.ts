import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Health',
  description: 'Health check endpoint to verify environment configuration',
  path: '/health',
  method: 'GET',
  virtualSubscribes: [],
  emits: [],
  flows: ['time-traveller-flow'],
  bodySchema: z.object({}),
  responseSchema: {
    // @ts-expect-error Zod schema type strictness
    200: z.object({
      status: z.string(),
      timestamp: z.number(),
      envConfigured: z.object({
        gemini: z.boolean(),
        googleMaps: z.boolean(),
        supabase: z.boolean(),
        jwt: z.boolean(),
      }),
    }),
  },
};

export const handler: Handlers['Health'] = async (req, { logger }) => {
  logger.info('Health: Checking environment configuration');

  const envConfigured = {
    gemini: !!process.env.GEMINI_API_KEY,
    googleMaps: !!process.env.GOOGLE_API_KEY,
    supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwt: !!process.env.JWT_SECRET,
  };

  logger.info('Health: Environment status', envConfigured);

  return {
    status: 200,
    body: {
      status: 'ok',
      timestamp: Date.now(),
      envConfigured,
    },
  };
};
