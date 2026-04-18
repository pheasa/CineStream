import { clientEnvSchema, parseEnv, type ClientEnv } from './env';

/**
 * Validated client-side environment variables.
 * In development, Vite provides these via import.meta.env.
 * In production, we start with whatever is available (likely empty) 
 * and let ConfigLoader update it from the server.
 */
const initialConfig = clientEnvSchema.safeParse(import.meta.env);
let currentConfig: ClientEnv = initialConfig.success 
  ? initialConfig.data 
  : { VITE_APP_NAME: 'CineStream' } as ClientEnv; // Fallback for initial boot

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
