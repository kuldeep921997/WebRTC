# 🚀 Next Steps - Deploy Your WebRTC App

## ✅ What's Ready

All CI/CD files are created and ready to deploy:
- ✅ 3 GitHub Actions workflows (CI, deploy-server, deploy-client)
- ✅ Deployment configurations (Render, Vercel, Netlify)
- ✅ Deployment scripts (Windows & Linux)
- ✅ Complete documentation
- ✅ GitHub templates (PR, Issues)

---

## 🎯 Step-by-Step Guide (15 minutes)

### Step 1: Push to GitHub (2 minutes)

```powershell
# Open PowerShell in project directory
cd "C:\Users\kuldeep.lodhi\OneDrive - Reliance Corporate IT Park Limited\Desktop\WebRTC"

# Initialize git (if not done)
git init
git branch -M main

# Add remote (your repo is already created)
git remote add origin git@github.com:kuldeep921997/WebRTC.git

# Verify remote
git remote -v

# Add all files
git add .

# Commit
git commit -m "Initial commit: WebRTC MERN app with complete CI/CD pipeline

- Complete WebRTC implementation (8 steps)
- Server with Socket.IO signaling
- Client with React + Vite
- GitHub Actions CI/CD pipelines
- Deployment configs for Render + Vercel
- Comprehensive documentation"

# Push to GitHub
git push -u origin main
```

**If push fails** (remote has existing content):
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Step 2: Verify on GitHub (1 minute)

1. Go to: https://github.com/kuldeep921997/WebRTC
2. Verify all files are there
3. Check `.github/workflows/` folder exists
4. Go to **Actions** tab → Should see 3 workflows

### Step 3: Deploy Server to Render (5 minutes)

#### 3.1 Create Render Account
- Go to: https://render.com
- Click "Get Started"
- Sign up with GitHub

#### 3.2 Create Web Service
- Dashboard → "New +" → "Web Service"
- Click "Connect GitHub"
- Select repository: `kuldeep921997/WebRTC`
- Click "Connect"

#### 3.3 Configure Service
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

#### 3.4 Add Environment Variables
- Scroll to "Environment Variables"
- Add:
  ```
  NODE_ENV = production
  ```

#### 3.5 Create Web Service
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- **COPY YOUR URL**: `https://webrtc-signaling-server-xxxx.onrender.com`

#### 3.6 Verify Deployment
Test in browser or PowerShell:
```powershell
curl https://your-server-url.onrender.com/health
```

Expected response:
```json
{"status":"ok","roomCount":0,"timestamp":"..."}
```

#### 3.7 Get Deploy Hook
- Go to service → Settings → Deploy Hooks
- Create deploy hook
- **COPY THE URL** (needed for GitHub Actions)

### Step 4: Deploy Client to Vercel (5 minutes)

#### 4.1 Create Vercel Account
- Go to: https://vercel.com
- Click "Sign Up"
- Sign up with GitHub

#### 4.2 Import Project
- Dashboard → "Add New..." → "Project"
- Import Git Repository
- Search: `kuldeep921997/WebRTC`
- Click "Import"

#### 4.3 Configure Build
```
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4.4 Add Environment Variable
- Before clicking "Deploy", scroll to "Environment Variables"
- Add:
  ```
  Name: VITE_SIGNALING_SERVER
  Value: https://your-render-server-url.onrender.com
  ```
  ⚠️ **Replace with YOUR Render URL from Step 3**

#### 4.5 Deploy
- Click "Deploy"
- Wait 1-2 minutes
- **COPY YOUR URL**: `https://your-app-xxxx.vercel.app`

#### 4.6 Verify Deployment
- Open your Vercel URL in browser
- Should see WebRTC app
- Try creating a room (may not connect yet - need to update CORS)

### Step 5: Configure GitHub Secrets (2 minutes)

#### 5.1 Navigate to Secrets
- Go to: https://github.com/kuldeep921997/WebRTC
- Click: **Settings** → **Secrets and variables** → **Actions**

#### 5.2 Add Render Secrets
Click "New repository secret" for each:

```
Name: RENDER_DEPLOY_HOOK
Value: (paste deploy hook URL from Step 3.7)

Name: SERVER_URL
Value: https://your-render-server-url.onrender.com
```

#### 5.3 Add Vercel Secrets

**Get Vercel Token**:
- Go to: https://vercel.com/account/tokens
- Create token: Name it "GitHub Actions"
- **Copy token** (shows only once!)

**Get Vercel IDs**:
- Go to your project → Settings
- Scroll to "Project ID" - **Copy**
- Scroll to "Team ID" or check URL - **Copy**

Add to GitHub:
```
Name: VERCEL_TOKEN
Value: (paste token)

Name: VERCEL_ORG_ID
Value: (paste team/org ID)

Name: VERCEL_PROJECT_ID
Value: (paste project ID)

Name: SIGNALING_SERVER_URL
Value: https://your-render-server-url.onrender.com
```

### Step 6: Update Server CORS (Important!) (1 minute)

Your server needs to allow your Vercel domain.

**Edit** `server/index.js` around line 25:

```javascript
// OLD:
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to specific origins
    methods: ['GET', 'POST']
  }
});

// NEW:
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://your-app-xxxx.vercel.app'  // Add your Vercel URL
    ],
    methods: ['GET', 'POST']
  }
});
```

**Commit and push**:
```powershell
git add server/index.js
git commit -m "Update CORS for production"
git push origin main
```

This will trigger:
- ✅ CI pipeline (tests)
- ✅ Server redeployment (with new CORS)
- ✅ Client redeployment

---

## 🧪 Test Your Deployment

### Test 1: Server Health
```powershell
curl https://your-render-server-url.onrender.com/health
```

### Test 2: Client Access
- Open: `https://your-app-xxxx.vercel.app`
- Should load without errors

### Test 3: WebRTC Calling
1. Open your Vercel URL in two browser tabs
2. **Tab 1**: 
   - Enter room ID: `test123`
   - Click "Create Room"
   - Click "Start Video Call"
   - Allow camera/microphone
3. **Tab 2**:
   - Enter room ID: `test123`
   - Click "Join Room"
   - Click "Start Video Call"
   - Allow camera/microphone
4. **Verify**: You see each other's video! 🎉

### Test 4: CI/CD Pipeline
```powershell
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main

# Check GitHub Actions
# Go to: https://github.com/kuldeep921997/WebRTC/actions
# All checks should be green ✅
```

---

## 📊 What Happens on Every Push

```
git push origin main
      │
      ▼
GitHub Actions triggers:
      │
      ├─► CI Pipeline
      │   ├─ Test server
      │   ├─ Test client build
      │   ├─ Code quality
      │   └─ Security audit
      │
      ├─► Deploy Server (if server/ changed)
      │   ├─ Trigger Render deployment
      │   └─ Health check
      │
      └─► Deploy Client (if client/ changed)
          ├─ Build with env vars
          ├─ Deploy to Vercel
          └─ Verify deployment
      
      ✅ Production updated!
```

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Server deployed to Render (health check passes)
- [ ] Client deployed to Vercel (loads in browser)
- [ ] GitHub secrets configured
- [ ] CORS updated for production
- [ ] CI/CD pipeline working (Actions tab shows green)
- [ ] Video call tested between two tabs
- [ ] No console errors

---

## 🐛 Common Issues & Solutions

### Issue: "Could not connect to signaling server"

**Solution**: Check CORS in `server/index.js`
```javascript
origin: [
  'http://localhost:3000',
  'https://your-actual-vercel-url.vercel.app'  // ← Must match exactly
]
```

### Issue: Render server sleeps (Free tier)

**Problem**: Free tier servers sleep after 15 minutes of inactivity

**Solutions**:
1. **Quick fix**: Use https://cron-job.org to ping `/health` every 10 minutes
2. **Upgrade**: Render Starter plan ($7/month) - no sleep
3. **Alternative**: Use Railway (better free tier)

### Issue: Build fails on GitHub Actions

**Check**:
```powershell
# Test builds locally
cd server
npm install
npm test

cd ../client
npm install
npm run build
```

### Issue: Vercel deployment fails

**Check**:
1. Verify `VITE_SIGNALING_SERVER` is set in Vercel
2. Try manual redeploy: Vercel Dashboard → Deployments → Redeploy
3. Check Vercel logs for errors

---

## 💰 Costs

### Free Tier (Current Setup):
- **Render**: Free (with sleep after 15min)
- **Vercel**: Free (100GB bandwidth/month)
- **GitHub Actions**: Free (2,000 minutes/month)
- **Total**: $0/month

### If You Need Always-On:
- **Render Starter**: $7/month (no sleep)
- **Vercel Pro**: $20/month (optional, only if needed)
- **Total**: ~$7-27/month

---

## 📚 Important Links

**Your Deployment**:
- GitHub Repo: https://github.com/kuldeep921997/WebRTC
- GitHub Actions: https://github.com/kuldeep921997/WebRTC/actions
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard

**Documentation**:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub configuration
- [CI_CD_SUMMARY.md](CI_CD_SUMMARY.md) - CI/CD overview
- [README.md](README.md) - Main documentation

**Helpful Resources**:
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/en/actions

---

## 🚀 Quick Deploy Commands

**Windows (PowerShell)**:
```powershell
# Quick deploy
.\deploy.ps1

# Or manual:
git add .
git commit -m "Your message"
git push origin main
```

**Linux/Mac (Bash)**:
```bash
# Quick deploy
./deploy.sh

# Or manual:
git add .
git commit -m "Your message"
git push origin main
```

---

## 🔮 What's Next?

After successful deployment:

1. **Custom Domain** (Optional):
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domain

2. **Monitoring**:
   - Set up https://uptimerobot.com (free)
   - Add Sentry for error tracking

3. **Enhance**:
   - Add user authentication
   - Implement room passwords
   - Add MongoDB for persistence
   - Set up TURN server

4. **Scale**:
   - Upgrade plans if needed
   - Add Redis for room management
   - Implement SFU for multi-party calls

---

## ✅ You're Done When...

✅ Your app is live at `https://your-app.vercel.app`  
✅ Server is healthy at `https://your-server.onrender.com/health`  
✅ Video calls work between two users  
✅ CI/CD pipeline shows green on GitHub  
✅ You can deploy with one command (`git push`)  

---

## 🆘 Need Help?

1. Check documentation files
2. Review GitHub Actions logs
3. Check Render/Vercel logs
4. Test locally first
5. Verify environment variables

---

**Status**: Ready to deploy! 🚀

**Estimated Time**: 15 minutes for complete setup

**Follow the steps above** and you'll have a production-ready WebRTC app with automated CI/CD!

---

**Last Updated**: January 16, 2026
