#!/bin/bash

# Deployment script for WebRTC MERN App
# This script helps push code to GitHub and trigger deployments

echo "🚀 WebRTC MERN App - Deployment Script"
echo "========================================"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 You have uncommitted changes"
    echo ""
    read -p "Commit message: " commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git add .
    git commit -m "$commit_message"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Check remote
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote 'origin' configured"
    echo "Run: git remote add origin git@github.com:kuldeep921997/WebRTC.git"
    exit 1
fi

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🔄 GitHub Actions will now:"
    echo "   1. Run tests (CI pipeline)"
    echo "   2. Deploy server to Render"
    echo "   3. Deploy client to Vercel"
    echo ""
    echo "📊 Check status at: https://github.com/kuldeep921997/WebRTC/actions"
else
    echo "❌ Push failed. Check your git configuration."
    exit 1
fi

echo ""
echo "🎉 Deployment initiated!"
echo "⏳ Wait 3-5 minutes for deployment to complete"
