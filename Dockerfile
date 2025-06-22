# Ghost Squared - Production Docker Setup

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY SERVER/simple-server/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY SERVER/simple-server/ .

# Create uploads directory
RUN mkdir -p uploads

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/status || exit 1

# Start application
CMD ["node", "server.js"]
