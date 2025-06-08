# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, etc.)
COPY package.json package-lock.json ./

# Install all dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of the application source code
COPY . .

# Run the build script (builds client and server into ./dist)
RUN npm run build

# Stage 2: Runner
FROM node:18-alpine AS runner

WORKDIR /app

# Install system dependencies for canvas
# build-base provides common build tools like g++
# cairo-dev, pango-dev, jpeg-dev, giflib-dev, librsvg-dev are for canvas
RUN apk add --no-cache build-base g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package.json (for metadata, and if any post-install scripts rely on it)
COPY --from=builder /app/package.json ./package.json

# Copy built application artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure the appuser owns the files
# node_modules might contain binaries that need specific ownership if built by root
# However, copying dist and node_modules after user creation is usually fine.
# For simplicity, we'll chown the whole /app directory.
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "dist/index.js"]
