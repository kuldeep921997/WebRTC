# Deployment Guide

Complete guide for deploying the WebRTC MERN application to production.

## 🚀 Quick Deploy Options

### Option 1: Render (Server) + Vercel (Client) [Recommended]
- ✅ Free tier available
- ✅ Easy setup
- ✅ Auto-deploy from GitHub
- ✅ HTTPS included

### Option 2: Railway + Netlify
- ✅ Modern interface
- ✅ Simple configuration
- ✅ Good free tier

### Option 3: Heroku + GitHub Pages
- ✅ Traditional option
- ⚠️ Heroku free tier deprecated (use eco dyno)

---

## 📋 Prerequisites

1. **GitHub Repository** ✅
   - Repository: `git@github.com:kuldeep921997/WebRTC.git`

2. **Accounts Needed**:
   - [Render](https://render.com) - For server
   - [Vercel](https://vercel.com) - For client
   - Or alternatives: Railway, Netlify, Heroku

3. **Environment Variables Ready**:
   - Server URL for client
   - API keys for deployment platforms

---

## 🔧 Step-by-Step Deployment

### Part 1: Deploy Server to Render

#### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

#### 2. Create New Web Service
- Dashboard → "New +" → "Web Service"
- Connect your GitHub repo: `kuldeep921997/WebRTC`
- Configure:
  ```
  Name: webrtc-signaling-server
  Region: Oregon (or closest to you)
  Branch: main
  Root Directory: server
  Environment: Node
  Build Command: npm install
  Start Command: node index.js
  Plan: Free
  ```

#### 3. Add Environment Variables
- Go to Environment tab
- Add:
  ```
  NODE_ENV=production
  PORT=5000
  ```

#### 4. Deploy
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- Note your URL: `https://webrtc-signaling-server-xxxx.onrender.com`

#### 5. Verify Deployment
```bash
curl https://your-server-url.onrender.com/health
```

Expected response:
```json
{"status":"ok","roomCount":0,"timestamp":"..."}
```

### Part 2: Deploy Client to Vercel

#### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

#### 2. Import Project
- Dashboard → "Add New..." → "Project"
- Import `kuldeep921997/WebRTC`
- Configure:
  ```
  Framework Preset: Vite
  Root Directory: client
  Build Command: npm run build
  Output Directory: dist
  Install Command: npm install
  ```

#### 3. Add Environment Variable
- Settings → Environment Variables
- Add:
  ```
  VITE_SIGNALING_SERVER=https://your-render-server-url.onrender.com
  ```

#### 4. Deploy
- Click "Deploy"
- Wait 1-2 minutes
- Your app will be live at: `https://your-app.vercel.app`

#### 5. Update Client Code (Important!)
Update `client/src/App.jsx`:
```javascript
// Change this line:
const SIGNALING_SERVER = 'http://localhost:5000';

// To:
const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:5000';
```

---

## 🔑 GitHub Secrets Configuration

For CI/CD automation, add these secrets to your GitHub repository:

### Go to: Repository → Settings → Secrets and variables → Actions

#### Required Secrets:

**For Vercel Deployment:**
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
SIGNALING_SERVER_URL=https://your-render-server.onrender.com
```

**For Render Deployment:**
```
RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
SERVER_URL=https://your-server.onrender.com
```

**How to get these:**

1. **Vercel Token**:
   - Vercel Dashboard → Settings → Tokens
   - Create new token
   - Copy and add to GitHub secrets

2. **Vercel Org/Project IDs**:
   - Go to your project settings
   - Copy from project settings page

3. **Render Deploy Hook**:
   - Render Dashboard → Your service → Settings
   - Deploy Hooks section
   - Create hook and copy URL

---

## 🔄 CI/CD Pipeline Workflow

Once configured, your pipeline works automatically:

### On Push to `main`:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   ```
   ✅ Test server
   ✅ Test client build
   ✅ Code quality checks
   ✅ Security audit
   ```

2. **Deploy Server** (`.github/workflows/deploy-server.yml`):
   ```
   ✅ Trigger Render deployment
   ✅ Wait for deployment
   ✅ Health check
   ```

3. **Deploy Client** (`.github/workflows/deploy-client.yml`):
   ```
   ✅ Build client with env vars
   ✅ Deploy to Vercel
   ✅ Verify deployment
   ```

### Manual Deployment:
- Go to Actions tab
- Select workflow
- Click "Run workflow"

---

## 🧪 Testing Deployment

### 1. Test Server
```bash
# Health check
curl https://your-server.onrender.com/health

# Rooms endpoint
curl https://your-server.onrender.com/rooms
```

### 2. Test Client
- Open: `https://your-app.vercel.app`
- Create room in one tab
- Join room in another tab
- Test video call

### 3. Test WebSocket Connection
- Open browser console
- Should see: `✅ Connected to signaling server`
- If not, check CORS settings in server

---

## 🐛 Troubleshooting

### Issue: Client can't connect to server

**Solution 1: Update CORS in server**
```javascript
// server/index.js
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://your-app.vercel.app'  // Add your Vercel URL
    ],
    methods: ['GET', 'POST']
  }
});
```

**Solution 2: Check environment variable**
- Verify `VITE_SIGNALING_SERVER` is set correctly in Vercel

### Issue: Server sleeping (Render free tier)

**Problem**: Free tier servers sleep after 15 minutes of inactivity

**Solutions**:
1. Use cron-job.org to ping health endpoint every 10 minutes
2. Upgrade to paid plan ($7/month)
3. Use Railway instead (better free tier)

### Issue: Build fails on Render

**Check**:
```bash
# Verify package.json exists in server/
ls server/package.json

# Verify start command
cat server/package.json | grep '"start"'
```

### Issue: Vercel build fails

**Check environment variables**:
- Go to Vercel → Settings → Environment Variables
- Verify `VITE_SIGNALING_SERVER` is set
- Redeploy

---

## 🔒 Security Checklist

Before going live:

- [ ] Update CORS origins to specific domains
- [ ] Add rate limiting to signaling server
- [ ] Enable HTTPS only (both platforms provide this)
- [ ] Add authentication for rooms
- [ ] Configure TURN server for production
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add error tracking
- [ ] Configure proper logging

---

## 📊 Monitoring

### Render Monitoring:
- Dashboard → Your service → Metrics
- View logs, CPU, memory usage

### Vercel Monitoring:
- Dashboard → Your project → Analytics
- View page views, performance

### Set up external monitoring:
- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay

---

## 💰 Cost Estimate

### Free Tier (Development):
- Render: Free (with sleep)
- Vercel: Free (100GB bandwidth)
- **Total**: $0/month

### Paid Tier (Production):
- Render Starter: $7/month
- Vercel Pro: $20/month (optional)
- TURN Server: $5-10/month
- **Total**: ~$12-37/month

---

## 🚀 Advanced: Custom Domain

### For Vercel (Client):
1. Vercel Dashboard → Domains
2. Add your domain
3. Update DNS records as instructed

### For Render (Server):
1. Render Dashboard → Custom Domain
2. Add domain
3. Update DNS CNAME record

---

## 📝 Post-Deployment Checklist

- [ ] Server deployed and healthy
- [ ] Client deployed and accessible
- [ ] WebSocket connection working
- [ ] Video call tested between two users
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] GitHub Actions working
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🆘 Support

If you encounter issues:

1. Check GitHub Actions logs
2. Check Render/Vercel logs
3. Test locally first
4. Review CORS settings
5. Verify environment variables

---

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [WebRTC Deployment Guide](https://webrtc.org/getting-started/overview)

---

**Deployment Status**: Ready to deploy! 🚀

Follow the steps above to get your WebRTC app live in production.
