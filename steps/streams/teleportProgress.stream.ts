import { StreamConfig } from 'motia'
import { z } from 'zod'

export const teleportProgressSchema = z.object({
  id: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  status: z.enum(['initiating', 'generating-image', 'generating-details', 'synthesizing-audio', 'completed', 'error']),
  progress: z.number().min(0).max(100),
  imageData: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  mapsUri: z.string().optional(),
  referenceImageUrl: z.string().optional(),
  usedStreetView: z.boolean().optional(),
  error: z.string().optional(),
  timestamp: z.number()
})

export type TeleportProgress = z.infer<typeof teleportProgressSchema>

export const config: StreamConfig = {
  name: 'teleportProgress',
  schema: z.toJSONSchema(teleportProgressSchema),
  baseConfig: { storageType: 'default' },
}

