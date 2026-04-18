import { serverEnvSchema, parseEnv } from './env';

/**
 * Validated server-side environment variables.
 * These should ONLY be used in the backend.
 */
export const serverConfig = parseEnv(serverEnvSchema, (import.meta as any).env);

export default serverConfig;
