# UniFi Network Dashboard

A lightweight dashboard for monitoring UniFi network sites, devices, and clients.

## Features

- **Overview Dashboard**: View aggregated stats across all sites
  - Total sites count
  - Total devices with online/offline breakdown
  - Connected clients count
  - Network health percentage

- **Site Cards**: Individual cards for each site showing:
  - Total devices and clients
  - Online/offline device counts
  - List of devices with status
  - List of connected clients

- **BFF Proxy**: Lightweight Express server to handle CORS restrictions

## Setup

### Prerequisites

- Node.js (v14 or higher)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your UniFi API credentials:
   ```bash
   UNIFI_API_KEY=your-actual-api-key
   UNIFI_API_URL=https://your-unifi-host.com/proxy/network/integration/v1
   ```

4. Start the BFF server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. The API key is pre-filled from your configuration files
2. Click "Refresh Data" to reload all information
3. View aggregated statistics at the top
4. Scroll down to see individual site cards with detailed information

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP requests to /api/*
       │
┌──────▼──────┐
│ Express BFF │  ← Handles CORS
│  (server.js)│
└──────┬──────┘
       │
       │ Proxies to UniFi API
       │
┌──────▼──────┐
│  UniFi API  │
└─────────────┘
```

## Files

- `index.html` - Main HTML page
- `style.css` - Dashboard styles
- `app.js` - Frontend JavaScript
- `server.js` - BFF proxy server
- `package.json` - Node.js dependencies

## API Endpoints

The BFF exposes the following endpoints:

- `GET /api/sites` - List all sites
- `GET /api/sites/:siteId/devices` - Get devices for a site
- `GET /api/sites/:siteId/clients` - Get clients for a site

All endpoints require the `X-API-KEY` header.

## Docker Deployment

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
UNIFI_API_KEY=your-api-key-here
UNIFI_API_URL=https://your-unifi-host.com/proxy/network/integration/v1
PORT=3000
```

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t unifi-dashboard .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e UNIFI_API_KEY=your-api-key-here \
  -e UNIFI_API_URL=https://your-unifi-host.com/proxy/network/integration/v1 \
  --name unifi-dashboard \
  unifi-dashboard

# Or use an env file
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name unifi-dashboard \
  unifi-dashboard

# View logs
docker logs -f unifi-dashboard

# Stop the container
docker stop unifi-dashboard

# Remove the container
docker rm unifi-dashboard
```

### Using Docker Compose

```bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env with your actual values

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Access the Dashboard

Once running, access the dashboard at:
```
http://localhost:3000
```

Or from another machine:
```
http://<your-server-ip>:3000
```
