# Deployment Guide

Complete deployment documentation for TESSA, covering Vercel, Netlify, and self-hosting options.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Lovable Deployment](#lovable-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Self-Hosting](#self-hosting)
- [Environment Variables](#environment-variables)
- [Supabase Configuration](#supabase-configuration)
- [Custom Domains](#custom-domains)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## Overview

TESSA is a React/Vite application with a Supabase backend. It can be deployed to various platforms:

| Platform | Pros | Cons |
|----------|------|------|
| Lovable | Zero config, integrated | Limited customization |
| Vercel | Great DX, fast CDN | Function limits on free tier |
| Netlify | Easy setup, forms | Build minute limits |
| Self-hosted | Full control | More maintenance |

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with the latest code
- [ ] Supabase project configured
- [ ] Environment variables ready
- [ ] Domain name (optional)

## Lovable Deployment

The simplest deployment option with zero configuration.

### Steps

1. **Publish from Editor**
   - Click the "Publish" button in the top-right corner
   - Wait for the build to complete
   - Your app is live at `yourproject.lovable.app`

2. **Update Deployment**
   - Frontend changes require clicking "Update" in the publish dialog
   - Backend changes (edge functions, migrations) deploy automatically

3. **Custom Domain**
   - Go to Project → Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

### Notes

- Lovable handles SSL certificates automatically
- Edge functions are deployed automatically
- PWA features work out of the box

## Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Setup

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   
   Add these in Vercel Dashboard → Settings → Environment Variables:
   
   ```env
   VITE_SUPABASE_URL=https://gcqfqzhgludrzkfajljp.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### Preview Deployments

Vercel automatically creates preview deployments for pull requests:

```bash
# Create preview deployment
vercel

# Promote to production
vercel --prod
```

## Netlify Deployment

### One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Manual Setup

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

3. **Environment Variables**
   
   Add in Site Settings → Build & deploy → Environment:
   
   ```env
   VITE_SUPABASE_URL=https://gcqfqzhgludrzkfajljp.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Service Worker
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Link to existing site
netlify link

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Self-Hosting

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add security headers
RUN echo 'add_header X-Frame-Options "DENY" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Deploy Commands

```bash
# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Update deployment
docker-compose pull && docker-compose up -d
```

### Static Hosting (Nginx/Apache)

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/tessa/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/tessa/dist

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    <Directory /var/www/tessa/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
    </IfModule>

    # Caching
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>

    # Security headers
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</VirtualHost>
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_URL` | Application URL | Auto-detected |
| `VITE_ENABLE_PWA` | Enable PWA features | `true` |

### Setting Variables

```bash
# Create .env.production
echo "VITE_SUPABASE_URL=https://gcqfqzhgludrzkfajljp.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=your_key" >> .env.production
```

## Supabase Configuration

### Edge Functions

Edge functions are deployed automatically when using Lovable. For self-hosting:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref gcqfqzhgludrzkfajljp

# Deploy functions
supabase functions deploy
```

### Database Migrations

```bash
# Push migrations
supabase db push

# Generate types
supabase gen types typescript --project-id gcqfqzhgludrzkfajljp > src/integrations/supabase/types.ts
```

## Custom Domains

### DNS Configuration

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | Platform IP |
| CNAME | www | yourdomain.com |

### Platform-Specific

**Vercel:**
1. Go to Settings → Domains
2. Add your domain
3. Configure DNS as shown

**Netlify:**
1. Go to Domain Settings
2. Add custom domain
3. Enable HTTPS

**Self-hosted:**
1. Configure Nginx/Apache virtual host
2. Obtain SSL certificate (Let's Encrypt)
3. Point DNS to server IP

## SSL/TLS Configuration

### Let's Encrypt (Self-hosted)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Production build
npm run build
```

### CDN Configuration

- Enable asset caching (1 year for hashed files)
- Use Brotli/Gzip compression
- Configure edge caching for static files

### Core Web Vitals

- **LCP**: Preload critical resources
- **FID**: Minimize JavaScript execution
- **CLS**: Set explicit dimensions for images

## Monitoring & Logging

### Vercel

- Built-in analytics at vercel.com/analytics
- Real User Monitoring included
- Log drains available

### Netlify

- Analytics in site dashboard
- Build logs available
- Function logs for debugging

### Self-hosted

```bash
# View Nginx access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log

# Set up log rotation
sudo logrotate /etc/logrotate.d/nginx
```

## Troubleshooting

### Common Issues

#### 404 on Page Refresh

**Cause:** SPA routing not configured

**Solution:** Add redirect rules:
```
/* /index.html 200
```

#### Environment Variables Not Loading

**Cause:** Variables not prefixed with `VITE_`

**Solution:** Ensure all client-side variables start with `VITE_`

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### CORS Errors

**Cause:** Supabase URL mismatch

**Solution:** Verify `VITE_SUPABASE_URL` matches your project

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run build

# Check build output
npm run preview
```

### Support

- [Lovable Discord](https://discord.gg/lovable)
- [Vercel Support](https://vercel.com/support)
- [Netlify Support](https://netlify.com/support)
- [Supabase Discord](https://discord.supabase.com)
