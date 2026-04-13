import { serverEnvSchema, parseEnv } from './env';

/**
 * Validated server-side environment variables.
 * These should ONLY be used in the backend.
 */
export const serverConfig = parseEnv(serverEnvSchema, process.env);

export default serverConfig;
