import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { parseTravelCommand } from '../../services/gemini/commandParser';

const bodySchema = z.object({
  message: z.string().min(1),
  history: z.array(z.string()).optional().default([])
});

export const config: ApiRouteConfig = {
  name: 'ParseTravelCommand',
  type: 'api',
  path: '/parse-command',
  method: 'POST',
  description: 'Parses a natural language travel command',
  emits: [],
  flows: ['time-traveller-flow'],
  bodySchema,
  responseSchema: {
    200: z.object({
      isJump: z.boolean(),
      reply: z.string(),
      params: z.object({
        destination: z.string(),
        era: z.string(),
        style: z.string()
      }).optional()
    }),
    400: z.object({ error: z.string() })
  }
};

export const handler: Handlers['ParseTravelCommand'] = async (req, { logger, traceId }) => {
  try {
    const { message, history } = bodySchema.parse(req.body);
    
    logger.info('Parsing travel command', { traceId, message });
    
    const result = await parseTravelCommand(message, history);
    
    logger.info('Command parsed', { traceId, isJump: result.isJump });
    
    return {
      status: 200,
      body: result
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to parse command';
    logger.error('Command parsing failed', { traceId, error: errMessage });
    return {
      status: 400,
      body: { error: message }
    };
  }
};

