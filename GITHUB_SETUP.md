# GitHub Repository Setup Guide

Complete guide for setting up your WebRTC project on GitHub with CI/CD.

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Git installed locally
- ✅ SSH key configured (or use HTTPS)
- ✅ Repository created: `kuldeep921997/WebRTC`

## 🚀 Initial Setup

### Step 1: Initialize Git (if not done)

```bash
cd "C:\Users\kuldeep.lodhi\OneDrive - Reliance Corporate IT Park Limited\Desktop\WebRTC"

# Initialize git
git init

# Create .gitignore (already done)
# Verify it exists
cat .gitignore
```

### Step 2: Connect to GitHub Repository

```bash
# Add remote
git remote add origin git@github.com:kuldeep921997/WebRTC.git

# Verify remote
git remote -v
```

Expected output:
```
origin  git@github.com:kuldeep921997/WebRTC.git (fetch)
origin  git@github.com:kuldeep921997/WebRTC.git (push)
```

### Step 3: Create .gitignore (Already Done ✅)

Your `.gitignore` already includes:
```gitignore
node_modules/
.env
.DS_Store
dist/
build/
*.log
.vscode/
.idea/
```

### Step 4: Initial Commit

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete WebRTC MERN app with CI/CD"

# Create main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If you get an error about existing content:
```bash
# Pull first, then push
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 🔧 Configure GitHub Secrets

For CI/CD to work, add these secrets to your GitHub repository.

### Navigate to Secrets:
1. Go to: https://github.com/kuldeep921997/WebRTC
2. Click: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret**

### Required Secrets:

#### 1. For Render Deployment (Server)

**RENDER_DEPLOY_HOOK**:
- Value: Get from Render dashboard after creating service
- Format: `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`
- Steps to get:
  1. Deploy server to Render first (manual)
  2. Go to service → Settings → Deploy Hooks
  3. Create hook, copy URL

**SERVER_URL**:
- Value: Your Render server URL
- Format: `https://webrtc-signaling-server-xxxx.onrender.com`

#### 2. For Vercel Deployment (Client)

**VERCEL_TOKEN**:
- Get from: https://vercel.com/account/tokens
- Click "Create Token"
- Name: `GitHub Actions`
- Copy token

**VERCEL_ORG_ID**:
- Get from Vercel project settings
- Format: `team_xxxxxxxx` or `prj_xxxxxxxx`

**VERCEL_PROJECT_ID**:
- Get from Vercel project settings
- Format: `prj_xxxxxxxx`

**SIGNALING_SERVER_URL**:
- Value: Your Render server URL
- Format: `https://webrtc-signaling-server-xxxx.onrender.com`

### Optional Secrets (For Alternative Deployments):

**NETLIFY_AUTH_TOKEN** (if using Netlify):
- Get from: https://app.netlify.com/user/applications

**NETLIFY_SITE_ID** (if using Netlify):
- Get from site settings

**HEROKU_API_KEY** (if using Heroku):
- Get from: https://dashboard.heroku.com/account

**HEROKU_APP_NAME**:
- Your Heroku app name

**HEROKU_EMAIL**:
- Your Heroku email

## 🔄 Enable GitHub Actions

### Step 1: Verify Workflows

Check that these files exist:
```bash
ls .github/workflows/
```

Should show:
- `ci.yml` - Continuous Integration
- `deploy-server.yml` - Server deployment
- `deploy-client.yml` - Client deployment

### Step 2: Enable Actions

1. Go to: https://github.com/kuldeep921997/WebRTC/actions
2. If prompted, click "I understand my workflows, go ahead and enable them"

### Step 3: Test CI Pipeline

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI pipeline"
git push origin main
```

### Step 4: Check Pipeline Status

1. Go to: https://github.com/kuldeep921997/WebRTC/actions
2. You should see workflow running
3. Click on it to see progress

## 📊 Deployment Workflow

### Automatic Deployment (After Setup):

```bash
# 1. Make changes to your code
# Edit files...

# 2. Commit changes
git add .
git commit -m "Feature: Add new functionality"

# 3. Push to GitHub
git push origin main

# 4. CI/CD automatically:
#    ✅ Runs tests
#    ✅ Builds client
#    ✅ Deploys server to Render
#    ✅ Deploys client to Vercel
```

### Manual Deployment Trigger:

1. Go to: https://github.com/kuldeep921997/WebRTC/actions
2. Select workflow (e.g., "Deploy Client to Vercel")
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

## 🔍 Monitoring Deployments

### Check CI Status:
```
https://github.com/kuldeep921997/WebRTC/actions
```

### Check Server Deployment:
```bash
# Health check
curl https://your-server.onrender.com/health
```

### Check Client Deployment:
```
https://your-app.vercel.app
```

## 🐛 Troubleshooting

### Issue: Workflows not running

**Solution**:
1. Check if Actions are enabled
2. Verify workflow files are in `.github/workflows/`
3. Check YAML syntax (no tabs, proper indentation)

### Issue: Build fails

**Check**:
```bash
# Locally test builds
cd server && npm install && npm test
cd ../client && npm install && npm run build
```

### Issue: Secrets not working

**Verify**:
1. Secret names match exactly (case-sensitive)
2. No extra spaces in secret values
3. Secrets are set in correct repository

### Issue: Permission denied on push

**Solution**:
```bash
# If using SSH, verify key
ssh -T git@github.com

# Or switch to HTTPS
git remote set-url origin https://github.com/kuldeep921997/WebRTC.git
```

## 📝 Branch Strategy (Optional)

### For team development:

```bash
# Create development branch
git checkout -b develop
git push origin develop

# Create feature branch
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature

# Create pull request on GitHub
# After merge, deploy happens automatically
```

### Branch Protection (Recommended):

1. Go to: Settings → Branches
2. Add rule for `main`
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks (CI) to pass
   - ✅ Require branches to be up to date

## 🎯 Quick Reference Commands

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main

# Pull latest
git pull origin main

# Create branch
git checkout -b branch-name

# Switch branch
git checkout main

# View remotes
git remote -v

# View logs
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

## 🚀 Deployment Scripts

### Windows (PowerShell):
```powershell
# Run deployment script
.\deploy.ps1

# Or manually:
git add .
git commit -m "Update"
git push origin main
```

### Linux/Mac (Bash):
```bash
# Make executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Or manually:
git add .
git commit -m "Update"
git push origin main
```

## ✅ Setup Complete Checklist

- [ ] Git initialized
- [ ] Remote added (origin)
- [ ] Initial commit pushed
- [ ] GitHub Actions enabled
- [ ] Secrets configured (Render + Vercel)
- [ ] CI pipeline tested
- [ ] Server deployed to Render
- [ ] Client deployed to Vercel
- [ ] Automatic deployments working

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Documentation](https://git-scm.com/doc)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Status**: Repository setup complete! 🎉

Your WebRTC app is now connected to GitHub with full CI/CD pipeline.
