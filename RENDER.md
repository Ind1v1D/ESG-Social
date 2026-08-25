# Deploy to Render

## Prerequisites
- GitHub account
- Render account (https://dashboard.render.com)

## Steps

### 1. Push to GitHub
```bash
cd C:\Users\user\Documents\esg
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Connect to Render
1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect your GitHub repo: `Ind1v1D/ESG-Social`
4. Render reads `render.yaml` and provisions both services

### 3. Set Environment Variables
In the Render dashboard, go to **esg-backend** → **Environment**:

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | Choose a strong password |
| `ALLOWED_ORIGINS` | `https://esg-frontend.onrender.com` |

`SECRET_KEY` is auto-generated. `ADMIN_USER` defaults to `admin`.

### 4. Wait for Build
- Backend: ~2-3 minutes (Python deps + startup)
- Frontend: ~1-2 minutes (npm install + build)

### 5. Access Your App

| Service | URL |
|---------|-----|
| **Frontend** | `https://esg-frontend.onrender.com` |
| **Backend API** | `https://esg-backend.onrender.com` |
| **API Docs** | Disabled in production (set DEBUG=true to enable) |

### 6. Update Frontend API URL
After the backend deploys, copy its URL and set it in the frontend:

1. Go to **esg-frontend** → **Environment**
2. Add: `VITE_API_URL` = `https://esg-backend.onrender.com`
3. Trigger a redeploy

## Free Tier Notes
- Services spin down after 15 minutes of no traffic
- First request after idle takes ~30 seconds to wake up
- 512 MB RAM per service
- 100 GB bandwidth/month

## Troubleshooting
- **CORS errors**: Ensure `ALLOWED_ORIGINS` matches the frontend URL exactly
- **Database errors**: The disk mount must be at `/app/data`
- **Build fails**: Check build logs in Render dashboard
