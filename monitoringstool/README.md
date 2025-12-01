# Monitoringstool

## Setup

1) Install dependencies
```bash
npm install
```

2) Environment variables: create a `.env` file next to `package.json`
```
# Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin@example.com,beheer@jouwbedrijf.nl

# Server
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAILS=admin@example.com,beheer@jouwbedrijf.nl
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

3) Run servers
```bash
npm run server   # API (Express)
npm run dev      # Frontend (Vite)
```

After changing `.env`, restart both processes.
