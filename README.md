# AI-Powered CRM

Full-stack CRM with a React + Redux Toolkit frontend and a FastAPI + PostgreSQL backend.
An automation layer creates follow-up tasks and updates lead scores, so reps do less manual work.

## Features
- Customers, deals (pipeline stages) and tasks, all through REST endpoints
- Automation: welcome task for new customers, stage-based follow-up tasks, lead scoring, idle-deal sweep
- "Next action" insight per customer (uses Groq if `GROQ_API_KEY` is set, otherwise rule-based)
- Dashboard with an automation meter: automated tasks vs. manual tasks, computed from real data
- `X-Process-Time-ms` header on every API response for latency checks

## Run it

**1. Database** (needs Docker; or use your own Postgres and edit `.env`)
```bash
docker compose up -d
```

**2. Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
python -m app.seed               # optional demo data
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**3. Frontend** (Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

No Docker? Set `DATABASE_URL=sqlite:///./crm.db` in `backend/.env` to try it with SQLite.

## API
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/customers` | List (`?search=`, `?status=`) / create |
| GET/PUT/DELETE | `/api/customers/{id}` | Read / update / delete |
| POST | `/api/customers/{id}/insight` | Next-best-action suggestion |
| GET/POST | `/api/deals` | List / create |
| PATCH | `/api/deals/{id}/stage` | Move stage (triggers automation) |
| GET/POST | `/api/tasks` | List / create |
| PATCH/DELETE | `/api/tasks/{id}` | Mark done / delete |
| GET | `/api/dashboard` | Totals, stage stats, automation share |
| POST | `/api/automation/run` | Create tasks for deals idle 7+ days |

## Structure
```
backend/app   main.py, models.py, schemas.py, automation.py, ai.py, routers/, seed.py
frontend/src  store.js, features/ (Redux slices), components/
```
