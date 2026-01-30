# Deployment Guide

This guide will help you deploy the Negotiation Simulator to share with colleagues.

## Option 1: Railway + Vercel (Recommended - Free)

### Prerequisites
- GitHub account (or GitLab/Bitbucket)
- Railway account (sign up at https://railway.app)
- Vercel account (sign up at https://vercel.com)

### Step 1: Push to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/negotiation-simulator.git
git push -u origin main
```

### Step 2: Deploy Backend to Railway

1. **Go to Railway** → https://railway.app
2. **Click "New Project"** → Select "Deploy from GitHub repo"
3. **Select your repository**
4. **Click "Add variables"** and add these environment variables:
   ```
   DATABASE_URL=(Railway will auto-generate when you add PostgreSQL)
   JWT_SECRET=(generate a random string - use: openssl rand -hex 32)
   CLAUDE_API_KEY=sk-ant-api03-... (your Claude API key)
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=(leave blank for now, update after deploying frontend)
   ```

5. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets DATABASE_URL

6. **Configure Build Settings**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`

7. **Generate Domain**:
   - Go to Settings → Generate Domain
   - Copy your backend URL (e.g., `https://your-app.up.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Go to Vercel** → https://vercel.com
2. **Click "New Project"** → Import your GitHub repository
3. **Configure Project**:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-app.up.railway.app/api` (your Railway backend URL)

5. **Deploy** → Vercel will build and deploy your app

6. **Copy Frontend URL** (e.g., `https://your-app.vercel.app`)

### Step 4: Update Backend CORS

1. Go back to **Railway**
2. Update `FRONTEND_URL` environment variable to your Vercel URL
3. Redeploy if needed (Railway auto-redeploys on env changes)

### Step 5: Seed the Database (Optional)

To add demo data, connect to your Railway backend:

1. In Railway, go to PostgreSQL → Connect
2. Copy the connection string
3. Run locally:
   ```bash
   cd backend
   DATABASE_URL="your-railway-db-url" npm run prisma:seed
   ```

### Done! 🎉

Your app is now live at your Vercel URL. Share it with colleagues!

**Test Accounts** (if you seeded):
- Instructor: `instructor` / `password123`
- Student: `student1` / `password123`

---

## Option 2: All-in-One with Render (Free but slower)

Render has a free tier but it "spins down" after 15 minutes of inactivity (first request takes ~30 seconds to wake up).

### Deploy to Render

1. **Go to Render** → https://render.com
2. **Create PostgreSQL Database**:
   - New → PostgreSQL → Free tier
   - Copy the "Internal Database URL"

3. **Deploy Backend**:
   - New → Web Service → Connect repository
   - Name: `negotiation-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Environment Variables:
     ```
     DATABASE_URL=(paste your Render DB URL)
     JWT_SECRET=(random string)
     CLAUDE_API_KEY=(your key)
     NODE_ENV=production
     FRONTEND_URL=(update after frontend deploys)
     ```

4. **Deploy Frontend**:
   - New → Static Site → Connect repository
   - Name: `negotiation-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://negotiation-backend.onrender.com/api
     ```

5. **Update Backend CORS**:
   - Update `FRONTEND_URL` to your frontend URL

---

## Option 3: Railway All-in-One

Deploy both frontend and backend to Railway:

1. Deploy backend as described in Option 1
2. For frontend:
   - Add another service from the same repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build && npm install -g serve`
   - Start Command: `serve -s dist -l $PORT`
   - Add `VITE_API_URL` environment variable

---

## Cost Breakdown

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **Railway** | $5 credit/month (~500 hours) | Backend + DB |
| **Vercel** | Unlimited personal projects | Frontend |
| **Render** | 750 hours/month (sleeps) | All-in-one |

**Recommendation**: Railway + Vercel for best performance and no sleep time.

---

## Troubleshooting

**CORS Errors**: Make sure `FRONTEND_URL` in backend matches your actual frontend URL

**Database Not Connected**: Check `DATABASE_URL` is set correctly

**API Calls Failing**: Verify `VITE_API_URL` in frontend includes `/api` at the end

**Build Fails**: Check that root directory is set correctly (backend or frontend)

---

## Security Notes

- Never commit `.env` files
- Keep your `CLAUDE_API_KEY` secret
- Use strong `JWT_SECRET` (32+ random characters)
- Consider adding rate limiting for production use
