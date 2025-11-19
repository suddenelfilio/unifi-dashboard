# Unifi Dashboard - UniFi Network Monitor

> A real-time monitoring dashboard for UniFi network infrastructure with automatic refresh, client notifications, and Docker support.

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node.js-20.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 📊 Overview

A beautiful, real-time dashboard for monitoring UniFi network infrastructure across multiple sites. Built with vanilla JavaScript and Node.js, featuring automatic data refresh, sound notifications, and a responsive design.

Perfect for managing rental properties, business locations, or any multi-site UniFi deployment.

## ✨ Key Features

### 📈 Real-Time Monitoring
- **Auto-refresh** every 15 seconds with countdown timer
- **Site availability inference** - automatic detection based on device status
- **Network health metrics** - instant overview of your infrastructure
- **Collapsible site details** - focus on what matters

### 🔔 Smart Notifications
- **Visual alerts** for client connections/disconnections
- **Sound notifications** with mute toggle
- **Flash animations** on stat cards for attention
- **Persistent notification history** during session

### 🎛️ Flexible Filtering
- **Selective site viewing** - show/hide specific locations
- **Quick filters** - All, None, or Online Only
- **Collapsible filter panel** - maximize screen space
- **Site selection persistence** across refreshes

### 📱 Modern Interface
- **Responsive design** - works on desktop, tablet, and mobile
- **Dark mode friendly** styling
- **Smooth animations** and transitions
- **Status-based color coding** for quick identification

### 🐳 Production Ready
- **Docker support** with optimized Alpine image
- **Environment-based configuration** for security
- **Health checks** and proper signal handling
- **Non-root container** execution for security
- **BFF proxy** to handle CORS restrictions

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
│ Express BFF │ 
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

## 📸 Screenshots

### Main Dashboard
View all sites at a glance with real-time stats and health indicators.

### Site Details
Expandable site cards showing devices and connected clients.

### Notifications
Live alerts for client connections with sound and visual feedback.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Container**: Docker, Docker Compose
- **Security**: dotenv for secrets, non-root execution
- **API**: UniFi Network Application Integration

## 🎯 Use Cases

- **Property Management**: Monitor network across rental properties
- **Business Locations**: Track connectivity at multiple offices
- **IT Operations**: Dashboard for network operations center
- **Client Management**: Monitor guest and customer connections
- **Troubleshooting**: Quick identification of offline devices

## 🔒 Security Features

- Environment variable based configuration
- API key never exposed to frontend
- Non-root Docker container execution
- CORS-safe BFF proxy pattern
- Git-safe with proper .gitignore

## 📋 Requirements

- Node.js 20.x or higher
- UniFi Network Application with API access
- Valid UniFi API key
- Docker (optional, for containerized deployment)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC License - see LICENSE file for details

## 🙏 Acknowledgments

Built for Astro Rent network infrastructure monitoring.

## 📧 Support

For issues and questions, please open an issue on GitHub.
