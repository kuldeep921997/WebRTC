# PowerShell Deployment script for WebRTC MERN App
# Windows version of deploy.sh

Write-Host "🚀 WebRTC MERN App - Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git repository not initialized" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor Yellow
    exit 1
}

# Check for uncommitted changes
$changes = git status --porcelain
if ($changes) {
    Write-Host "📝 You have uncommitted changes" -ForegroundColor Yellow
    Write-Host ""
    $commitMessage = Read-Host "Commit message"
    
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git add .
    git commit -m $commitMessage
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Check remote
try {
    git remote get-url origin | Out-Null
} catch {
    Write-Host "❌ No remote 'origin' configured" -ForegroundColor Red
    Write-Host "Run: git remote add origin git@github.com:kuldeep921997/WebRTC.git" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 GitHub Actions will now:" -ForegroundColor Cyan
    Write-Host "   1. Run tests (CI pipeline)" -ForegroundColor White
    Write-Host "   2. Deploy server to Render" -ForegroundColor White
    Write-Host "   3. Deploy client to Vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Check status at: https://github.com/kuldeep921997/WebRTC/actions" -ForegroundColor Yellow
} else {
    Write-Host "❌ Push failed. Check your git configuration." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
Write-Host "⏳ Wait 3-5 minutes for deployment to complete" -ForegroundColor Yellow
