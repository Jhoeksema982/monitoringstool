# Deployment guide

This repository is a Vite + React frontend with an Express backend (`server.js`) that uses Supabase as a data store. The project can be deployed in multiple ways; below are recommended options and step-by-step commands.

## Which deploy method fits best?
- If you want **a single deployable unit (frontend + backend together)**: build the frontend (`npm run build`) and run the server that serves the `dist` folder. Recommended hosting: Render (Docker or Node service), Railway (Docker/Node), Fly.io, DigitalOcean App Platform. For this path we've added a `Dockerfile` so you can deploy the container directly.
- If you prefer **split deployment**: deploy the frontend to Vercel/Netlify/GitHub Pages and the backend as a separate Node service (Render/Railway). Use `netlify.toml` for Netlify or Vercel's defaults for Vercel.
- If you only want static hosting (no server): GitHub Pages / Netlify / Vercel, but you must remove or separately host the backend (API) since GitHub Pages cannot run Node servers.

## Files added for deployment
- `Dockerfile` — multi-stage Docker build (build frontend, run server)
- `.dockerignore` — reduce Docker context
- `netlify.toml` — Netlify config (build command + SPA redirect)
- `.github/workflows/deploy-gh-pages.yml` — build frontend and deploy to GitHub Pages
- `.github/workflows/publish-docker.yml` — build and push Docker image to GHCR
- `.env.example` — example environment variables

## Quick local build & run (single container)
1. Install deps: `npm ci`
2. Build frontend: `npm run build`
3. Start server (serve built frontend):
   - Locally: `NODE_ENV=production npm start`
   - Or with Docker: `docker build -t monitoringstool:latest .` then `docker run -p 5000:5000 --env-file .env monitoringstool:latest`

## Deploy with Render (recommended single-unit Docker)
1. Push code to GitHub (already done).
2. Go to https://render.com and create a new **Web Service**.
3. Connect your GitHub repo and choose Docker as the environment (Render will use the `Dockerfile`).
4. Add environment variables in Render from `.env.example`.
5. Deploy.

Notes:
- The server expects Supabase credentials and `ADMIN_EMAILS` to be set.
- The server will serve `dist` when `NODE_ENV=production` or `SERVE_STATIC=true`.

## Deploy frontend to Netlify (frontend-only)
1. Create a Netlify site and connect the GitHub repo.
2. Build command: `npm run build`, Publish directory: `dist`.
3. Ensure `netlify.toml` is present (it is) for SPA redirects.

## Deploy frontend to Vercel (frontend-only)
1. Import project into Vercel and set the framework to `Vite`.
2. Build command: `npm run build`, Output directory: `dist`.

## GitHub Pages (frontend-only)
1. The workflow `.github/workflows/deploy-gh-pages.yml` builds and deploys `dist` to GitHub Pages on push to `main`/`master`.
2. If your site will be served from a subpath (username.github.io/repo), set the `base` in `vite.config.js` to `'/repo/'`.

## Continuous delivery of Docker image (GHCR)
1. The workflow `.github/workflows/publish-docker.yml` builds a Docker image and publishes it to `ghcr.io/<owner>/<repo>:latest` on push to `main`/`master`.
2. After pushing the image, you can deploy that image to any container host (Render, Fly.io, DigitalOcean) by pointing the host to the image or pulling it.

## Environment variables
Set these for your production server (see `.env.example`):
- `SUPABASE_URL`, `SUPABASE_KEY`
- `ADMIN_EMAILS` (comma-separated emails)
- `CORS_ORIGIN` (set to your frontend domain)

## Project readiness checklist
- [ ] `npm run build` succeeds and outputs `dist`.
- [ ] `server.js` runs in production and serves `dist` (we added this behaviour).
- [ ] Sensitive keys stored in host environment (not in repo).
- [ ] `CORS_ORIGIN` set correctly.

## Optimizations & recommendations
- Use separate services for API and frontend if you expect independent scaling.
- Enable `NODE_ENV=production` in production to minify assets and enable static serving.
- Add a `health` probe in your host that hits `/api/health`.
- Consider removing devDependencies from production Docker layer (already done).
- If deploying to GitHub Pages on a repo subpath, set `base` in `vite.config.js`.

## Geen Fly.io (geen creditcard)? Gratis alternatieven
Je gaf aan geen creditcard te hebben — goed om Fly.io te vermijden. Hieronder praktische, gratis alternatieven en welke aanpassingen ze vragen.

- **Vercel (aanbevolen voor frontend + serverless API)**
   - Voordelen: gratis tier, eenvoudige GitHub-integratie, automatisch deployen van Vite-projecten.
   - Backend-optie: plaats API endpoints als Vercel Serverless Functions (`/api/*`) of Edge Functions. Je kunt je huidige Express-app in één serverless handler wrappen met `serverless-http`, of per-route functies schrijven.
   - Aanpassingen: maak een `api/` map met functies of voeg een `api/index.js` die Express wrapped.

- **Netlify Functions**
   - Voordelen: gratis tier, werkt goed met static frontend; ondersteunt AWS Lambda-achtige functies.
   - Aanpassingen: verplaats kritische server endpoints naar Netlify Functions (per endpoint of als wrapper).

- **Supabase Edge Functions (zeer geschikt als je al Supabase gebruikt)**
   - Voordelen: draait dicht bij je database, gratis tier, goede integratie met Supabase Auth/DB.
   - Aanpassingen: schrijf je API-logica als Deno (TypeScript/JavaScript) Edge Functions; je hoeft geen aparte host meer te beheren.

- **Cloudflare Workers**
   - Voordelen: edge-hosting, gratis tier met ruime limieten voor starters, lage latency.
   - Aanpassingen: je moet code aanpassen naar Workers runtime (fetch-based handlers). Niet alle Node-native modules werken direct.

## Welke optie past het best bij jouw repo?
- Als je minimaal wilt aanpassen en snel online wilt: **Vercel frontend + Vercel Serverless Functions** (wrap Express via `serverless-http`).
- Als je liever tight-integratie met Supabase en geen extra host wilt: **migreren naar Supabase Edge Functions** (aanbevolen als je veel Supabase-specifieke logica hebt).
- Als je API erg lichtgewicht is of je edge-locaties wil: **Cloudflare Workers** (meer rewrite werk).

## Kort stappenplan (Vercel serverless, snelle route)
1. Maak Vercel account en importeer repo.
2. Bouw: `npm run build`, Output: `dist` (Vercel detecteert Vite automatisch).
3. Zet een serverless wrapper: maak `api/server.js` met `serverless-http` die je Express-app exporteert.
4. Zet benodigde secrets in Vercel (SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAILS).

Voorbeeld `api/server.js` (kan ik automatisch toevoegen als je wilt):

```js
import serverless from 'serverless-http';
import expressApp from '../server.js'; // of pas exports aan in server.js zodat het exports de express app

export const handler = serverless(expressApp);
```

Opmerking: je moet `server.js` aanpassen zodat het zowel als standalone server kan starten (voor local dev / Docker) als de express `app` kan worden geëxporteerd voor serverless wrapping. Ik kan dat voor je regelen.

## Kort stappenplan (Supabase Edge Functions, aanbevolen als je Supabase al gebruikt)
1. Installeer en configureer `supabase` CLI lokaal.
2. Verplaats je API-endpoints naar Edge Functions (Deno) en gebruik Supabase client direct in die functions.
3. Deploy via `supabase functions deploy <name>`.

Voordelen: geen aparte host, goede integratie met Supabase Auth en DB.

---
Wil je dat ik nu automatisch:
- (A) `api/server.js` en kleine aanpassing in `server.js` toevoeg zodat Vercel Serverless kan gebruiken (snelle optie), of
- (B) een start-sjabloon maak voor Supabase Edge Functions en een voorbeeld endpoint genereer (meer wijziging maar volledig gratis), of
- (C) alleen deze aanbeveling bewaren en niets veranderen?

Kies A/B/C en ik voer het direct uit.
