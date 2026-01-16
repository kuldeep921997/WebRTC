# Local Deployment with Public URL (using ngrok)

## Quick Option for Testing

If you want a public URL quickly for testing/demo purposes:

### Step 1: Install ngrok
```bash
# Download from: https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

### Step 2: Start Your App Locally
```bash
# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Start client
cd client
npm run dev
```

### Step 3: Expose Client to Internet
```bash
# Terminal 3 - Create public URL
ngrok http 3000
```

You'll get a public URL like:
```
https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app
```

### Step 4: Expose Server to Internet
```bash
# Terminal 4 - Create public URL for server
ngrok http 5000
```

You'll get another URL like:
```
https://yyyy-yy-yyy-yyy-yyy.ngrok-free.app
```

### Step 5: Update Client to Use Public Server
Edit `client/.env.local`:
```
VITE_SIGNALING_SERVER=https://yyyy-yy-yyy-yyy-yyy.ngrok-free.app
```

Restart client and share your public client URL!

**Note**: ngrok URLs are temporary and free tier has limitations.
