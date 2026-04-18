import { clientEnvSchema, parseEnv, type ClientEnv } from './env';

/**
 * Validated client-side environment variables.
 * In development, Vite provides these via import.meta.env.
 * In production, we can update these at runtime via an API call.
 */
let currentConfig: ClientEnv = parseEnv(clientEnvSchema, import.meta.env);

// Export a proxy so that components always get the latest value from currentConfig
export const clientConfig = new Proxy({} as ClientEnv, {
  get(_, prop: string) {
    return (currentConfig as any)[prop];
  }
});

/**
 * Updates the global client configuration at runtime.
 */
export function updateClientConfig(newConfig: Partial<ClientEnv>) {
  currentConfig = {
    ...currentConfig,
    ...newConfig
  };
}

export default clientConfig;
