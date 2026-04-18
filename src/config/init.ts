import dotenv from 'dotenv';

// Load .env file immediately
// This populates process.env which is the standard in Node.js
dotenv.config();

console.log('🔧 Environment variables loaded into process.env');
