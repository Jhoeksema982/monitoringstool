# Deploying to Vercel

## Overview

This app is built with:

- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: Express.js API (deployed to Vercel as serverless functions)
- **Database**: Supabase (hosted)
- **Auth**: Supabase Authentication

## Step-by-Step Deployment

### 1. Prepare Your Repository

- Push all changes to your GitHub repository
- Make sure `.env` is in `.gitignore` (never commit secrets)

### 2. Create a Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your `monitoringstool` repository
5. Click "Import"

### 3. Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

**Production Variables:**

```
NODE_ENV=production
VITE_API_BASE_URL=https://your-vercel-project.vercel.app/api
VITE_SUPABASE_URL=https://umlsadvlxhrlushowmef.supabase.co
VITE_SUPABASE_ANON_KEY=<eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbHNhZHZseGhybHVzaG93bWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkxOTQsImV4cCI6MjA3NzI2NTE5NH0.QVFZYjY240QBwtrK6gXf7WVfTX4DfyUhB9P0XzlLjmw>
VITE_ADMIN_EMAILS=admin@jouwbedrijf.nl
SUPABASE_URL=https://umlsadvlxhrlushowmef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ADMIN_EMAILS=admin@jouwbedrijf.nl
CORS_ORIGIN=https://your-vercel-project.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=<generate-a-random-secure-string>
```

**Replace:**

- `your-vercel-project` with your actual Vercel project name
- `<your-anon-key>` with your Supabase anon key
- `<your-service-role-key>` with your Supabase service role key
- `<generate-a-random-secure-string>` with a random secure string (e.g., `openssl rand -hex 32`)

### 4. Update Supabase CORS

In your Supabase dashboard:

1. Go to **Project Settings → API**
2. Add `https://your-vercel-project.vercel.app` to the CORS allowed origins

### 5. Deploy

- Vercel will automatically deploy when you push to your main branch
- Your app will be available at `https://your-vercel-project.vercel.app`

### 6. Verify

1. Visit your Vercel URL
2. Try logging in with an admin email (from `ADMIN_EMAILS`)
3. Try creating a question
4. Check the admin responses page

## Troubleshooting

### "Cannot read properties of undefined (reading 'uuid')"

- Make sure `VITE_API_BASE_URL` is set to your Vercel domain (`https://your-vercel-project.vercel.app/api`)
- Reload the page after environment variables change
- Clear browser cache

### 403 Forbidden Errors

- Verify your email is in `ADMIN_EMAILS` environment variable
- Make sure `ADMIN_EMAILS` is set on Vercel (both for frontend and backend)

### CORS Errors

- Update `CORS_ORIGIN` in Vercel to your domain
- Add your Vercel domain to Supabase CORS settings

### API Not Found (404)

- Check that `VITE_API_BASE_URL` points to `/api` endpoint
- Make sure the `api/index.js` file exists and is deployed

## Local Development

To test locally before deploying:

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev
```

Visit `http://localhost:5173` and make sure everything works.

## Production Notes

- All secrets (API keys, service keys) are stored in Vercel environment variables, not in code
- The frontend is built as static HTML/CSS/JS and served globally via Vercel's CDN
- The backend runs as serverless functions (cold start ~1-2 seconds, then fast)
- Supabase handles all database operations and authentication
- Rate limiting is applied to all API endpoints
