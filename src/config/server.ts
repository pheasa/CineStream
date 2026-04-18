import { serverEnvSchema, parseEnv } from './env';

/**
 * Validated server-side environment variables.
 * These should ONLY be used in the backend.
 * We use process.env here as it is the standard and most reliable global source in Node.js.
 */
export const serverConfig = parseEnv(serverEnvSchema, process.env);

export default serverConfig;
