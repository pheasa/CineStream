import { clientEnvSchema, parseEnv } from "./env";

/**
 * Validated client-side environment variables.
 * These are safe to use in the browser.
 * We prefer window.ENV (injected by the server in production)
 * over import.meta.env (baked in at build time).
 */
export const clientConfig = parseEnv(clientEnvSchema, import.meta.env);

export default clientConfig;
