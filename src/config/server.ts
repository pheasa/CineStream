import { serverEnvSchema, parseEnv } from './env';

/**
 * Validated server-side environment variables.
 * These should ONLY be used in the backend.
 * We can now use import.meta.env even in Node.js thanks to our init polyfill.
 */
export const serverConfig = parseEnv(serverEnvSchema, (import.meta as any).env);

export default serverConfig;
