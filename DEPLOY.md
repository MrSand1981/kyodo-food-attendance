# Kyodo Food Attendance - Deployment Guide

## 🚀 Quick Start (Production)

### 1. Prerequisites
- Docker 24+ & Docker Compose v2+
- GitHub repository with Actions enabled
- (Optional) MongoDB Atlas account for cloud sync

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your values (REQUIRED: JWT_SECRET)
nano .env

# Generate secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy with Docker Compose
```bash
# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f

# Check health
curl http://localhost:5000/health
```

---

## 🔧 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev servers (frontend + backend)
npm run dev          # Frontend at :3000 (proxies to :5000)
npm run server       # Backend at :5000

# Or run both together:
npm run dev:full
```

### Code Quality
```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format

# Test
npm run test
```

---

## 🐳 Docker Production Deployment

### Build & Run
```bash
# Build image
docker compose build

# Start in background
docker compose up -d

# View logs
docker compose logs -f kyodo-app

# Stop
docker compose down
```

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# Docker health
docker compose ps
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Or use GitHub auto-update (from Admin panel)
```

---

## 🔄 GitHub Actions CI/CD

### Required Secrets (GitHub Settings > Secrets > Actions)

| Secret | Description | Required |
|--------|-------------|----------|
| `GITHUB_TOKEN` | Auto-provided by GitHub | Yes |
| `DEPLOY_SSH_KEY` | SSH private key for server | Optional |
| `DEPLOY_HOST` | Server IP/hostname | Optional |
| `DEPLOY_USER` | SSH username | Optional |
| `SLACK_WEBHOOK` | Failure notifications | Optional |

### Workflow Triggers
| Event | Jobs Run |
|-------|----------|
| Push to `main` | Lint → Test → Build → Docker → Sign → Deploy |
| Pull Request to `main` | Lint → Test → Build |
| Manual trigger | All jobs |

### Local Docker Testing
```bash
# Test build locally
docker build -t kyodo-test .

# Run container
docker run -d -p 5000:5000 --env-file .env kyodo-test

# Test
curl http://localhost:5000/health
```

---

## 🔐 Security Checklist

### Before Production Deploy
- [ ] Strong `JWT_SECRET` (32+ chars)
- [ ] Change default admin password
- [ ] Configure `ADMIN_EMAIL`/`ADMIN_PHONE` for password recovery
- [ ] Set up MongoDB Atlas (optional, for cloud sync)
- [ ] Configure GitHub token for auto-update
- [ ] Set up SSL/TLS (nginx reverse proxy recommended)
- [ ] Configure firewall (only ports 80/443/5000)
- [ ] Set up monitoring/alerting

### JWT Secret Generation
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📦 Backup & Recovery

### Manual Backup
```bash
# Backup database
cp data/database.json backups/database_$(date +%Y%m%d_%H%M%S).json
cp data/kyodo_employee_vault.json backups/vault_$(date +%Y%m%d_%H%M%S).json

# Backup to remote
rsync -avz data/ user@backup-server:/path/to/backups/
```

### Automated Backup (Cron)
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

### Restore
```bash
# Stop app
docker compose down

# Restore files
cp backups/database_20261101_020000.json data/database.json
cp backups/vault_20261101_020000.json data/kyodo_employee_vault.json

# Start app
docker compose up -d
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change PORT in .env or stop conflicting service |
| JWT_SECRET too short | Generate 32+ char secret |
| GitHub update fails | Check GITHUB_TOKEN has repo scope |
| Auto-update not working | Check GitHub Actions workflow runs |
| Data not persisting | Check volume mounts in docker-compose.yml |

### Logs
```bash
# Application logs
docker compose logs -f kyodo-app --tail=100

# GitHub Actions logs
# Go to GitHub > Actions > Workflow run
```

### Reset Everything
```bash
# Nuclear option - destroys all data!
docker compose down -v
docker system prune -af
rm -rf data/
# Then redeploy from scratch
```

---

## 📞 Support

- **GitHub Issues**: Report bugs/features
- **GitHub Actions**: Check workflow runs for CI/CD issues
- **Docker Hub**: Check image builds at `ghcr.io/<username>/kyodo-food-attendance`

---

*Last updated: 2026-11-01 | Version 2.0.0*