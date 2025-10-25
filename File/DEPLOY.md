# 🚀 Deployment Guide - People's Bill Platform

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/peoples-bill-ghana.git
cd peoples-bill-ghana

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your settings

# Initialize database
python setup_db.py

# Setup frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your settings
```

### 2. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit http://localhost:3000

## 🐳 Docker Deployment

### Quick Deploy with Docker Compose

```bash
# Clone repository
git clone https://github.com/yourusername/peoples-bill-ghana.git
cd peoples-bill-ghana

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend python setup_db.py

# View logs
docker-compose logs -f
```

Visit http://localhost

### Stop Services
```bash
docker-compose down
```

## ☁️ Cloud Deployment Options

### Option 1: Deploy to DigitalOcean

1. **Create a Droplet**
   - Ubuntu 22.04 LTS
   - Minimum: 2GB RAM, 2 vCPU
   - Add SSH key

2. **SSH and Setup**
```bash
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y

# Clone repository
git clone https://github.com/yourusername/peoples-bill-ghana.git
cd peoples-bill-ghana

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose up -d
```

3. **Setup Domain and SSL**
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d peoplesbill.gh -d www.peoplesbill.gh
```

### Option 2: Deploy to AWS EC2

1. **Launch EC2 Instance**
   - Amazon Linux 2 or Ubuntu 22.04
   - t3.small minimum
   - Security Group: Open ports 80, 443, 22

2. **Connect and Deploy**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone https://github.com/yourusername/peoples-bill-ghana.git
cd peoples-bill-ghana
docker-compose up -d
```

### Option 3: Deploy to Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Backend on Railway:**
1. Create account at railway.app
2. Connect GitHub repository
3. Add PostgreSQL database
4. Deploy backend folder
5. Set environment variables

### Option 4: Deploy to Heroku

```bash
# Install Heroku CLI
# Create Heroku app
heroku create peoples-bill-ghana

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# Run migrations
heroku run python backend/setup_db.py
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost/peoples_bill_ghana
SECRET_KEY=generate-a-secure-key-here
ENVIRONMENT=production
FRONTEND_URL=https://peoplesbill.gh
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.peoplesbill.gh
```

## 📊 Monitoring & Maintenance

### Health Checks
- Backend: `https://api.peoplesbill.gh/health`
- Frontend: `https://peoplesbill.gh/api/health`

### Backup Database
```bash
# Manual backup
docker-compose exec postgres pg_dump -U pbp_user peoples_bill_ghana > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * docker-compose exec -T postgres pg_dump -U pbp_user peoples_bill_ghana > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Update Application
```bash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong SECRET_KEY
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (ufw or iptables)
- [ ] Set up regular backups
- [ ] Monitor server resources
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Implement DDoS protection (Cloudflare)
- [ ] Regular security updates

## 📱 SMS Integration (Phase 2)

To enable SMS submissions:

1. Sign up for Africa's Talking
2. Get API credentials
3. Add to .env:
```env
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
```
4. Uncomment SMS code in backend

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps
docker-compose restart postgres

# Check connection
docker-compose exec postgres psql -U pbp_user -d peoples_bill_ghana
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Permission Denied
```bash
# Fix permissions
chmod +x setup_db.py
chown -R $USER:$USER .
```

## 📞 Support

- GitHub Issues: https://github.com/yourusername/peoples-bill-ghana/issues
- Email: support@peoplesbill.gh
- WhatsApp: +233 XX XXX XXXX

## 🎉 Post-Deployment

1. **Test all features:**
   - Submit a test submission
   - View statistics
   - Check bill display
   - Test admin login

2. **Monitor performance:**
   - Set up monitoring (Datadog, New Relic)
   - Configure alerts
   - Track user analytics

3. **Promote the platform:**
   - Share on social media
   - Contact media outlets
   - Engage civil society organizations
   - Organize launch event

---

**Built with ❤️ for Ghana's democratic future**
