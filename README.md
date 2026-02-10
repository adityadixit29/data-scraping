# Scalable Job Importer

Job import system: fetch from external XML APIs → queue with Redis/BullMQ → worker imports into MongoDB → Import History UI.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### 1. Backend (server)

```bash
cd server
cp .env.example .env
# Edit .env: MONGODB_URI, REDIS_URL, PORT (default 4000)
npm install
npm run dev
```

In a **second terminal**, run the worker:

```bash
cd server
npm run worker
```

### 2. Frontend (client)

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the **Import History** screen.

### 3. Trigger an import

- Click **Trigger import (all feeds)** in the UI, or
- `curl -X POST http://localhost:4000/api/imports/trigger`

Feeds are also queued automatically **every hour** via cron.

## Hosting / Deployment

The backend has two parts: **API server** (Express) and **worker** (BullMQ consumer). You can run them in one process or two.

### Option A: Single process (easiest for one host)

Run both API and worker in the same deployment:

```bash
cd server
npm run start:all
```

Set your host’s **start command** to `npm run start:all` (or `node src/index.js` and `node src/worker.js` via a process manager). One app = one URL, and the worker runs in the same container/dyno.

- **Render:** Web Service → Build: `npm install` → Start: `npm run start:all`
- **Railway / Fly.io / etc.:** Start command: `npm run start:all`

Use **MongoDB Atlas** and **Redis Cloud** (or the host’s Redis) and set `MONGODB_URI`, `REDIS_URL`, and `PORT` in the host’s environment.

### Option B: Two processes (better for scaling)

1. **Web service** – Start: `npm start` (API only). This serves HTTP and enqueues jobs.
2. **Worker service** – Start: `npm run worker`. This processes the queue.

On **Render**: create a “Background Worker” and set Start to `npm run worker`.  
On **Heroku**: add a worker dyno: `worker: npm run worker` in Procfile.  
Both need the same `MONGODB_URI` and `REDIS_URL`.

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/job-importer` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CONCURRENCY` | Worker concurrency | `5` |
| `NEXT_PUBLIC_API_URL` | Backend URL for client (optional) | `http://localhost:4000` (via Next rewrites) |

## API

- `GET /api/imports/history?page=1&limit=20&fileName=...` – Paginated import logs
- `POST /api/imports/trigger` – Enqueue all configured feeds (body: `{ "urls": [] }` optional)
- `GET /api/imports/feeds` – List feed URLs
- `GET /health` – Health check

## Project layout

```
/client          # Next.js admin UI (Import History)
/server          # Express API + cron + queue definitions
  /src
    /config      # Feed URLs
    /models      # Job, ImportLog (Mongoose)
    /queue       # BullMQ queue + Redis
    /routes      # /api/imports
    /services    # fetchJobs (XML → JSON)
    index.js     # Express + cron
    worker.js    # BullMQ worker (run separately, or use start:all)
/docs
  architecture.md
```

## Tests

From repo root:

```bash
cd server && npm test   # if tests are added
```

See [docs/architecture.md](docs/architecture.md) for design and scaling notes.
