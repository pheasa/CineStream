import { clientEnvSchema, parseEnv } from './env';

/**
 * Validated client-side environment variables.
 * These are safe to use in the browser.
 */
export const clientConfig = parseEnv(clientEnvSchema, import.meta.env);

export default clientConfig;
