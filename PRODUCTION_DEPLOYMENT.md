# 🚀 Production Deployment Guide

## 📋 Overview

This guide covers deploying the Thirumala Business Management System to production with enterprise-grade security, performance, and reliability.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (SSL)   │───▶│  Express Server │───▶│   Supabase DB   │
│   (Load Bal.)   │    │   (Node.js)     │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### Required Software:
- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **Git**
- **SSL Certificate** (Let's Encrypt or commercial)

### Required Services:
- **Supabase Project** (already configured)
- **Domain Name** (optional but recommended)
- **VPS/Cloud Server** (DigitalOcean, AWS, etc.)

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Step 1: Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### Step 2: Clone and Configure
```bash
# Clone repository
git clone <your-repo-url>
cd thirumala-business-system

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

#### Step 3: Configure Environment
```env
# Production Environment
NODE_ENV=production
PORT=3000

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Step 4: SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

#### Step 5: Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f thirumala-app
```

### Option 2: Direct Server Deployment

#### Step 1: Server Setup
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

#### Step 2: Application Deployment
```bash
# Clone repository
git clone <your-repo-url>
cd thirumala-business-system

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start with PM2
pm2 start server.js --name "thirumala-app"
pm2 startup
pm2 save
```

#### Step 3: Nginx Configuration
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/thirumala
sudo ln -s /etc/nginx/sites-available/thirumala /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Security Headers
Already configured in `nginx.conf` and `server.js`:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

### 3. Rate Limiting
- API: 10 requests/second
- Login: 5 requests/minute
- Configured in both Nginx and Express

### 4. Environment Security
```bash
# Secure environment file
chmod 600 .env

# Remove development files
rm -rf node_modules/.cache
rm -rf .vscode
rm -rf .git
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# PM2 monitoring (if using direct deployment)
pm2 monit

# Docker monitoring
docker stats

# Log monitoring
docker-compose logs -f
```

### 2. Health Checks
```bash
# Application health
curl https://yourdomain.com/health

# API status
curl https://yourdomain.com/api/status
```

### 3. Log Management
```bash
# View application logs
docker-compose logs thirumala-app

# View nginx logs
docker-compose logs nginx

# Or for direct deployment
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart thirumala-app
```

## 🚨 Backup Strategy

### 1. Database Backup
Supabase provides automatic backups, but you can also:
```bash
# Export data (if needed)
npm run export-data

# Backup environment files
cp .env .env.backup.$(date +%Y%m%d)
```

### 2. Application Backup
```bash
# Create application backup
tar -czf thirumala-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  .
```

## 🔧 Maintenance

### 1. Regular Updates
```bash
# Update dependencies
npm audit fix
npm update

# Rebuild and restart
npm run build
docker-compose restart
# or
pm2 restart thirumala-app
```

### 2. SSL Certificate Renewal
```bash
# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet

# Manual renewal
sudo certbot renew
```

### 3. Performance Monitoring
```bash
# Check resource usage
docker stats
# or
htop

# Monitor disk space
df -h

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
```

## 🆘 Troubleshooting

### Common Issues:

1. **Application won't start**
   ```bash
   # Check logs
   docker-compose logs thirumala-app
   # or
   pm2 logs thirumala-app
   ```

2. **Database connection issues**
   ```bash
   # Verify Supabase credentials
   curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
        "$VITE_SUPABASE_URL/rest/v1/"
   ```

3. **SSL certificate issues**
   ```bash
   # Test SSL
   openssl s_client -connect yourdomain.com:443
   
   # Renew certificate
   sudo certbot renew
   ```

4. **Performance issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Monitor network
   netstat -tulpn
   ```

## 📞 Support

### Emergency Contacts:
- **Server Provider**: Your VPS/cloud provider support
- **Domain Provider**: Your domain registrar support
- **SSL Provider**: Let's Encrypt or your SSL provider
- **Supabase**: Supabase support team

### Monitoring Tools:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Performance**: Google PageSpeed, GTmetrix

---

## ✅ Deployment Checklist

- [ ] Server prepared with required software
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Application built and deployed
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on deployment process

**🎉 Your application is now production-ready!** 