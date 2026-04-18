import dotenv from 'dotenv';

// Load .env file immediately
dotenv.config();

// Polyfill import.meta.env for consistency with client-side Vite conventions
// This allows us to use import.meta.env on the server.
if (!(import.meta as any).env) {
  (import.meta as any).env = process.env;
}

console.log('🔧 Environment initialized (import.meta.env polyfilled)');
