# Dewdrop Docker Deployment

This repository contains Docker configuration files for deploying the Dewdrop flashcard application.

## Prerequisites

- Docker and Docker Compose installed on your system
- Supabase account with a project set up (for backend functionality)
- Your Supabase URL and anon key

## Setup

1. Clone this repository
2. Create a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file and add your Supabase URL and anonymous key:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   > Note: In the `docker-compose.yml` file, these environment variables are mapped to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` which are the variables expected by the Vite application.

## Deployment

### Environment Variables

For a Vite application, environment variables starting with `VITE_` need to be available during both build time and runtime. Our Docker configuration handles this by:

1. Using build args to pass variables to the Dockerfile during build time
2. Creating a `.env` file inside the container
3. Setting environment variables for runtime access

This approach ensures that the Supabase credentials are properly integrated into the built JavaScript bundle.

### Production Deployment

To deploy the application in production mode:

```bash
docker compose up -d
```

This will:
- Build the frontend using Vite with the Supabase environment variables
- Serve the application using Nginx
- Make the application available at http://localhost:8080

**Important**: Make sure your `.env` file contains the correct Supabase credentials and is located in the project root directory (same level as docker-compose.yml, not inside the dewdrop directory).

### Development Deployment

For development with hot-reloading:

1. Uncomment the `dev` service in the `docker-compose.yml` file
2. Run:
   ```bash
   docker-compose up dev
   ```
3. The development server will be available at http://localhost:3000

## Configuration Files

- `docker-compose.yml` - Main Docker Compose configuration
- `dewdrop/Dockerfile` - Production build configuration
- `dewdrop/Dockerfile.dev` - Development configuration
- `dewdrop/nginx.conf` - Nginx configuration for serving the SPA

## Logs

Nginx logs are stored in a Docker volume:

```bash
docker-compose exec frontend ls -la /var/log/nginx
```

## Troubleshooting

### Build failures related to missing dependencies

If you encounter build errors related to missing dependencies like:
```
error during build:
[vite]: Rollup failed to resolve import "react-markdown" from "/app/src/components/cards/CardList.jsx".
```

The Dockerfile has been configured to install the required `react-markdown` dependency. If you encounter other missing dependency errors, you can add them to the Dockerfile:

```dockerfile
# Add after the npm ci line
RUN npm install missing-dependency-name
```

### Container not starting

Check the logs:

```bash
docker compose logs frontend
```

### Docker credential issues

If you encounter image pull errors such as:
```
failed to solve: node:20.16.0: failed to resolve source metadata for docker.io/library/node:20.16.0: error getting credentials
```

Try logging in to Docker Hub first:
```bash
docker login
```

Also, try running Docker without sudo to avoid credential issues:
```bash
docker compose up -d
```

### CORS Issues with Supabase

Ensure your Supabase project has the correct CORS configuration in the API settings. Add your Docker host to the allowed origins (e.g., http://localhost:8080).

### Environment Variables Not Working

Make sure your `.env` file is in the same directory as your `docker-compose.yml` file (not inside the dewdrop directory).

## Stopping the Application

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
