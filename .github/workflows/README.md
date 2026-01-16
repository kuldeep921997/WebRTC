# GitHub Actions Workflows

This directory contains CI/CD workflows for the WebRTC MERN application.

## 📋 Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers**: Push/PR to main or develop branches
**Purpose**: Run automated tests and quality checks

**Jobs** (with dependencies):
```
test-server ────┐
                ├──► code-quality ──┐
test-client ────┤                   ├──► integration-test ──► build-summary
                ├──► security-audit ┘
                └──► (runs in parallel)
```

**What it does**:
- ✅ Tests server (health checks, signaling)
- ✅ Tests client (build verification)
- ✅ Code quality checks (after tests pass)
- ✅ Security audit (after tests pass)
- ✅ Integration test (after all checks pass)
- ✅ Build summary (final status)

### 2. `deploy-server.yml` - Server Deployment
**Triggers**: Push to main (server changes only)
**Purpose**: Deploy server to Render (or alternatives)

**Jobs** (with dependencies):
```
deploy-render ──► health-check
```

**Requirements**:
- `RENDER_DEPLOY_HOOK` secret must be set
- `SERVER_URL` secret must be set

**What it does**:
- ✅ Checks if secrets are configured
- ✅ Triggers Render deployment via webhook
- ✅ Waits for deployment to complete
- ✅ Runs health check against deployed server
- ❌ Fails if secrets missing (with helpful message)

### 3. `deploy-client.yml` - Client Deployment
**Triggers**: Push to main (client changes only)
**Purpose**: Deploy client to Vercel (or alternatives)

**Jobs** (with dependencies):
```
build-client ──► deploy-vercel
```

**Requirements**:
- `VERCEL_TOKEN` secret must be set
- `VERCEL_ORG_ID` secret must be set
- `VERCEL_PROJECT_ID` secret must be set
- `SIGNALING_SERVER_URL` secret should be set

**What it does**:
- ✅ Builds client first (validates build works)
- ✅ Checks if secrets are configured
- ✅ Deploys to Vercel (only if build succeeds)
- ❌ Fails if secrets missing (with helpful message)

## 🔧 Configuration

### Required Secrets

Add these in: **Repository → Settings → Secrets and variables → Actions**

#### For Render (Server):
```
RENDER_DEPLOY_HOOK = https://api.render.com/deploy/srv-xxxxx?key=xxxxx
SERVER_URL = https://your-server.onrender.com
```

#### For Vercel (Client):
```
VERCEL_TOKEN = (from vercel.com/account/tokens)
VERCEL_ORG_ID = (from project settings)
VERCEL_PROJECT_ID = (from project settings)
SIGNALING_SERVER_URL = https://your-server.onrender.com
```

### Optional Secrets (for alternative platforms):
- `RAILWAY_TOKEN` - For Railway deployment
- `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL` - For Heroku
- `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` - For Netlify
- `DIGITALOCEAN_ACCESS_TOKEN`, `DIGITALOCEAN_APP_ID` - For DigitalOcean

## 🚦 Workflow Logic

### Job Dependencies (needs:)

Jobs will **STOP** if a dependency fails:

```yaml
job-b:
  needs: [job-a]  # job-b only runs if job-a succeeds
```

### Conditional Execution (if:)

Jobs can be skipped based on conditions:

```yaml
job-c:
  if: ${{ secrets.MY_SECRET != '' }}  # Only run if secret is set
```

```yaml
job-d:
  if: false  # Disabled (never runs)
```

### Example Flow:

1. **CI Workflow** (on every push):
   ```
   test-server PASS ──┐
   test-client PASS ──┼──► code-quality PASS ──► integration-test PASS ──► build-summary
                      └──► security-audit PASS ──┘
   
   If test-server FAILS → code-quality SKIPPED → integration-test SKIPPED
   ```

2. **Deploy Server** (if server/ changed):
   ```
   Secrets configured? YES ──► deploy-render PASS ──► health-check PASS ✅
   
   Secrets configured? NO ──► deploy-render SKIPPED ⚠️ (helpful message in logs)
   ```

3. **Deploy Client** (if client/ changed):
   ```
   build-client PASS ──► Secrets configured? YES ──► deploy-vercel PASS ✅
   
   build-client FAIL ──► deploy-vercel SKIPPED ❌
   ```

## 🔍 Debugging Failed Workflows

### 1. View Logs
- Go to **Actions** tab
- Click on failed workflow run
- Click on failed job
- Expand failed step
- Read error message

### 2. Common Issues

#### "curl: (2) no URL specified"
**Cause**: Secret is not set or is empty
**Solution**: Configure the required secret in repository settings

#### "npm ci" fails
**Cause**: package-lock.json doesn't match package.json
**Solution**: Run `npm install` locally and commit package-lock.json

#### "Build failed"
**Cause**: Build errors in code
**Solution**: Test build locally first: `npm run build`

#### Health check fails
**Cause**: Server not ready or URL wrong
**Solution**: 
- Verify `SERVER_URL` secret is correct
- Check Render logs for server errors
- Server might need more time to start (increase sleep)

### 3. Test Locally

Before pushing, test locally:

```bash
# Test server
cd server
npm install
npm test
node index.js  # Should start without errors

# Test client
cd ../client
npm install
npm run build  # Should build successfully
```

## 📊 Workflow Status

### Viewing Status:
- **GitHub Badge**: Shows on README (coming soon)
- **Actions Tab**: https://github.com/kuldeep921997/WebRTC/actions
- **Commit History**: Green ✅ or red ❌ next to each commit

### Status Indicators:
- ✅ **Success**: All jobs passed
- ❌ **Failure**: At least one job failed
- ⚠️ **Skipped**: Job was skipped (conditional or dependency failed)
- 🔵 **In Progress**: Currently running

## 🎯 Best Practices

### 1. Always Run CI First
- CI runs on all pushes
- Deployments only run if:
  - Changes affect that component (server/ or client/)
  - Secrets are configured
  - CI passes (for integration test)

### 2. Test Locally Before Pushing
```bash
# Quick test
npm run dev  # Start both server and client

# Full test (like CI)
cd server && npm install && npm test
cd ../client && npm install && npm run build
```

### 3. Set Up Secrets Before First Push
- Configure secrets first
- Then push code
- Deployments will work automatically

### 4. Monitor Your Workflows
- Check Actions tab after push
- Fix issues promptly
- Don't ignore failed workflows

## 🔄 Updating Workflows

### To enable alternative deployments:

1. **Enable Railway deployment**:
   ```yaml
   # In deploy-server.yml
   deploy-railway:
     if: true  # Change from false to true
   ```

2. **Enable Netlify deployment**:
   ```yaml
   # In deploy-client.yml
   deploy-netlify:
     if: true  # Change from false to true
   ```

3. **Add required secrets** for the platform

### To disable deployments temporarily:

```yaml
# In deploy-server.yml or deploy-client.yml
jobs:
  deploy-render:
    if: false  # Add this line
```

Or delete the workflow file to disable completely.

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Secrets Configuration](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: January 16, 2026
