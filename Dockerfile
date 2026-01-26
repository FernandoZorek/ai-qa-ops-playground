# Use the official Microsoft Playwright image as base
FROM mcr.microsoft.com/playwright:v1.58.0-jammy

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN npx tsc

# Default environment variables (can be overridden via docker-compose)
ENV APP_VERSION=v1
ENV LLM_PROVIDER=openai

# Start the application orchestrator
CMD ["npx", "ts-node", "src/main.ts"]