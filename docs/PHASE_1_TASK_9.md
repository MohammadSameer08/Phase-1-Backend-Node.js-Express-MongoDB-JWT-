# Phase 1 Task 9: Docker Containerization

## Overview

This task implements Docker containerization for your Node.js/Express/MongoDB backend application. Docker enables consistent deployment across development, testing, and production environments by packaging the application and its dependencies into isolated containers.

## Learning Objectives

By completing this task, you will:
- ✅ Understand Docker concepts: images, containers, layers, registries
- ✅ Create optimized Dockerfiles for Node.js applications
- ✅ Build and run Docker containers locally
- ✅ Use Docker Compose to orchestrate multi-container applications
- ✅ Implement multi-stage builds to reduce image size
- ✅ Set up environment configuration for Docker deployments
- ✅ Debug container issues and optimize performance
- ✅ Implement production-grade Docker practices

## Architecture

### Docker Ecosystem Components

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Host/Engine                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  App Container   │         │  MongoDB         │    │
│  │  (Node.js)       │         │  Container       │    │
│  │                  │◄────────┤                  │    │
│  │  Port: 3000      │         │  Port: 27017     │    │
│  │                  │         │                  │    │
│  └──────────────────┘         └──────────────────┘    │
│         △                              △               │
│         │                              │               │
│  ┌──────┴──────────────────────────────┴────────┐    │
│  │      Docker Network (bridge)                 │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │   Volumes (Persistent Data Storage)          │    │
│  │   - mongo_data: MongoDB data                 │    │
│  │   - app_logs: Application logs               │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└─────────────────────────────────────────────────────────┘
           Host Machine (Windows/Mac/Linux)
```

### Build Process

```
Dockerfile
    │
    ▼
┌─────────────────────────────────┐
│  Docker Build Command           │
│  docker build -t my-app .       │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Layered Image (read-only)      │
│  ┌─────────────────────────────┐│
│  │ Layer 1: Base (node:22)     ││
│  ├─────────────────────────────┤│
│  │ Layer 2: Dependencies       ││
│  ├─────────────────────────────┤│
│  │ Layer 3: Application Code   ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Docker Run Command             │
│  docker run -p 3000:3000 my-app │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Running Container              │
│  (Isolated, ephemeral)          │
└─────────────────────────────────┘
```

## Implementation Steps

### Step 1: Verify Dockerfile

**File:** `dockerfile` (Already exists)

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Key Points:**
- `FROM node:22-alpine` — Uses lightweight Alpine Linux (150MB vs 1GB+)
- `WORKDIR /app` — Sets working directory inside container
- `COPY package*.json ./` — Copies both package.json and package-lock.json
- `RUN npm install` — Installs dependencies during build
- `COPY . .` — Copies application code
- `EXPOSE 3000` — Documents port (doesn't publish it)
- `CMD ["npm", "start"]` — Default command to run

### Step 2: Create .dockerignore

**File:** `.dockerignore` (Similar to .gitignore)

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
.DS_Store
dist
build
logs
*.log
.vscode
.idea
coverage
.nyc_output
uploads
```

**Why:** Prevents unnecessary files from being copied into image, reducing size and build time.

### Step 3: Build Docker Image

**Command:**
```bash
docker build -t my-app .
```

**Options:**
```bash
# With specific version tag
docker build -t my-app:1.0 .

# With registry (for pushing to Docker Hub)
docker build -t username/my-app:latest .

# With build arguments
docker build -t my-app --build-arg NODE_ENV=production .

# Without cache (fresh build)
docker build -t my-app --no-cache .
```

**Verify Build:**
```bash
docker images | grep my-app
```

**Expected Output:**
```
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
my-app       latest    a1b2c3d4e5f6   2 minutes ago  180MB
```

### Step 4: Run Docker Container

**Basic Command:**
```bash
docker run -p 3000:3000 my-app
```

**With Environment Variables:**
```bash
docker run -p 3000:3000 \
  --env MONGO_URI=mongodb://mongo:27017/auth_db \
  --env JWT_SECRET=your_secret_key \
  my-app
```

**Using .env File:**
```bash
docker run -p 3000:3000 --env-file .env my-app
```

**Interactive Mode (see logs):**
```bash
docker run -it -p 3000:3000 my-app
```

**Detached Mode (background):**
```bash
docker run -d -p 3000:3000 --name my-app-container my-app
```

**With Volume Mounts (persistent logs):**
```bash
docker run -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  my-app
```

**Full Production Command:**
```bash
docker run -d \
  --name my-app \
  -p 8080:3000 \
  --env-file .env \
  -v app_logs:/app/logs \
  --restart unless-stopped \
  my-app
```

### Step 5: Create .env.docker

**File:** `.env.docker` (Docker-specific environment)

```env
# Node Environment
NODE_ENV=production

# MongoDB Connection (using service name for Docker Compose)
MONGO_URI=mongodb://mongo:27017/auth_db

# JWT Secret (Generate with: openssl rand -base64 32)
JWT_SECRET=your_very_secure_secret_key_here_min_32_chars

# Server Port
PORT=3000

# Logging
LOG_LEVEL=info
```

**Generate Secure JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Step 6: Create Docker Compose (Multi-Container)

**File:** `docker-compose.yml`

```yaml
version: '3.9'

services:
  # Node.js Application
  app:
    build:
      context: .
      dockerfile: dockerfile
    container_name: auth_app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/auth_db
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules
      - app_logs:/app/logs
    networks:
      - app_network
    command: npm run dev
    restart: unless-stopped

  # MongoDB Database
  mongo:
    image: mongo:7.0-alpine
    container_name: auth_mongo
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=auth_db
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER:-admin}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:-password}
    volumes:
      - mongo_data:/data/db
      - mongo_logs:/var/log/mongodb
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo_data:
    driver: local
  app_logs:
    driver: local
  mongo_logs:
    driver: local

networks:
  app_network:
    driver: bridge
```

**Key Features:**
- `build:` — Builds image from Dockerfile
- `depends_on:` — Ensures MongoDB starts before app
- `volumes:` — Mounts code for development hot-reload
- `networks:` — Enables service-to-service communication
- `healthcheck:` — MongoDB health verification
- `restart: unless-stopped` — Auto-restart on failure

### Step 7: Create .env for Docker Compose

**File:** `.env` (for docker-compose variables)

```env
# MongoDB credentials
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=secure_password_123

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_key_here_minimum_32_chars
```

### Step 8: Docker Compose Commands

**Start Services:**
```bash
docker-compose up
```

**Start in Background:**
```bash
docker-compose up -d
```

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongo

# Last 50 lines
docker-compose logs --tail=50 app
```

**Stop Services:**
```bash
docker-compose down
```

**Stop and Remove Volumes:**
```bash
docker-compose down -v
```

**Rebuild Images:**
```bash
docker-compose up -d --build
```

**Execute Command in Container:**
```bash
docker-compose exec app npm test
docker-compose exec mongo mongosh
```

## Optimizations

### Multi-Stage Build (Reduce Image Size)

**File:** `Dockerfile.multistage`

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
```

**Benefits:**
- Final image size: ~180MB (vs 250MB+ without optimization)
- Only production dependencies included
- Smaller deployment packages

**Usage:**
```bash
docker build -f Dockerfile.multistage -t my-app:optimized .
```

### Production Compose File

**File:** `docker-compose.prod.yml`

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: dockerfile
      args:
        NODE_ENV: production
    container_name: auth_app_prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      mongo:
        condition: service_healthy
    volumes:
      - app_logs:/app/logs
    networks:
      - app_network
    restart: always
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  mongo:
    image: mongo:7.0-alpine
    container_name: auth_mongo_prod
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    volumes:
      - mongo_data:/data/db
    networks:
      - app_network
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

volumes:
  mongo_data:
  app_logs:

networks:
  app_network:
    driver: bridge
```

**Usage:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Testing & Validation

### Test Case 1: Build Image Successfully

**Steps:**
1. Run build command
2. Verify image created
3. Check image size

**Commands:**
```bash
docker build -t my-app .
docker images | grep my-app
docker inspect my-app | grep Size
```

**Expected Output:**
```
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
my-app       latest    a1b2c3d4e5f6   2 minutes ago  180MB
```

### Test Case 2: Run Container and Verify Connectivity

**Steps:**
1. Start container
2. Check if listening on port 3000
3. Test health endpoint

**Commands:**
```bash
docker run -d -p 3000:3000 --name test-app my-app
docker ps | grep test-app
curl http://localhost:3000/
```

**Expected Output:**
```
CONTAINER ID   IMAGE      COMMAND            PORTS
a1b2c3d4e5f6   my-app     "npm start"        0.0.0.0:3000->3000/tcp
Hello, Sameer! Welcome to the User Authentication API.
```

### Test Case 3: Environment Variables

**Steps:**
1. Start container with env file
2. Verify env variables inside container
3. Check application uses them

**Commands:**
```bash
docker run -d -p 3000:3000 --env-file .env --name app-env my-app
docker exec app-env node -e "console.log(process.env.NODE_ENV)"
docker exec app-env node -e "console.log(process.env.JWT_SECRET.substring(0,10)+'...')"
```

**Expected Output:**
```
production
your_secure_jwt_secret_key_he...
```

### Test Case 4: Docker Compose Multi-Container

**Steps:**
1. Start docker-compose stack
2. Verify both services running
3. Check network communication
4. Test API endpoints

**Commands:**
```bash
docker-compose up -d
docker-compose ps

# Check app logs
docker-compose logs app

# Check MongoDB connectivity
docker-compose exec app curl http://localhost:3000/api/auth/me

# Check MongoDB directly
docker-compose exec mongo mongosh
```

**Expected Output:**
```
NAME              STATUS              PORTS
auth_app          Up 2 minutes        0.0.0.0:3000->3000
auth_mongo        Up 2 minutes        0.0.0.0:27017->27017
```

### Test Case 5: Volume Mounts (Persistent Data)

**Steps:**
1. Run container with volume mount
2. Create a file inside container
3. Verify file persists on host
4. Stop and restart container

**Commands:**
```bash
docker run -d -p 3000:3000 -v $(pwd)/logs:/app/logs --name volume-test my-app
docker exec volume-test touch /app/logs/test-file.txt
ls -la logs/ | grep test-file
docker stop volume-test
docker start volume-test
ls -la logs/ | grep test-file
```

**Expected Output:**
```
-rw-r--r-- 1 user staff 0 Jul 23 15:45 test-file.txt
(File persists after restart)
```

### Test Case 6: Container Resource Limits

**Steps:**
1. Run container with memory/CPU limits
2. Monitor resource usage
3. Verify limits enforced

**Commands:**
```bash
docker run -d -p 3000:3000 \
  --memory=512m \
  --cpus=0.5 \
  --name limited-app my-app

docker stats limited-app
```

**Expected Output:**
```
CONTAINER      MEM LIMIT
limited-app    512MiB
```

### Test Case 7: Container Health Check

**Steps:**
1. Start container with health check
2. Monitor health status
3. Verify endpoint response

**Commands:**
```bash
docker run -d -p 3000:3000 \
  --health-cmd='curl -f http://localhost:3000/ || exit 1' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --name healthy-app my-app

sleep 5
docker inspect healthy-app | grep -A 5 '"Health"'
```

**Expected Output:**
```
"Health": {
  "Status": "healthy",
  "FailingStreak": 0,
  "Runs": [...]
}
```

## Troubleshooting

### Issue 1: Container Exits Immediately

**Symptoms:**
```
docker run -d -p 3000:3000 my-app
docker ps (no output)
docker ps -a (shows exited)
```

**Root Causes:**
- Application error on startup
- Missing environment variables
- Port already in use

**Solutions:**
```bash
# Check logs
docker logs container-id

# Run interactively to see errors
docker run -it -p 3000:3000 my-app

# Check if port is in use
netstat -ano | findstr :3000

# Kill process on port
taskkill /PID <PID> /F

# Change port mapping
docker run -d -p 8080:3000 my-app
```

### Issue 2: Cannot Connect to MongoDB from App Container

**Symptoms:**
```
MongooseError: Cannot connect to mongodb://localhost:27017
Connection refused
```

**Root Causes:**
- Using `localhost` instead of service name
- MongoDB not started yet
- Network not connected

**Solutions:**
```bash
# Use service name in docker-compose
MONGO_URI=mongodb://mongo:27017/auth_db

# Ensure depends_on is set
depends_on:
  - mongo

# Wait for MongoDB to be ready
depends_on:
  mongo:
    condition: service_healthy
```

### Issue 3: Volumes Not Syncing

**Symptoms:**
```
Code changes on host don't reflect in container
```

**Root Causes:**
- Incorrect volume syntax
- Volume not mounted to correct path
- Bind mount not supported on Windows

**Solutions:**
```bash
# Correct syntax
-v $(pwd):/app  # Unix/Mac
-v %cd%:/app    # Windows PowerShell
-v ${PWD}:/app  # Windows Git Bash

# For node_modules, use named volume
-v /app/node_modules

# Verify mount
docker inspect container-id | grep -A 5 '"Mounts"'
```

### Issue 4: Image Size Too Large

**Symptoms:**
```
docker images
my-app  250MB (too large)
```

**Root Causes:**
- Including unnecessary files (.git, logs, etc.)
- Development dependencies in production
- Multiple build artifacts

**Solutions:**
```bash
# Use .dockerignore
# Use multi-stage builds
# Use Alpine base images
# Minimize layers

docker build -f Dockerfile.multistage -t my-app:optimized .
docker images | grep my-app
```

### Issue 5: Port Already in Use

**Symptoms:**
```
docker: Error response from daemon: driver failed programming external connectivity
```

**Root Causes:**
- Another container using same port
- Process on host using port
- Previous container not cleaned up

**Solutions:**
```bash
# Find what's using port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill process
taskkill /PID <PID> /F

# Use different port
docker run -p 8080:3000 my-app

# Clean up containers
docker container prune
```

### Issue 6: Insufficient Disk Space

**Symptoms:**
```
Error: No space left on device
```

**Root Causes:**
- Multiple image layers
- Unused images/containers
- Large volumes

**Solutions:**
```bash
# Clean up unused resources
docker system prune -a

# Check disk usage
docker system df

# Remove specific images
docker rmi image-id

# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune
```

## Production Considerations

### 1. Use Environment-Based Configuration

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Implement Health Checks

```yaml
healthcheck:
  test: curl -f http://localhost:3000/health || exit 1
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 3. Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### 4. Restart Policies

```yaml
restart: always              # Always restart
restart: unless-stopped      # Unless explicitly stopped
restart: on-failure          # Only on error
restart: no                  # Don't restart
```

### 5. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 6. Security Best Practices

```dockerfile
# Don't run as root
RUN addgroup -S app && adduser -S app -G app
USER app

# Copy only necessary files
COPY --chown=app:app . .

# Use secrets for sensitive data
# docker run --secret jwt_secret
```

### 7. Push to Registry

```bash
# Tag image
docker tag my-app username/my-app:1.0

# Login to Docker Hub
docker login

# Push
docker push username/my-app:1.0

# Pull and run
docker run -p 3000:3000 username/my-app:1.0
```

## Common Docker Commands Reference

### Image Commands

```bash
# List images
docker images

# Build image
docker build -t name:tag .

# Remove image
docker rmi image-id

# Tag image
docker tag old-name new-name

# Push image
docker push username/image:tag

# Pull image
docker pull image:tag

# Inspect image
docker inspect image-id
```

### Container Commands

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Run container
docker run -p 3000:3000 image-name

# Stop container
docker stop container-id

# Start container
docker start container-id

# Remove container
docker rm container-id

# View logs
docker logs container-id

# Execute command
docker exec container-id command

# Copy file
docker cp container-id:/path/to/file ./local/path
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute command
docker-compose exec service-name command

# Rebuild images
docker-compose up -d --build

# Remove volumes
docker-compose down -v
```

## Summary

✅ **Completed in this task:**
- Dockerfile optimization with Alpine Linux
- .dockerignore configuration
- Single-container image building and running
- Docker Compose multi-container orchestration
- MongoDB containerization with health checks
- Environment variable configuration
- Volume management for persistent data
- Multi-stage builds for optimization
- Production-grade compose configuration
- Resource limits and health checks

✅ **Testing Coverage:**
- Image build verification
- Container connectivity
- Environment variables
- Multi-container orchestration
- Persistent volumes
- Resource limits
- Health checks

✅ **Troubleshooting Guides:**
- Container exits immediately
- MongoDB connection issues
- Volume syncing problems
- Image size optimization
- Port conflicts
- Disk space management

**Next Steps:**
1. Push images to Docker Hub registry
2. Implement Docker in CI/CD pipeline
3. Set up Kubernetes for orchestration
4. Implement container logging aggregation
5. Set up Docker vulnerability scanning
6. Implement auto-scaling policies
