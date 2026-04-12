# Use Node.js LTS version
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only the files needed for building the frontend and running the server
COPY tsconfig.json vite.config.ts index.html server.ts ./
COPY src ./src
COPY public ./public

# Build the frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
# We use tsx to run the TypeScript server directly
CMD ["npx", "tsx", "server.ts"]
