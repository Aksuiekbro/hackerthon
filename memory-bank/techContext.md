# Technical Context

## Core Technologies
Based on `projectbrief.md`:
- **Backend:** Python (FastAPI)
- **Frontend:** TypeScript (Next.js with App Router, React), TailwindCSS, shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, OAuth - auth optional for MVP)
- **ML Core:** Python (.py or .ipynb in `/ml_core`) - specific libraries TBD (e.g., OpenCV, MoviePy, audio processing libs, ML/DL frameworks if used)
- **DevOps/Tooling:** Git. Docker is mentioned as optional in `.clinerules`.

## Development Environment Setup
As per `projectbrief.md` "Quickstart":
- **Backend (FastAPI):**
  ```bash
  # In project root, assuming backend will be in ./backend
  python3 -m venv backend/venv 
  source backend/venv/bin/activate 
  # (pip install will be based on requirements.txt, to be created)
  # pip install fastapi uvicorn[standard] asyncpg sqlalchemy supabase
  # (cd backend && uvicorn main:app --reload)
  ```
- **Frontend (Next.js + Tailwind + shadcn):**
  ```bash
  # In project root
  npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir # Adapted from .clinerules, projectbrief is simpler
  cd frontend
  npx shadcn-ui@latest init
  npm install axios @supabase/supabase-js # From .clinerules, good additions
  # npm run dev
  ```
- **Supabase:**
  - Create project at [supabase.com](https://supabase.com)
  - Obtain Database URL, anon key, and service role key.

## Key Libraries & Dependencies
Based on `projectbrief.md` "Quickstart" and `.clinerules`:
- **Backend (Python):**
  - `fastapi`: Core web framework.
  - `uvicorn[standard]`: ASGI server.
  - `asyncpg`: Async PostgreSQL driver (for Supabase).
  - `sqlalchemy`: ORM (optional, but often used with Supabase/Postgres).
  - `supabase`: Official Supabase Python client.
  - `openai`: Mentioned in `.clinerules`, potentially for future ML integration.
- **Frontend (Node.js/TypeScript):**
  - `next`: React framework.
  - `react`, `react-dom`: UI library.
  - `tailwindcss`: CSS framework.
  - `shadcn-ui` (and its dependencies like `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`): UI components.
  - `axios`: For HTTP requests to the backend.
  - `@supabase/supabase-js`: Official Supabase JS client for frontend interactions (DB & Auth).
- **Python ML Libraries:** (To be defined, examples from template: OpenCV, MoviePy, Transformers, PyTorch/TensorFlow)

## API Endpoints
Initial endpoints as per `projectbrief.md` "What to Build First?":
- `POST /backend/api/upload`: To upload a video file. (Initially a stub)
- (Conceptual) `GET /backend/api/highlights/{video_id}`: To retrieve highlights. (May be part of upload response initially)
FastAPI will provide auto-generated Swagger/OpenAPI docs at `/docs` and `/redoc`.

## Environment Variables
Essential variables for `.env` files (likely one in project root or separate for backend/frontend):
- **Backend (`.env` in project root or `/backend/.env`):**
  - `DATABASE_URL`: Supabase PostgreSQL connection string (e.g., `postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB`).
  - `SUPABASE_URL`: URL of your Supabase project.
  - `SUPABASE_KEY`: Supabase service_role key (for backend admin operations).
- **Frontend (`frontend/.env.local`):**
  - `NEXT_PUBLIC_SUPABASE_URL`: Public URL of your Supabase project.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for your Supabase project.
  - `NEXT_PUBLIC_API_URL`: URL of the FastAPI backend (e.g., `http://localhost:8000`).

## Coding Conventions & Style Guides
- **Frontend:** Next.js project initialized with ESLint. Prettier is commonly used with Next.js/TailwindCSS.
- **Backend:** Python conventions (PEP 8). Tools like Black (formatter) and Flake8 (linter) are recommended.
- Specific project conventions to be defined as needed.

## Known Technical Constraints or Challenges
- **Initial Mocking:** ML core and potentially DB interactions will be mocked initially to speed up development of the vertical slice.
- **Secret Management:** Strict separation of frontend/backend concerns, ensuring no secrets are leaked to the frontend.
- **Scalability of ML Core:** If real ML processing is time-consuming, asynchronous task handling (e.g., Celery, FastAPI background tasks) will be needed later.

*(This file should provide a quick technical overview for anyone joining or revisiting the project.)*
