# OpenLobby (TreeHacks 2026)

This repo contains:

- `/Users/akhildeo/treehacks26/docs/plan.md`: full architecture + build spec
- `/Users/akhildeo/treehacks26/openlobby-web`: Next.js noir-newsroom landing page (live-only)
- `/Users/akhildeo/treehacks26/openlobby-api`: FastAPI backend (Perplexity Sonar + Supabase + Elasticsearch + Jina + Modal)
- `/Users/akhildeo/treehacks26/supabase/migrations`: Supabase migrations to apply when you create the project
- `/Users/akhildeo/treehacks26/modal/modal_app.py`: Modal GPU worker (open-source model via vLLM)

## Run The Web Demo

```bash
cd openlobby-web
npm install
npm run dev
```

The web app requires `NEXT_PUBLIC_API_URL` in `/Users/akhildeo/treehacks26/openlobby-web/.env.local`.

## Backend

```bash
cd openlobby-api
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Supabase

After you create a Supabase project, apply migrations:

```bash
./scripts/bootstrap_supabase.sh <project-ref>
```

Then trigger first ingest (after API has env vars):

```bash
./scripts/first_ingest.sh http://localhost:8000 <INGEST_SECRET>
```
