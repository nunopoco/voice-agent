# Deploying Your Voice Assistant App with Retell AI and a Custom Domain

## 1. Prepare Your Application for Production

### Build the Frontend
```bash
cd /path/to/voice-chat-app
npm run build
```
This will create optimized production files in the `dist` directory.

### Update Environment Variables
Create a `.env.production` file with your production settings:
```
PORT=80
RETELL_API_KEY=your_production_retell_api_key
RETELL_AGENT_ID=your_production_retell_agent_id
DATABASE_PATH=/path/to/production/database/conversations.db
UPLOADS_PATH=/path/to/production/uploads
HOST=0.0.0.0
```

## 2. Choose a Hosting Provider

### Option A: Traditional VPS/Cloud Provider
- **AWS EC2**: Flexible virtual servers
- **DigitalOcean Droplet**: Simple VPS solution
- **Google Cloud Compute Engine**: Google's VPS offering
- **Linode/Akamai**: Developer-friendly VPS

### Option B: Platform as a Service (PaaS)
- **Heroku**: Simple deployment but may require adjustments for file storage
- **Railway.app**: Modern PaaS with simple deployment
- **Render**: Easy deployment with persistent storage options
- **Fly.io**: Global deployment with simple configuration

## 3. Register a Custom Domain

1. Purchase a domain from a registrar like:
   - Namecheap
   - Google Domains
   - GoDaddy
   - Cloudflare Registrar

2. Configure DNS settings to point to your hosting provider:
   - Create an A record pointing to your server's IP address
   - Or follow your hosting provider's DNS configuration instructions

## 4. Set Up SSL Certificate (Required for Retell Web SDK)

### Option A: Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# For Nginx
sudo apt-get install python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For Apache
sudo apt-get install python3-certbot-apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### Option B: Using Cloudflare (Free SSL)
1. Sign up for Cloudflare
2. Add your domain to Cloudflare
3. Update your domain's nameservers to Cloudflare's
4. Enable SSL in Cloudflare dashboard

## 5. Set Up a Web Server

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Static files
    location / {
        root /path/to/voice-chat-app/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6. Deploy Your Application

### Option A: Manual Deployment
```bash
# Clone your repository
git clone https://github.com/yourusername/voice-chat-app.git
cd voice-chat-app

# Install dependencies
npm install --production

# Build the frontend
npm run build

# Set up environment variables
cp .env.production .env

# Start the application with PM2 (process manager)
npm install -g pm2
pm2 start server/index.js --name "voice-assistant"
pm2 save
pm2 startup
```

### Option B: Docker Deployment
Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 80

CMD ["node", "server/index.js"]
```

Build and run the Docker container:
```bash
docker build -t voice-assistant .
docker run -d -p 80:80 --name voice-assistant \
  --env-file .env.production \
  -v voice_assistant_data:/app/server/database \
  -v voice_assistant_uploads:/app/server/uploads \
  voice-assistant
```

## 7. Set Up Continuous Deployment (Optional)

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build frontend
        run: npm run build
        
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/voice-chat-app
            git pull
            npm ci --production
            npm run build
            pm2 restart voice-assistant
```

## 8. Database Considerations

For production, consider:

1. **Regular backups** of your SQLite database
2. Or migrate to a more robust database like PostgreSQL:
   ```javascript
   // Install dependencies
   // npm install pg sequelize
   
   // Update database connection in server/database/init.js
   const { Sequelize } = require('sequelize');
   
   const sequelize = new Sequelize(process.env.DATABASE_URL, {
     dialect: 'postgres',
     ssl: process.env.NODE_ENV === 'production'
   });
   
   // Define models and migrate your data
   ```

## 9. Security Considerations

1. **Set up a firewall** (e.g., UFW on Ubuntu)
2. **Implement rate limiting** to prevent abuse
3. **Regularly update dependencies**
4. **Set secure HTTP headers**
5. **Implement proper CORS policies**

## 10. Monitoring and Maintenance

1. **Set up application monitoring** with tools like:
   - PM2 monitoring
   - New Relic
   - Datadog
   
2. **Set up error tracking** with:
   - Sentry
   - Rollbar
   
3. **Set up log management** with:
   - ELK Stack
   - Papertrail
   - Loggly

## 11. Scaling Considerations

As your application grows:

1. **Consider using a CDN** like Cloudflare or AWS CloudFront
2. **Implement caching strategies**
3. **Consider horizontal scaling** with a load balancer
4. **Optimize database queries**
5. **Consider serverless options** for specific components
6. **Monitor Retell AI API usage limits** and adjust your plan accordingly

## 12. Retell AI Configuration

1. **Create an account** at [Retell AI](https://www.retellai.com/)
2. **Create an agent** in the Retell dashboard
3. **Configure your agent**:
   - Set up the voice and language model
   - Configure webhooks if needed
   - Set up any custom behavior
4. **Get your API key and agent ID** from the dashboard
5. **Test your agent** before deploying to production
6. **Monitor usage** to avoid unexpected charges