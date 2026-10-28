# DataDesk backend — run instructions (Phase 1: dataset ingestion)

## Prerequisites
- Node.js 22 LTS (verified: v22.19.0) and npm.
- Optional: MongoDB Community Server 7 (`mongo:7`, digest pinned in `tasks.md`/`memory.md`) for registration. The API boots in degraded mode without it: `GET /api/health` reports `mongodb: unavailable` and uploads return `503 mongodb_unavailable`.
- Optional: a WebHDFS NameNode (Apache Hadoop 3.5.0) for real byte storage; without it the `WebHdfsDatasetStore` cannot promote bytes. Tests use an in-memory store, so no services are required to run the test suite.

## Install (pinned dependencies, never `latest`)
```powershell
cd packages/backend
npm ci
```
Dependencies are pinned exactly in `package.json` and locked in `package-lock.json` (committed). Dev-only tooling vulnerabilities were resolved by pinning `vitest@5.0.5` (0 vulnerabilities via `npm audit`).

## Configure
```powershell
copy .env.example .env
# edit .env with local values (never commit .env)
```
Key settings:
- `PORT`/`HOST` — API bind (loopback `127.0.0.1` by default).
- `MONGODB_URI` / `MONGODB_DB` — MongoDB 7.
- `MAX_UPLOAD_BYTES` — configurable upload size limit (default 100 MB).
- `WEBHDFS_BASE` / `WEBHDFS_USER` — WebHDFS NameNode; the backend passes `?user.name=<user>` per the verified WebHDFS flow (`memory.md` §8e).

## Run
```powershell
# dev (watch)
npm run dev

# start (bound to HOST:PORT, loopback by default)
npm start

# type check
npm run typecheck

# tests (unit + upload logic; no services required)
npm test
```

## API (Phase 1)
- `GET /api/health` — readiness; `200` when MongoDB is reachable, `503 degraded` otherwise. No secrets in the body.
- `POST /api/datasets` — `multipart/form-data` with a `file` part (`.csv` or `.jsonl`) and optional `displayName`. Streams bytes to a unique staging file while computing SHA-256 and exact size, runs bounded CSV/JSONL validation, enforces the duplicate policy (same checksum + byte size → `409`, existing version returned, bytes stored once), then promotes to an immutable managed path under `/datadesk/datasets/<id>/v<n>/` and finalizes the MongoDB version record as `stored` (or `failed` on error). Only this upload's staging bytes are ever removed.

## Notes
- Real MongoDB / WebHDFS integration tests are **blocked** in this environment (no MongoDB or NameNode running; unrelated Docker containers must not be touched). They are reported in the task summary, and the store/repository are designed so the real drivers swap in directly.
- `.env`, `node_modules/`, `dist/` are gitignored; `package-lock.json` is committed for reproducible installs.
