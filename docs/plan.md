

# OPENLOBBY

**Corporate Influence Tracker**
**Comprehensive Hackathon Build Specification**
**Version 1.0**  |  **February 2026**  |  **Hackathon Ready**
**Stack:** BrightData + JINA + Supabase (Postgres + Auth) + Elasticsearch + Modal + Vercel + Cloudflare + Render

## Table of Contents

1. Motivation & Why This Matters
2. Architecture Overview & System Diagram
3. Data Sources & Ingestion Pipeline
4. Backend Services (Render + Cloudflare Workers)
5. Data Storage: Supabase (Primary) + Elasticsearch (Search/Vector)
6. Modal GPU Service (LLM Entity Extraction & QA)
7. Frontend (Vercel + Next.js)
8. LLM Prompts (XML-Structured, Production-Grade)
9. Infrastructure Setup & Configuration
10. Database Seeding & Demo Data Strategy
11. Hackathon Timeline (24-Hour Sprint Plan)
12. Prize Alignment Matrix
13. Appendix: Environment Variables

---

## 1. Motivation & Why This Matters

OpenLobby exists to answer the question every voter, journalist, and activist should be able to ask:

> “Who is paying my politicians, and how is it affecting their votes?”

### 1.1 The Problem

Campaign finance and lobbying data exists across dozens of fragmented government databases (FEC, Senate Office of Public Records, SEC EDGAR). The data is public but practically inaccessible: scattered across different formats, buried in legalese, and impossible to cross-reference without significant technical expertise.

### 1.2 What OpenLobby Does

OpenLobby unifies all of this data into a single, semantically searchable platform. Users type natural language questions and get back interactive visualizations showing the money trail between companies, lobbyists, PACs, and politicians.

### 1.3 Timeliness (2025–2026)

* **Record Lobbying:** Federal lobbying hit **$4.3B+ in 2024**, an all-time high.
* **AI Regulation:** Massive tech company lobbying on AI safety bills happening right now.
* **2026 Midterms:** Voters heading into midterms want transparency on who funds their reps.
* **OpenSecrets API Shutdown:** OpenSecrets discontinued their API in **April 2025**, creating a gap in accessible political finance tooling. Their bulk data is still available for download.

---

## 2. Architecture Overview

### 2.1 System Diagram (ASCII)

```text
+------------------+     +-------------------+     +----------------------+
| DATA SOURCES     | --> | INGESTION LAYER   | --> | Supabase Postgres     |
| - FEC API        |     | BrightData +      |     | (source of truth)     |
| - Senate Lobby   |     | Cloudflare Worker |     +----------+-----------+
| - OpenSecrets    |     | (ETL Scheduler)   |                |
| - SEC EDGAR      |     +-------------------+                v
| - News (RSS)     |                             +----------------------+
+------------------+                             | Elasticsearch         |
                                                 | (derived search/index)|
                                                 +----------+-----------+
                                                            |
+------------------+     +-------------------+               v      +------------------+
| FRONTEND         | <-- | BACKEND API       | <-------------------- | Modal (GPU)      |
| Vercel (Next.js) |     | Render (FastAPI)  |                       | LLM tasks        |
| - Supabase Auth  |     | - verifies JWT    |                       +------------------+
| - Search UI      |     | - reads Supabase  |
| - Dashboard      |     | - queries Elastic |
+------------------+     +-------------------+
```

### 2.2 Component Responsibilities

| Component        | Technology                         | Role                                                                                                                               |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Data Ingestion   | BrightData Web Scraper API         | Scrape OpenSecrets pages, Senate lobbying disclosures, news articles. Handle anti-bot, proxies, JS rendering automatically.        |
| ETL / Scheduling | Cloudflare Workers + Cron Triggers | Scheduled data pipelines that transform raw scraped data into structured entities, trigger BrightData jobs, and upsert into Supabase + index Elasticsearch. |
| Primary DB       | Supabase (Postgres)                | Source-of-truth for all structured data: entities, relationships, raw docs, and all user data (saved items, notes, reports).       |
| Auth             | Supabase Auth (Google OAuth)       | User signup/login via Google. Frontend obtains Supabase session; backend verifies Supabase JWT for user endpoints.                 |
| Search/Vector    | Elasticsearch (Elastic Cloud)      | Rebuildable derived index for hybrid search (BM25 + kNN) and fast retrieval. Stores embeddings + denormalized fields for ranking.  |
| Embeddings       | JINA Embeddings v3 API             | Generate 1024-dim embeddings for all text content. Supports task-specific adapters (retrieval, classification).                    |
| LLM Processing   | Modal (serverless GPU)             | Run open-source LLMs (Mistral/Llama) for entity extraction from raw text, natural language question answering, and summarization.  |
| Backend API      | Render (FastAPI/Python)            | REST API serving the frontend. Uses Supabase Postgres for canonical reads/writes, verifies Supabase Auth, queries Elasticsearch.    |
| Frontend         | Vercel (Next.js 14 + React)        | Interactive UI with search bar, knowledge graph visualization (D3.js/react-force-graph), dashboards, and shareable reports.        |

---

## 3. Data Sources & Ingestion Pipeline

### 3.1 Primary Data Sources

| Source                                         | Data Type                                                                                 | Access Method                                                         | Update Freq    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------- |
| FEC (`api.open.fec.gov`)                       | Campaign contributions, candidate financials, PAC data, independent expenditures          | REST API (free, API key required via `api.data.gov`)                  | Daily          |
| OpenSecrets Bulk Data                          | Lobbying clients/registrants/lobbyists, PAC summaries, industry totals, personal finances | Bulk CSV download (register at `opensecrets.org/open-data/bulk-data`) | Weekly–Monthly |
| Senate Lobbying Disclosures (`lda.senate.gov`) | LD-1 and LD-2 lobbying registration and activity reports                                  | BrightData scraping (XML/HTML parsing)                                | Quarterly      |
| SEC EDGAR                                      | Corporate officer compensation, insider trading, 10-K/proxy filings                       | REST API (EDGAR full-text search) + BrightData for HTML parsing       | Daily          |
| ProPublica Congress API                        | Congressional votes, bill info, member data                                               | REST API (free, key required)                                         | Daily          |
| News Sources (RSS + scraping)                  | News articles mentioning politicians + companies for sentiment analysis                   | BrightData Web Scraper API + Jina Reader API (`r.jina.ai`)            | Real-time      |

### 3.2 BrightData Ingestion Configuration

**`brightdata_scraper.py`** (Cloudflare Worker triggers this)

```python
import requests

BRIGHTDATA_API_KEY = os.environ['BRIGHTDATA_API_KEY']
BASE_URL = 'https://api.brightdata.com/datasets/v3'

def scrape_opensecrets_org_profiles(org_names: list[str]):
    """Scrape organization profiles from OpenSecrets."""
    urls = [
        {'url': f'https://www.opensecrets.org/orgs/{name}/summary'}
        for name in org_names
    ]
    resp = requests.post(
        f'{BASE_URL}/scrape?dataset_id=gd_custom_opensecrets&format=json',
        headers={
            'Authorization': f'Bearer {BRIGHTDATA_API_KEY}',
            'Content-Type': 'application/json'
        },
        json=urls
    )
    return resp.json()

def scrape_senate_lobbying(year: int, quarter: int):
    """Scrape Senate LD-2 filings."""
    url = f'https://lda.senate.gov/filings/xml/{year}/Q{quarter}'
    resp = requests.post(
        f'{BASE_URL}/scrape?dataset_id=gd_custom_senate&format=json',
        headers={'Authorization': f'Bearer {BRIGHTDATA_API_KEY}',
                 'Content-Type': 'application/json'},
        json=[{'url': url}]
    )
    return resp.json()
```

### 3.3 FEC API Integration

**`fec_client.py`**

```python
import requests

FEC_API_KEY = os.environ['FEC_API_KEY']
FEC_BASE = 'https://api.open.fec.gov/v1'

def get_candidate_contributions(candidate_id: str, cycle: int = 2024):
    """Get top contributors to a candidate."""
    resp = requests.get(f'{FEC_BASE}/schedules/schedule_a/',
        params={
            'api_key': FEC_API_KEY,
            'committee_id': candidate_id,
            'two_year_transaction_period': cycle,
            'sort': '-contribution_receipt_amount',
            'per_page': 100
        })
    return resp.json()['results']

def get_committee_summary(committee_id: str):
    resp = requests.get(f'{FEC_BASE}/committee/{committee_id}/totals/',
        params={'api_key': FEC_API_KEY})
    return resp.json()['results']
```

### 3.4 Data Pipeline Flow

1. Cloudflare Worker cron trigger fires every 6 hours
2. Worker dispatches BrightData scrape jobs for new lobbying filings and news
3. BrightData webhook delivers results to Render backend endpoint `/api/ingest/webhook`
4. Backend parses raw HTML/JSON, calls Modal for entity extraction (NER on raw text)
5. Extracted entities + relationships are upserted into **Supabase Postgres** (canonical store)
6. Text fields get JINA embeddings generated
7. Derived search documents are indexed into Elasticsearch (rebuildable from Supabase)

---

## 4. Backend Services

### 4.1 Render: FastAPI Backend

#### Project Structure

```text
openlobby-api/
  app/
    main.py              # FastAPI app entry point
    routers/
      search.py          # /api/search - semantic search endpoint
      entities.py        # /api/entities/{id} - entity details
      graph.py           # /api/graph - relationship graph data
      ingest.py          # /api/ingest - webhook + manual triggers
      ask.py             # /api/ask - natural language Q&A
      user.py            # /api/user/* - saved queries, bookmarks, notes (requires Supabase JWT)
    services/
      elasticsearch.py   # ES client + query builders
      jina.py            # JINA embedding generation
      modal_client.py    # Call Modal for LLM tasks
      fec.py             # FEC API client
      brightdata.py      # BrightData trigger client
      supabase.py        # Supabase client (service role) + DB helpers
      auth.py            # Verify Supabase JWT (Authorization: Bearer <access_token>)
    models/
      entities.py        # Pydantic models for Politician, Company, etc.
      relationships.py   # Donation, Lobbying, Vote models
    config.py            # Settings from env vars
  requirements.txt
  render.yaml            # Render deployment config
```

#### `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import search, entities, graph, ingest, ask, user, news, cases

app = FastAPI(title='OpenLobby API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://openlobby.vercel.app', 'http://localhost:3000'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(search.router, prefix='/api/search', tags=['search'])
app.include_router(entities.router, prefix='/api/entities', tags=['entities'])
app.include_router(graph.router, prefix='/api/graph', tags=['graph'])
app.include_router(ingest.router, prefix='/api/ingest', tags=['ingest'])
app.include_router(ask.router, prefix='/api/ask', tags=['ask'])
app.include_router(user.router, prefix='/api/user', tags=['user'])
app.include_router(news.router, prefix='/api/news', tags=['news'])
app.include_router(cases.router, prefix='/api/cases', tags=['cases'])
```

#### Key Endpoint: `/api/search` (`search.py`)

```python
from fastapi import APIRouter, Query
from app.services.jina import get_embedding
from app.services.elasticsearch import semantic_search

router = APIRouter()

@router.get('/')
async def search(
    q: str = Query(..., description='Natural language query'),
    entity_type: str = Query(None, enum=['politician','company','pac','lobbyist']),
    limit: int = Query(20, le=100)
):
    # 1. Generate embedding for query
    query_embedding = await get_embedding(q, task='retrieval.query')
    
    # 2. Hybrid search: semantic (kNN) + keyword (BM25)
    results = await semantic_search(
        query_text=q,
        query_vector=query_embedding,
        entity_type=entity_type,
        limit=limit
    )
    # NOTE: Elasticsearch is a derived index. For canonical fields (and any writes),
    # read/write Supabase Postgres. Optionally hydrate results by id from Supabase here.
    return {'results': results, 'query': q}
```

#### Key Endpoint: `/api/ask` (Natural Language Q&A)

```python
@router.post('/')
async def ask_question(request: AskRequest):
    # 1. Embed the question
    q_vec = await get_embedding(request.question, task='retrieval.query')
    
    # 2. Retrieve relevant context from Elasticsearch
    context_docs = await semantic_search(
        query_text=request.question,
        query_vector=q_vec,
        limit=10
    )
    
    # 3. Send to Modal LLM for answer generation
    answer = await modal_qa(
        question=request.question,
        context=context_docs
    )
    
    return {'answer': answer, 'sources': context_docs}
```

#### Landing Support Endpoints: News + Case Files

These endpoints power the Noir Newsroom landing experience. The frontend calls the backend only (no local fixtures). The backend serves canonical records from Supabase and optionally indexes into Elasticsearch (derived).

- `GET /api/news/top?limit=50`
  - Returns headline cards: `[{ id, title, url, source, published_at, excerpt, image_url, entities_mentioned[] }]`
- `GET /api/cases`
  - Returns case file metadata (no steps): `[{ id, title, dek, hero_image_url, tags[] }]`
- `GET /api/cases/{id}`
  - Returns full case file, including `steps[]` consumed by the landing `ScrollStory`

### 4.2 Cloudflare Workers: ETL Scheduler

**`worker.js`** (Cloudflare Worker with Cron Trigger)

```js
export default {
  async scheduled(event, env, ctx) {
    // Runs every 6 hours via cron trigger
    const tasks = [
      triggerFECSync(env),
      triggerNewsScrape(env),
      triggerLobbyingUpdate(env),
    ];
    await Promise.allSettled(tasks);
  },

  async fetch(request, env) {
    // Manual trigger endpoint
    if (request.url.includes('/trigger/ingest')) {
      await triggerFECSync(env);
      return new Response('Ingestion triggered', { status: 200 });
    }
    return new Response('OpenLobby ETL Worker', { status: 200 });
  }
};

async function triggerFECSync(env) {
  await fetch(env.RENDER_API_URL + '/api/ingest/fec', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.INGEST_SECRET}` }
  });
}

async function triggerNewsScrape(env) {
  await fetch(env.RENDER_API_URL + '/api/ingest/news', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.INGEST_SECRET}` }
  });
}
```

**`wrangler.toml`** (Cloudflare Worker Config)

```toml
name = 'openlobby-etl'
main = 'src/worker.js'
compatibility_date = '2024-12-01'

[triggers]
crons = ['0 */6 * * *']  # Every 6 hours

[vars]
RENDER_API_URL = 'https://openlobby-api.onrender.com'

# Secrets set via: wrangler secret put INGEST_SECRET
# wrangler secret put BRIGHTDATA_API_KEY
```

---

## 5. Data Storage: Supabase (Primary) + Elasticsearch (Search/Vector)

### 5.1 Supabase: Database + Auth

Supabase is the **source-of-truth** for all structured data and all user data. Elasticsearch is a derived index that can be rebuilt from Supabase at any time.

#### 5.1.1 Auth (Google OAuth)

- Use **Supabase Auth** for login.
- Frontend uses `signInWithOAuth({ provider: 'google' })`.
- Frontend sends `Authorization: Bearer <supabase_access_token>` to backend for any user-scoped endpoints.
- Backend verifies Supabase JWT and enforces access control server-side for `/api/user/*`.
- Use `SUPABASE_SERVICE_ROLE_KEY` only on the server (ingest/index/seed). Never expose it to the client.

Supabase Dashboard setup:

- Authentication -> Providers -> enable **Google**
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

#### 5.1.2 Core Tables (Canonical Data)

Minimal schema (SQL) for hackathon:

```sql
-- Canonical entities
create table if not exists public.entities (
  id text primary key,
  type text not null check (type in ('politician','company','pac','lobbyist','bill','document')),
  name text not null,
  description text,
  party text,
  state text,
  industry text,
  total_lobbying numeric,
  total_donations numeric,
  metadata jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now()
);

-- Canonical relationships
create table if not exists public.relationships (
  id text primary key,
  type text not null check (type in ('donation','lobbying','vote','employment')),
  source_id text not null references public.entities(id) on delete cascade,
  target_id text not null references public.entities(id) on delete cascade,
  amount numeric,
  date date,
  cycle text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now()
);

create index if not exists relationships_source_id_idx on public.relationships(source_id);
create index if not exists relationships_target_id_idx on public.relationships(target_id);
create index if not exists entities_type_idx on public.entities(type);
```

#### 5.1.3 User Data Tables (Supabase Auth + RLS)

User data lives in Supabase with Row Level Security (RLS) so users can only read/write their own rows.

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null references public.entities(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, entity_id)
);

alter table public.profiles enable row level security;
alter table public.saved_queries enable row level security;
alter table public.bookmarks enable row level security;

-- RLS policies (owner-only)
create policy "profiles_owner_read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_owner_write" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = user_id);

create policy "saved_queries_owner" on public.saved_queries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookmarks_owner" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

#### 5.1.4 News Documents + Case Files (Canonical, Later)

Landing-page “news” and “case files” are generated live and cached canonically in Supabase (Section 7.2.2). Elasticsearch remains a derived index.

```sql
-- Canonical news / source documents (articles, filings summaries, etc.)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- e.g. 'rss', 'sec_edgar', 'fec', 'lda_senate', 'manual'
  url text,
  title text not null,
  published_at timestamptz,
  excerpt text,
  image_url text,
  entities_mentioned text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists documents_url_unique_idx on public.documents(url) where url is not null;
create index if not exists documents_published_at_idx on public.documents(published_at desc);

-- Curated narratives used for the landing scrollytelling experience
create table if not exists public.case_files (
  id text primary key, -- stable slug, e.g. 'pharma-drug-pricing'
  title text not null,
  dek text, -- short subtitle
  hero_image_url text,
  tags text[] not null default '{}'::text[],
  steps jsonb not null, -- ordered array of step objects consumed by the ScrollStory UI
  entities_featured text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);
```

### 5.2 Elasticsearch Index Design (Derived)

We use a unified index with entity types discriminated by a `type` field. Each entity stores both structured data and a JINA embedding vector for semantic search.

#### Index Mapping: `openlobby-entities`

```json
PUT /openlobby-entities
{
  "mappings": {
    "properties": {
      "id":           { "type": "keyword" },
      "type":         { "type": "keyword" },
      "name":         { "type": "text", "analyzer": "standard" },
      "description":  { "type": "text", "analyzer": "standard" },
      "party":        { "type": "keyword" },
      "state":        { "type": "keyword" },
      "industry":     { "type": "keyword" },
      "total_lobbying":   { "type": "float" },
      "total_donations":  { "type": "float" },
      "metadata":     { "type": "object", "enabled": false },
      "embedding": {
        "type": "dense_vector",
        "dims": 1024,
        "index": true,
        "similarity": "cosine"
      },
      "last_updated": { "type": "date" }
    }
  }
}
```

#### Index Mapping: `openlobby-relationships`

```json
PUT /openlobby-relationships
{
  "mappings": {
    "properties": {
      "id":            { "type": "keyword" },
      "type":          { "type": "keyword" },
      "source_id":     { "type": "keyword" },
      "target_id":     { "type": "keyword" },
      "source_name":   { "type": "text" },
      "target_name":   { "type": "text" },
      "amount":        { "type": "float" },
      "date":          { "type": "date" },
      "cycle":         { "type": "keyword" },
      "description":   { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 1024,
        "index": true,
        "similarity": "cosine"
      }
    }
  }
}
```

### 5.3 Hybrid Search Implementation

**`elasticsearch.py`**

```python
from elasticsearch import AsyncElasticsearch

es = AsyncElasticsearch(
    cloud_id=os.environ['ELASTIC_CLOUD_ID'],
    api_key=os.environ['ELASTIC_API_KEY']
)

async def semantic_search(query_text, query_vector, entity_type=None, limit=20):
    """Hybrid search: kNN (semantic) + BM25 (keyword)."""
    knn_query = {
        'field': 'embedding',
        'query_vector': query_vector,
        'k': limit,
        'num_candidates': limit * 5
    }
    text_query = {
        'multi_match': {
            'query': query_text,
            'fields': ['name^3', 'description', 'source_name', 'target_name']
        }
    }
    filter_clause = [{'term': {'type': entity_type}}] if entity_type else []
    
    resp = await es.search(
        index='openlobby-entities,openlobby-relationships',
        knn={**knn_query, 'filter': filter_clause},
        query={'bool': {'must': [text_query], 'filter': filter_clause}},
        size=limit
    )
    return [hit['_source'] for hit in resp['hits']['hits']]
```

### 5.4 JINA Embedding Generation

**`jina.py`**

```python
import httpx

JINA_API_KEY = os.environ['JINA_API_KEY']
JINA_URL = 'https://api.jina.ai/v1/embeddings'

async def get_embedding(text: str, task: str = 'retrieval.query') -> list[float]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(JINA_URL, json={
            'model': 'jina-embeddings-v3',
            'task': task,
            'input': [text],
            'dimensions': 1024
        }, headers={
            'Authorization': f'Bearer {JINA_API_KEY}',
            'Content-Type': 'application/json'
        })
        return resp.json()['data'][0]['embedding']

async def get_embeddings_batch(texts: list[str], task='retrieval.passage'):
    async with httpx.AsyncClient() as client:
        resp = await client.post(JINA_URL, json={
            'model': 'jina-embeddings-v3',
            'task': task,
            'input': texts,
            'dimensions': 1024
        }, headers={
            'Authorization': f'Bearer {JINA_API_KEY}',
            'Content-Type': 'application/json'
        })
        return [d['embedding'] for d in resp.json()['data']]
```

---

## 6. Modal GPU Service (LLM Processing)

### 6.1 Modal App: Entity Extraction + Question Answering

Modal runs our open-source LLM (Mistral 7B or Llama 3 8B) on serverless GPUs. It handles two primary tasks:

1. Extracting structured entities from raw scraped text
2. Answering natural language questions with retrieved context

**`modal_app.py`**

```python
import modal

app = modal.App('openlobby-llm')

# Define the container image with vLLM
image = (
    modal.Image.debian_slim(python_version='3.11')
    .pip_install('vllm', 'torch', 'transformers', 'fastapi')
)

MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.3'

@app.cls(
    image=image,
    gpu='A10G',
    container_idle_timeout=300,
    allow_concurrent_inputs=10,
)
class LLMService:
    @modal.enter()
    def load_model(self):
        from vllm import LLM, SamplingParams
        self.llm = LLM(model=MODEL_ID, max_model_len=8192)
        self.params = SamplingParams(
            temperature=0.1, max_tokens=2048, top_p=0.95
        )

    @modal.method()
    def extract_entities(self, raw_text: str) -> dict:
        """Extract structured entities from raw scraped text."""
        prompt = ENTITY_EXTRACTION_PROMPT.format(text=raw_text)
        outputs = self.llm.generate([prompt], self.params)
        return parse_xml_response(outputs[0].outputs[0].text)

    @modal.method()
    def answer_question(self, question: str, context: str) -> str:
        """Answer a natural language question using context."""
        prompt = QA_PROMPT.format(question=question, context=context)
        outputs = self.llm.generate([prompt], self.params)
        return outputs[0].outputs[0].text

    @modal.method()
    def summarize_entity(self, entity_data: str) -> str:
        """Generate a human-readable summary of entity data."""
        prompt = SUMMARY_PROMPT.format(data=entity_data)
        outputs = self.llm.generate([prompt], self.params)
        return outputs[0].outputs[0].text
```

#### Calling Modal from Render Backend (`modal_client.py`)

```python
import modal

LLMService = modal.Cls.lookup('openlobby-llm', 'LLMService')

async def modal_extract_entities(raw_text: str) -> dict:
    service = LLMService()
    return service.extract_entities.remote(raw_text)

async def modal_qa(question: str, context: list[dict]) -> str:
    context_str = '\n'.join([
        f'<document>\n<source>{d["name"]}</source>\n'
        f'<content>{d["description"]}</content>\n</document>'
        for d in context
    ])
    service = LLMService()
    return service.answer_question.remote(question, context_str)
```

### 6.2 Deployment

```bash
# Install Modal CLI and authenticate
pip install modal
modal setup   # Opens browser for auth

# Set secrets
modal secret create huggingface-secret HUGGING_FACE_HUB_TOKEN=hf_xxx

# Deploy the app
modal deploy modal_app.py

# Test locally first
modal serve modal_app.py
```

---

## 7. Frontend (Vercel + Next.js)

### 7.1 Project Structure

```text
openlobby-web/
	  app/
	    layout.tsx           # Root layout with nav, fonts, theme
	    page.tsx             # Landing page with hero search
	    auth/
	      callback/
	        page.tsx         # Supabase OAuth callback (set session, redirect)
	    search/
	      page.tsx           # Search results page
	    entity/
	      [id]/
	        page.tsx         # Entity detail page (politician/company)
    explore/
      page.tsx           # Interactive graph explorer
    ask/
      page.tsx           # Natural language Q&A interface
  components/
    SearchBar.tsx        # Main search input with autocomplete
    EntityCard.tsx       # Card for search results
    MoneyFlow.tsx        # Sankey diagram component
    NetworkGraph.tsx     # Force-directed graph (react-force-graph)
    DonationTimeline.tsx # Timeline chart of contributions
    VoteRecord.tsx       # Voting record visualization
    SentimentBadge.tsx   # News sentiment indicator
	  lib/
	    api.ts               # API client for Render backend
	    supabase.ts          # Supabase client (Auth)
	    types.ts             # TypeScript types
  public/
  tailwind.config.ts
  next.config.js
  vercel.json
```

### 7.2 Key Pages

#### 7.2.1 Landing Page (`app/page.tsx`) — Noir Newsroom (Scrollytelling)

The landing page is a longform investigation that materially changes as the user scrolls.

**Design system (tokens)**

Typography (Google Fonts recommended):

- Headlines: `Instrument Serif` (fallback `Georgia, serif`)
- Data/labels: `Fragment Mono` (fallback `ui-monospace, SFMono-Regular, Menlo, monospace`)
- Body: `Source Serif 4` (fallback `serif`)

Color tokens (CSS variables and mirrored into Tailwind theme):

- `--ink-0: #F4F0E8` (paper)
- `--ink-900: #070A0F` (near-black)
- `--steel: #9AA4B2` (secondary)
- `--blood: #E03A3E` (accent)
- `--copper: #C47F3A` (secondary accent)
- `--fog: rgba(244,240,232,0.08)` (borders)

Background treatment:

- Gradient mesh + subtle noise overlay (CSS-only, no image dependency)
- Photo mosaic uses a duotone/grain treatment (blend modes + contrast) so all photos feel cohesive

**Layout (desktop)**

1. Top bar: compact wordmark left, nav center/right (`Explore`, `Ask`, `About data`), `Sign in` on the far right.
2. Hero (full viewport height):
   - Primary element: giant search bar with three modes: `Search entities` | `Ask a question` | `Explore a case`
   - Under the search bar: *clickable example chips* (preloaded)
   - Right side (or behind): animated photo mosaic (collage grid) with duotone/grain
3. “Live Wire” strip:
   - Horizontal headline ticker (auto-scroll, pauses on hover/touch-hold)
   - Clicking a headline opens an in-app article card (title, excerpt, source, published_at, link out)
4. “Case Files” scrollytelling:
   - Two-column story
   - Left: sticky “viz stage” that morphs per scroll step
   - Right: narrative cards rail; each card activates a step
5. “Proof Shelf”:
   - Source tiles (FEC, Senate LDA, EDGAR, ProPublica, News) describing provenance/limitations
6. Final CTA:
   - `Open the graph` (to `/explore`)
   - `Save this investigation` (bookmark; requires auth)

**Interaction spec (scroll-driven changes)**

Implement a `ScrollStory` component:

- Sticky viz panel: `position: sticky; top: <header_height + 16px>`
- Step activation: `IntersectionObserver` (or `framer-motion` `useInView`) sets `activeStepId`
- Each step swaps at least:
  - Headline cluster (3–6 linked headlines relevant to the step)
  - Collage arrangement (different subset/order of images)
  - Mini visualization (Sankey preview, timeline, graph preview)
  - “Key finding” stat block (big number + one sentence)
- Story rail uses scroll snap: `scroll-snap-type: y mandatory` (and each card is `scroll-snap-align: start`)

Optional URL state:

- Update querystring without navigation: `?case=<id>&step=<stepId>` when steps change

**Preloaded clickable examples (hard requirement)**

Homepage shows *at least 12* example actions without typing:

- 6 search examples (entity-focused) -> `/search?q=...`
- 4 ask examples (question-focused) -> `/ask?q=...`
- 2 case files -> `/explore?case=...` (or scroll into “Case Files” and select)

**Content requirements (live-only)**

- 60+ headlines retrievable and cacheable in Supabase for the landing experience
- Headline cards should include: `title`, `url`, `source`, `published_at` (if available), `excerpt`, and optional `image_url`

Mobile behavior:

- Single column layout
- “Viz stage” becomes an inline panel inserted between cards (sticky disabled)

#### 7.2.2 Live-Only Mode (No Seeded/Mock Data)

This build does **not** use seeded/mock data. The landing page is always populated from live sources via the backend:

- Headlines: `GET /api/news/top?limit=60` (Perplexity Sonar search + canonical caching in Supabase)
- Case files: `GET /api/cases` and `GET /api/cases/{id}` (generated dynamically via Sonar and stored canonically in Supabase)
- Photos: derived from page metadata (e.g. `og:image`) and hotlinked initially; optionally proxy/cache later

**Degraded mode (required)**

If upstream services rate-limit or fail:

- UI shows an empty state + retry affordance.
- Backend returns the last-success cached records from Supabase (if available).
- The system never fabricates content.

#### 7.2.3 Search Results Page (`app/search/page.tsx`)

* Left sidebar facet filters: entity type, industry, state, date range, amount range
* Main content shows entity cards ranked by relevance
* Each card shows:

  * entity name
  * type badge
  * key stats (total donations, lobbying spend)
  * mini-graph preview of top 3 connections
* Clicking opens entity detail page

#### 7.2.4 Entity Detail Page (`app/entity/[id]/page.tsx`)

Full-width page with:

1. Hero header: entity name, type, key stats
2. Tabbed content:

   * Overview (AI-generated summary)
   * Donations (timeline + table)
   * Lobbying (issues lobbied on)
   * Votes (if politician)
   * Network (interactive graph)
   * News (sentiment-analyzed articles)
3. Right sidebar: Quick Stats panel

   * total $ raised
   * top 5 donors/recipients
   * party breakdown

#### 7.2.5 Graph Explorer (`app/explore/page.tsx`)

Full-screen interactive force-directed graph built with `react-force-graph-3d`.

* Nodes color-coded by type:

  * politicians = blue
  * companies = red
  * PACs = green
  * lobbyists = gold
* Edges show money flow with thickness proportional to amount
* Users can:

  * click nodes to expand connections
  * filter by relationship type
  * search within graph

This is the “wow factor” page for the hackathon demo.

### 7.3 Auth: Supabase (Google OAuth)

- Add `@supabase/supabase-js` to the Next.js app.
- Implement Google login with Supabase Auth.
- After login, send `Authorization: Bearer <access_token>` to backend for `/api/user/*` endpoints (saved queries, bookmarks, notes).

Example client setup:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Example Google sign-in:

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

### 7.4 Core Component: `NetworkGraph.tsx`

```tsx
'use client';
import { useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

const NODE_COLORS = {
  politician: '#4361EE',
  company: '#E63946',
  pac: '#2EC4B6',
  lobbyist: '#FFB703',
};

export function NetworkGraph({ data }) {
  const fgRef = useRef();

  const handleNodeClick = useCallback(node => {
    // Zoom to node and expand connections
    const distance = 120;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node, 3000
    );
  }, []);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeLabel='name'
      nodeColor={n => NODE_COLORS[n.type]}
      nodeRelSize={6}
      linkWidth={link => Math.log(link.amount / 10000 + 1)}
      linkColor={() => 'rgba(255,255,255,0.2)'}
      onNodeClick={handleNodeClick}
      backgroundColor='#0D1B2A'
    />
  );
}
```

### 7.5 Vercel Deployment

**`vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://openlobby-api.onrender.com"
  }
}
```

Deploy:

```bash
npm i -g vercel
vercel --prod
```

### 7.6 Acceptance Criteria (Demo Mode + Full Mode)

Landing page (live-only):

1. Homepage renders with zero backend/external network calls and shows:
   - 12+ clickable example chips
   - 60+ headlines accessible (ticker + “more headlines” section)
   - 30+ images rendered via `next/image` (all local paths)
2. Scrolling “Case Files”:
   - Changes the viz stage at least 6 times (distinct steps)
   - Optionally updates URL state: `?case=...&step=...` without a hard navigation
3. Clicking an example chip navigates to the correct route with the query prefilled.
4. Mobile:
   - Story becomes single-column
   - Sticky viz becomes inline between cards

Backend (when infra is enabled):

1. `/api/news/top` returns headline cards (live search + Supabase cache; never seeded).
2. `/api/search` uses hybrid Elasticsearch search as documented in Section 5.3.

---

## 8. LLM Prompts (XML-Structured, Production-Grade)

All prompts use XML structuring for reliability, following Anthropic and OpenAI best practices: explicit role definition, structured input/output schemas, few-shot examples, and chain-of-thought where needed.

### 8.1 Entity Extraction Prompt

Used by Modal LLM to extract structured entities from raw scraped text (lobbying filings, news articles, etc.).

```python
ENTITY_EXTRACTION_PROMPT = '''
<system>
You are a political finance data extraction specialist. Your job is to
extract structured entity and relationship data from raw text about
lobbying, campaign finance, and political influence.

You must output ONLY valid XML matching the schema below. Do not include
any text outside the XML tags.
</system>

<instructions>
  <task>
    Extract all entities (people, organizations, PACs, bills) and
    relationships (donations, lobbying, votes) from the provided text.
  </task>
  <rules>
    <rule>Every entity must have a name and type.</rule>
    <rule>Dollar amounts must be numeric (no $ sign, no commas).</rule>
    <rule>Dates must be ISO 8601 format (YYYY-MM-DD).</rule>
    <rule>If information is uncertain, set confidence="low".</rule>
    <rule>Do NOT hallucinate entities not present in the text.</rule>
  </rules>
  <output_schema>
    <entities>
      <entity type="politician|company|pac|lobbyist|bill">
        <name>Full Name</name>
        <party>R|D|I|null</party>
        <state>XX|null</state>
        <industry>Industry sector|null</industry>
      </entity>
    </entities>
    <relationships>
      <relationship type="donation|lobbying|vote|employment">
        <source>Source Entity Name</source>
        <target>Target Entity Name</target>
        <amount>Numeric amount or null</amount>
        <date>YYYY-MM-DD or null</date>
        <description>Brief description</description>
        <confidence>high|medium|low</confidence>
      </relationship>
    </relationships>
  </output_schema>
</instructions>

<examples>
  <example>
    <input>Pfizer spent $12.5 million lobbying Congress in 2024 Q1,
    focusing on Medicare drug pricing. Senator Bob Smith (R-TX) received
    $45,000 from Pfizer PAC and voted against the Drug Pricing Act.</input>
    <output>
      <entities>
        <entity type="company">
          <name>Pfizer</name>
          <industry>Pharmaceuticals</industry>
        </entity>
        <entity type="politician">
          <name>Bob Smith</name>
          <party>R</party>
          <state>TX</state>
        </entity>
        <entity type="pac">
          <name>Pfizer PAC</name>
          <industry>Pharmaceuticals</industry>
        </entity>
        <entity type="bill">
          <name>Drug Pricing Act</name>
        </entity>
      </entities>
      <relationships>
        <relationship type="lobbying">
          <source>Pfizer</source>
          <target>Congress</target>
          <amount>12500000</amount>
          <date>2024-03-31</date>
          <description>Lobbying on Medicare drug pricing</description>
          <confidence>high</confidence>
        </relationship>
        <relationship type="donation">
          <source>Pfizer PAC</source>
          <target>Bob Smith</target>
          <amount>45000</amount>
          <description>PAC contribution</description>
          <confidence>high</confidence>
        </relationship>
        <relationship type="vote">
          <source>Bob Smith</source>
          <target>Drug Pricing Act</target>
          <description>Voted against</description>
          <confidence>high</confidence>
        </relationship>
      </relationships>
    </output>
  </example>
</examples>

<input_text>
{text}
</input_text>

Extract all entities and relationships from the text above.
Output ONLY the XML, nothing else.
'''
```

### 8.2 Question Answering Prompt

Used when a user asks a natural language question. Context documents are retrieved from Elasticsearch first, then passed to the LLM.

```python
QA_PROMPT = '''
<system>
You are OpenLobby, a political finance analysis assistant. You answer
questions about campaign donations, lobbying expenditures, voting
records, and corporate political influence using ONLY the provided
context documents.

You are nonpartisan and factual. You cite specific dollar amounts,
dates, and sources when available. If the context does not contain
enough information to fully answer the question, say so explicitly.
</system>

<instructions>
  <task>Answer the user's question using the provided context.</task>
  <rules>
    <rule>Only use facts from the context documents below.</rule>
    <rule>Cite specific amounts and dates when available.</rule>
    <rule>If multiple sources conflict, note the discrepancy.</rule>
    <rule>Never fabricate data not in the context.</rule>
    <rule>Structure your answer with the key finding first,</rule>
    <rule>then supporting evidence, then caveats.</rule>
    <rule>Keep the answer concise (under 300 words).</rule>
  </rules>
</instructions>

<context_documents>
{context}
</context_documents>

<question>{question}</question>

Provide a clear, factual, well-sourced answer.
'''
```

### 8.3 Entity Summary Prompt

Generates human-readable summaries for entity detail pages.

```python
SUMMARY_PROMPT = '''
<system>
You are a political finance analyst writing brief entity profiles.
Write like an investigative journalist: factual, concise, compelling.
</system>

<instructions>
  <task>Write a 2-3 paragraph summary of this entity's political
  influence based on the data provided.</task>
  <rules>
    <rule>Lead with the most significant finding.</rule>
    <rule>Include specific dollar amounts.</rule>
    <rule>Mention key relationships (top donors/recipients).</rule>
    <rule>Note any potential conflicts of interest.</rule>
    <rule>Be nonpartisan. Present facts, not opinions.</rule>
    <rule>Maximum 150 words.</rule>
  </rules>
</instructions>

<entity_data>
{data}
</entity_data>

Write the summary now.
'''
```

### 8.4 News Sentiment Analysis Prompt

```python
SENTIMENT_PROMPT = '''
<system>
You are a media sentiment classifier specialized in political finance
reporting. Classify news articles about corporate-political
relationships.
</system>

<instructions>
  <task>Analyze the article and output structured sentiment data.</task>
  <output_format>
    <sentiment>positive|negative|neutral|mixed</sentiment>
    <entities_mentioned>
      <entity name="..." role="subject|target|mentioned" />
    </entities_mentioned>
    <key_claim>One-sentence summary of the main claim</key_claim>
    <confidence>high|medium|low</confidence>
  </output_format>
</instructions>

<article>
{article_text}
</article>

Output ONLY the XML, nothing else.
'''
```

---

## 9. Infrastructure Setup & Configuration

### 9.0 Deployment Levels (Minimum vs Full Stack)

This project is staged, but remains live-only (no seeded/mock content).

**Minimum to ship the live UI**

1. Render API (FastAPI) deployed with:
   - Perplexity Sonar (web search)
   - Supabase (canonical cache + case files)
   - Elasticsearch (derived index for search/RAG)
2. Vercel web app deployed with `NEXT_PUBLIC_API_URL`.

**Minimum to ship authenticated bookmarking**

1. Supabase project (DB + Auth).
2. Enable Google OAuth provider and redirect URLs.
3. Set Vercel env vars for Supabase public keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

**Full stack (matches this spec)**

1. Supabase (DB + Auth) + schema + RLS policies.
2. Render (FastAPI) + backend env vars.
3. Elastic Cloud + indices + API key.
4. JINA API key (embeddings).
5. Modal deploy + secrets (LLM extraction + QA).
6. Cloudflare Worker cron + ingest secret.
7. BrightData + webhook wiring.
8. Optional enrichers: ProPublica + FEC keys.

Ordering note:

- Frontend calls backend endpoints only (no local fixtures).
- Backend can start with news ingestion + document index; add deeper entity/relationship extraction later.

### 9.1 Service Signup Checklist

| Service            | What to Do                                                                                                                                            | Free Tier / Cost                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Vercel             | Sign up at `vercel.com`. Connect GitHub repo. Import Next.js project.                                                                                 | Free: 100GB bandwidth, serverless functions   |
| Render             | Sign up at `render.com`. Create new Web Service from GitHub. Set to Python runtime, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | Free: 750hrs/mo (spins down after inactivity) |
| Supabase           | Create project. Enable Google OAuth provider. Add redirect URLs. Create tables + RLS policies (Section 5.1).                                           | Free tier: generous for hackathon use         |
| Cloudflare Workers | Sign up at `dash.cloudflare.com`. Install Wrangler CLI: `npm i -g wrangler`. Run `wrangler login`.                                                    | Free: 100K requests/day, 10ms CPU time        |
| Elastic Cloud      | Sign up at `cloud.elastic.co`. Create deployment (select closest region). Copy Cloud ID and create API key.                                           | 14-day free trial, then ~$95/mo for basic     |
| JINA AI            | Go to `jina.ai`, create account, get API key. Free tier includes 1M tokens.                                                                           | Free: 1M tokens. Paid: from $0.02/1M tokens   |
| Modal              | `pip install modal && modal setup`. Authenticate via browser. Create huggingface secret for model access.                                             | Free: $30/mo compute credits                  |
| BrightData         | Sign up at `brightdata.com`. Create Web Scraper API dataset. Get API key from dashboard.                                                              | Free trial available, then pay-per-request    |
| FEC API            | Register at `api.data.gov` for API key. No approval needed.                                                                                           | Free, unlimited (rate limited to 1000/hr)     |
| ProPublica         | Request key at `propublica.org/datastore/api`. Usually instant.                                                                                       | Free: 5000 requests/day                       |

### 9.2 Render Configuration

**`render.yaml`**

```yaml
services:
  - type: web
    name: openlobby-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: ELASTIC_CLOUD_ID
        sync: false
      - key: ELASTIC_API_KEY
        sync: false
      - key: JINA_API_KEY
        sync: false
      - key: FEC_API_KEY
        sync: false
      - key: BRIGHTDATA_API_KEY
        sync: false
      - key: INGEST_SECRET
        generateValue: true
      - key: MODAL_TOKEN_ID
        sync: false
      - key: MODAL_TOKEN_SECRET
        sync: false
```

**`requirements.txt`**

```text
fastapi==0.115.0
uvicorn[standard]==0.30.0
supabase
python-jose[cryptography]
elasticsearch[async]==8.15.0
httpx==0.27.0
pydantic==2.9.0
python-dotenv==1.0.1
modal==0.67.0
beautifulsoup4==4.12.3
lxml==5.3.0
```

### 9.3 Cloudflare Workers Setup

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Create project
wrangler init openlobby-etl

# Set secrets
wrangler secret put INGEST_SECRET
wrangler secret put BRIGHTDATA_API_KEY

# Deploy
wrangler deploy

# Test cron locally
wrangler dev --test-scheduled
```

### 9.4 Elastic Cloud Setup

```bash
# 1. Create deployment at cloud.elastic.co
#    - Select 'Elasticsearch' template
#    - Choose region closest to Render deployment
#    - Copy the Cloud ID from the deployment page

# 2. Create API key:
#    Kibana > Stack Management > API Keys > Create API Key
#    Name: openlobby-backend
#    Role: superuser (for hackathon; scope down for prod)

# 3. Create indices via Kibana Dev Tools:
#    Paste the index mappings from Section 5.2

# 4. Verify connection:
curl -H 'Authorization: ApiKey YOUR_API_KEY' \
  'https://YOUR_CLOUD_ID.es.us-central1.gcp.cloud.es.io/_cat/indices'
```

---

## 10. Live Ingestion & Cache Strategy (No Seeded Data)

The product runs live-only. For hackathon reliability and speed, we cache the last-success results in Supabase and use Elasticsearch as a rebuildable derived index.

### 10.1 Live Bootstrap (First Run)

1. Call `POST /api/ingest/news` (protected by `INGEST_SECRET`) to populate `public.documents` from Perplexity Sonar results.
2. Index documents into Elasticsearch with Jina embeddings (derived).
3. Landing page reads `GET /api/news/top` (uses cache first, refresh on demand).
4. Call `GET /api/cases` to generate/store two default case files (AI regulation + drug pricing).

### 10.2 Ongoing Refresh

- Run a scheduled job (Render Cron or Worker) every 1–3 hours:
  - Refresh news cache (and reindex)
  - Regenerate case files daily or when topics materially shift

### 10.3 Failure Modes (Required)

- If Perplexity or fetch fails: return cached Supabase documents (if any).
- If Elasticsearch is down: `GET /api/search` returns empty results; landing and cases still work from Supabase.
- If Modal is down: `/api/ask` returns 503; UI shows a non-fabricated error state.

---

## 11. Hackathon Timeline (24-Hour Sprint)

| Hours | Phase           | Tasks                                                                                                                                             | Owner(s)     |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 0–2   | SETUP           | Create all accounts (Vercel, Render, Supabase, Elastic, JINA, Modal, Cloudflare, BrightData, FEC). Enable Supabase Auth (Google) + redirects.    | Full Team    |
| 2–4   | DATA LAYER      | Create Supabase schema + RLS. Seed 20–30 curated entities/relationships into Supabase. Create Elasticsearch indices (derived) + test hybrid search.| Backend Dev  |
| 2–4   | FRONTEND SHELL  | Next.js project setup. Tailwind config. Build layout, nav, SearchBar component. Deploy to Vercel.                                                 | Frontend Dev |
| 4–6   | MODAL LLM       | Write Modal app with vLLM. Test entity extraction prompt. Test QA prompt. Deploy to Modal.                                                        | ML Dev       |
| 4–6   | BRIGHTDATA      | Configure BrightData scrapers for OpenSecrets + news. Write Cloudflare Worker ETL. Test webhook flow.                                             | Backend Dev  |
| 6–10  | CORE FEATURES   | Wire up `/api/search`, `/api/ask`, `/api/graph` endpoints. Connect frontend to API. Build search results page + entity detail page.               | Full Team    |
| 10–14 | GRAPH VIZ       | Build NetworkGraph component with react-force-graph. Create MoneyFlow Sankey diagram. Style entity detail tabs.                                   | Frontend Dev |
| 10–14 | INGEST PIPELINE | End-to-end: BrightData scrape → Modal extract → upsert Supabase → JINA embed → Elasticsearch (derived) index. Test with real data.               | Backend Dev  |
| 14–18 | POLISH          | Responsive design. Loading states. Error handling. More demo data. Test all user flows.                                                           | Full Team    |
| 18–22 | DEMO PREP       | Record demo video. Write README. Prepare live demo script. Stress test.                                                                           | Full Team    |
| 22–24 | SUBMIT          | Final deploy. Submit to hackathon. Double-check all prize criteria.                                                                               | Full Team    |

---

## 12. Prize Alignment Matrix

| Prize                   | How We Hit It                                                                                                                                                                                            | Key Evidence                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Elasticsearch / Elastic | Deep implementation: custom index mappings, hybrid kNN + BM25 search, entity relationships stored as separate index with cross-references, semantic_text field type, aggregation queries for dashboards. | Two indices with dense_vector fields, hybrid search combining kNN and multi_match, faceted filtering, aggregations for stats.       |
| BrightData              | Core data ingestion layer. Scraping OpenSecrets org pages, Senate lobbying disclosures, and news articles. Using Web Scraper API with async batch processing + webhook delivery.                         | BrightData API calls in ETL pipeline, webhook integration with backend, multiple scraper configurations for different data sources. |
| Modal / NVIDIA          | Serverless GPU inference running open-source LLM (Mistral 7B via vLLM) for: entity extraction (NER), natural language QA with RAG, entity summarization, news sentiment analysis.                        | `modal_app.py` with GPU class, vLLM integration, 4 distinct LLM use cases, XML-structured prompts.                                  |
| Vercel                  | Full Next.js 14 app deployed on Vercel. Interactive UI with graph visualizations (react-force-graph), real-time search, responsive design. Vercel edge functions for API caching.                        | Production Next.js deployment, App Router, server components, edge middleware.                                                      |

---

## 13. Appendix: Environment Variables

### 13.1 Web App (`openlobby-web/.env.local`)

```bash
# Required: call backend API (Render in prod, localhost in dev)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: required for real accounts/bookmarks
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 13.2 API (`openlobby-api/.env` or Render env vars)

```bash
# Required (if running the API at all)
CORS_ALLOW_ORIGINS=http://localhost:3000,https://<your-vercel-domain>

# Supabase (canonical DB + Auth verification; required for user endpoints and canonical storage)
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Elasticsearch (required in this spec; derived index)
ELASTIC_CLOUD_ID=openlobby:dXMtY2VudHJhbDEuZ2...
ELASTIC_API_KEY=base64encodedkey...

# Embeddings (required for semantic/hybrid search)
JINA_API_KEY=jina_xxxxxxxxxxxxxxxx

# Internal auth (required for ingestion triggers/webhooks)
INGEST_SECRET=random_generated_secret

# Optional enrichers
FEC_API_KEY=your_api_data_gov_key
PROPUBLICA_API_KEY=your_propublica_key

# Optional (only if the API directly calls Modal)
MODAL_TOKEN_ID=ak-xxxxxxxx
MODAL_TOKEN_SECRET=as-xxxxxxxx

# Optional (only if running BrightData triggers from the API)
BRIGHTDATA_API_KEY=your_brightdata_key
```

### 13.3 Cloudflare Worker (wrangler secrets)

```bash
INGEST_SECRET=same_as_render_ingest_secret
BRIGHTDATA_API_KEY=your_brightdata_key
RENDER_API_URL=https://openlobby-api.onrender.com
```

### 13.4 Modal Secrets

```bash
modal secret create huggingface-secret \
  HUGGING_FACE_HUB_TOKEN=hf_xxxxxxxxxxxxxxxx
```

### 13.5 Content + Legal Assumptions

- Always link out to sources; avoid republishing full articles.
- Photos are sourced from page metadata (e.g. `og:image`). Consider proxy/caching only after confirming rights/terms.
- The system never seeds or fabricates news content; on failure it falls back to last-success cache in Supabase.

---

**End of Specification**

> Built for hackathon domination. Ship it.
