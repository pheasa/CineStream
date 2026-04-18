import { z } from 'zod';

/**
 * Client-side environment variables (prefixed with VITE_)
 * These are accessible in the browser.
 */
export const clientEnvSchema = z.object({
  VITE_APP_NAME: z.string(),
  VITE_ADSENSE_CLIENT_ID: z.string().default('ca-pub-XXXXXXXXXXXXXXXX'),
  VITE_ADSENSE_HOME_MID_SLOT: z.string().default(''),
  VITE_ADSENSE_HOME_BOTTOM_SLOT: z.string().default(''),
  VITE_ADSENSE_WATCH_TOP_SLOT: z.string().default(''),
  VITE_ADSENSE_WATCH_PLAYER_BOTTOM_SLOT: z.string().default(''),
  VITE_ADSENSE_WATCH_SLOT: z.string().default(''),
  VITE_ADSENSE_INTERSTITIAL_SLOT: z.string().default(''),
  VITE_ADSENSE_CATEGORY_MID_SLOT: z.string().default(''),
  VITE_ADSENSE_CATEGORY_SLOT: z.string().default(''),
  VITE_ADSENSE_TOP_SLOT: z.string().default(''),
  VITE_ADSENSE_BOTTOM_SLOT: z.string().default(''),
  VITE_ADSENSE_POPUP_SLOT: z.string().default(''),
});

/**
 * Server-side environment variables
 * These are NOT accessible in the browser.
 */
export const serverEnvSchema = z.object({
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  JWT_SECRET: z.string(),
  CATBOX_USER_HASH: z.string().nullable().default(null),
  CATBOX_ALBUM_SHORT: z.string().nullable().default(null),
  PORT: z.coerce.number().default(3000),
  VITE_ADMIN_USERNAME: z.string().nullable().default(null),
  VITE_ADMIN_PASSWORD: z.string().nullable().default(null),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Helper to parse and validate environment variables.
 * For client-side, we pass import.meta.env.
 * For server-side, we pass process.env.
 */
export function parseEnv<T extends z.ZodTypeAny>(schema: T, env: any): z.infer<T> {
  if (!env) {
    console.error('❌ Environment object is undefined. Ensure environment is loaded.');
    // Fallback to empty object to let Zod show which specific fields are missing
    env = {};
  }
  
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    
    // In production, we must have these, but we don't want to crash in a way that prevents the user from seeing the error.
    // However, for required fields, we can't really continue.
    // We'll throw a clearer error message.
    throw new Error(`Environment validation failed. Please check your .env or Settings. Missing/Invalid: ${Object.keys(parsed.error.format()).filter(k => k !== '_errors').join(', ')}`);
  }
  return parsed.data;
}
