# Retirement Readiness Assessment

A free retirement readiness self-assessment by [Masuda Lehrman Wealth](https://hawaiiadvisor.com). Users complete a 7-step intake, a Monte Carlo simulation runs in the browser, and results appear instantly with charts and analysis. Each completed assessment logs a lead row (name, email, results summary) to a Google Sheet.

## Architecture

- **Frontend**: React + TypeScript + Vite, shadcn/ui, Tailwind CSS, Recharts. The Monte Carlo engine (`shared/simulation.ts`) runs entirely client-side.
- **Backend**: One API endpoint, `POST /api/log-lead`, which appends a row to a Google Sheet.
  - On **Vercel** (production): `api/log-lead.ts` serverless function
  - **Local dev**: Express server (`server/`) serves the same route plus the Vite dev server

## Deploying to Vercel (free)

1. Push this repo to GitHub.
2. At [vercel.com](https://vercel.com), sign up with GitHub → **Add New → Project** → import this repo. Vercel reads `vercel.json` automatically — no settings to change.
3. Add the three environment variables from `.env.example` (Project Settings → Environment Variables). See below for how to get them.
4. Deploy. Every push to the `main` branch auto-deploys.

## Google Sheets setup (one-time, ~5 minutes)

The Replit version used Replit's built-in Google Sheets connector; this version uses a standard Google **service account** instead.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project (any name).
2. **APIs & Services → Library** → search "Google Sheets API" → **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service account**. Name it (e.g. `sheet-logger`), skip the optional steps, **Done**.
4. Click the new service account → **Keys** tab → **Add key → Create new key → JSON**. A JSON file downloads.
5. From that JSON file:
   - `client_email` → set as `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → set as `GOOGLE_PRIVATE_KEY` (copy the whole string, including `-----BEGIN PRIVATE KEY-----`)
6. Open your leads Google Sheet → **Share** → paste the service account email → give it **Editor** access.
7. `GOOGLE_SHEET_ID` is the long ID in the sheet's URL: `docs.google.com/spreadsheets/d/`**`THIS-PART`**`/edit`.

If the sheet is empty, headers are written automatically on the first submission. Lead logging is fire-and-forget: if it fails, the visitor still sees their results.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values
npm run dev            # http://localhost:5000
```

## Notes

- `design_guidelines.md` documents the visual design system.
- Assumptions/config for the simulation live in `shared/ruleset.ts`; intake validation in `shared/schema.ts`.
- This tool is educational only and does not provide personalized financial advice.
