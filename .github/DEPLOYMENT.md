# Deployment Guide

## GitHub Container Registry

This project automatically builds and publishes Docker images to GitHub Container Registry (ghcr.io) on every push to the main branch.

### Image Tags

Images are tagged as follows:

- `latest` - Latest build from the main branch
- `v1.2.3` - Semantic version tags (when you create GitHub releases)
- `sha-abc1234` - Git commit SHA for specific builds
- `main` - Latest from main branch
- `pr-123` - Pull request builds (for testing)

### Pulling Images

```bash
# Pull latest version
docker pull ghcr.io/suddenelfilio/unifi-dashboard:latest

# Pull specific version
docker pull ghcr.io/suddenelfilio/unifi-dashboard:v1.0.0

# Pull specific commit
docker pull ghcr.io/suddenelfilio/unifi-dashboard:sha-abc1234
```

### Making Images Public

By default, images are private. To make them public:

1. Go to your GitHub repository
2. Click on "Packages" in the sidebar
3. Click on your package (ui-monitor)
4. Click "Package settings"
5. Scroll to "Danger Zone"
6. Click "Change visibility"
7. Select "Public"

### Authentication

To pull private images:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/suddenelfilio/unifi-dashboard:latest
```

### Creating Releases

To trigger a versioned build:

1. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Or create a release through GitHub UI

This will trigger the workflow and create images tagged with:
- `v1.0.0`
- `v1.0`
- `v1`
- `latest`

### Multi-platform Support

Images are built for:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/aarch64)

This ensures compatibility with:
- Intel/AMD servers
- Apple Silicon (M1/M2/M3)
- Raspberry Pi 4+
- AWS Graviton
- Other ARM64 systems

### Workflow Triggers

The Docker build workflow runs on:

- **Push to main/master** - Builds and pushes `latest`
- **Pull requests** - Builds only (test, no push)
- **Tag push (v*.*.*)** - Builds versioned images
- **Manual trigger** - Via GitHub Actions UI

### Security Scanning

Every build is automatically scanned with Trivy for:
- Critical vulnerabilities
- High severity issues
- Security best practices

Results are uploaded to GitHub Security tab.

### Build Cache

The workflow uses GitHub Actions cache to speed up builds:
- First build: ~5-10 minutes
- Cached builds: ~1-2 minutes

### Monitoring Builds

Check build status:
1. Go to "Actions" tab in your repository
2. Click on the latest workflow run
3. View logs and artifacts

### Troubleshooting

**Build fails with authentication error:**
- Ensure GITHUB_TOKEN has package write permissions
- Check repository settings → Actions → General → Workflow permissions

**Image not appearing:**
- Check workflow completed successfully
- Verify package visibility settings
- Check you're logged in to ghcr.io

**Multi-platform build slow:**
- This is normal for first build
- Subsequent builds use cache
- Consider limiting to single platform if needed

### Local Testing

Test the workflow locally with act:

```bash
# Install act: https://github.com/nektos/act
brew install act

# Run workflow
act push
```

## Production Deployment Examples

### Docker Compose

```yaml
version: '3.8'
services:
  unifi-dashboard:
    image: ghcr.io/suddenelfilio/unifi-dashboard:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - UNIFI_API_KEY=${UNIFI_API_KEY}
      - UNIFI_API_URL=${UNIFI_API_URL}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unifi-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: unifi-dashboard
  template:
    metadata:
      labels:
        app: unifi-dashboard
    spec:
      containers:
      - name: dashboard
        image: ghcr.io/suddenelfilio/unifi-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: UNIFI_API_KEY
          valueFrom:
            secretKeyRef:
              name: unifi-secrets
              key: api-key
        - name: UNIFI_API_URL
          value: "https://your-unifi-host.com/proxy/network/integration/v1"
---
apiVersion: v1
kind: Service
metadata:
  name: unifi-dashboard
spec:
  selector:
    app: unifi-dashboard
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Portainer Stack

```yaml
version: '3.8'
services:
  unifi-dashboard:
    image: ghcr.io/suddenelfilio/unifi-dashboard:latest
    container_name: unifi-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      UNIFI_API_KEY: ${UNIFI_API_KEY}
      UNIFI_API_URL: ${UNIFI_API_URL}
      NODE_ENV: production
    networks:
      - monitoring

networks:
  monitoring:
    external: true
```
