# Active Context

## Current Focus
Completing initial project scaffolding for backend (FastAPI) and frontend (Next.js with shadcn/ui) as per `projectbrief.md`. Preparing for environment setup and version control.

## Recent Changes & Decisions
*(Timestamp: 2025-05-17)*
- Memory Bank directory (`memory-bank/`) created.
- Core Memory Bank files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`) created and populated with initial information from `projectbrief.md`.
- Decision to manually create Memory Bank files due to issues with the `roo-code-memory-bank-mcp` tool's `initialize_memory_bank` function.
- **Backend Scaffolding:**
    - Created `/backend` directory.
    - Created `backend/main.py` with basic FastAPI app.
    - Created `backend/api/` directory.
    - Created `backend/api/upload.py` with stub upload endpoint and integrated mock ML call.
    - Updated `backend/main.py` to include the upload router (using relative import `.api.upload`).
    - Corrected import in `backend/api/upload.py` to use relative import `..ml_core.highlight` for the mock ML function.
    - Created `backend/ml_core/` directory.
    - Created `backend/ml_core/highlight.py` with a mock highlight extraction function.
    - Created `backend/db/` directory.
    - Created `backend/requirements.txt` with initial dependencies and added `python-multipart` to handle form data for file uploads.
- **Frontend Scaffolding:**
    - Initialized Next.js project in `/frontend` using `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir`.
    - Initialized `shadcn` in `/frontend` using `npx shadcn@latest init`. (Noted `shadcn-ui` is deprecated).
    - Installed `axios` and `@supabase/supabase-js` in frontend.
    - Created `frontend/src/app/page.tsx` with a basic file upload form and logic to call the backend.
    - Added shadcn/ui components (`button`, `input`, `card`, `alert`) to the frontend project to support `page.tsx`.

## Next Steps
Based on `projectbrief.md` and current progress:
1.  **Environment Setup:**
    -   Create a template `.env` file (e.g., `.env.example`) in the project root with placeholders for Supabase credentials (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`) and frontend public variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`).
2.  **Version Control:**
    -   Initialize Git repository (`git init`) if not already done by Next.js setup.
    -   Create a comprehensive `.gitignore` file for Python, Node.js, and OS-specific files.
    -   Make an initial commit of the scaffolded project.
3.  **Testing the Vertical Slice (Manual):**
    -   Set up Python virtual environment for backend: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`.
    -   Run backend dev server from project root: `python3 -m uvicorn backend.main:app --reload --app-dir .` (or `PYTHONPATH=. uvicorn backend.main:app --reload` if `--app-dir` is not available/preferred). This ensures `backend` is treated as a package.
    -   Run frontend dev server (`cd frontend && npm run dev`).
    -   Test video upload from frontend to backend and display of mock highlights.
4.  (Optional) Create `frontend/src/lib/supabase.ts` and `frontend/src/api.ts` if more structured client-side API/Supabase logic is desired.

## Blockers & Questions
- The `roo-code-memory-bank-mcp` tool's `initialize_memory_bank` function is not usable in its current state due to incorrect path handling. Workaround: manual file creation.

## Important Patterns & Preferences
Derived from `projectbrief.md`:
- **Stack:** FastAPI (Backend), Supabase (DB), Next.js/App Router + TailwindCSS + shadcn/ui (Frontend).
- **Separation of Concerns:** Backend and frontend must be kept separated.
- **Mocking:** Mock ML and DB functionalities initially for rapid development and vertical slice.
- **Secrets Management:** Never leak secrets; use `.env` files.
- **Modularity:** ML logic in `/ml_core`. API endpoints in `/api`. DB logic in `/db`.
- **Hackathon Principles:** Ship vertical slice, use TODOs for future work.

## Learnings & Insights
- The `shadcn-ui` CLI package is deprecated; `shadcn@latest` is the current command.
- `npx shadcn@latest init` and `npx shadcn@latest add <component>` may prompt for handling React 19 peer dependency issues if using npm; selecting `--force` allows installation to proceed.
- The `UPLOAD_DIRECTORY = "./uploaded_videos"` in `backend/api/upload.py` will be created relative to where the backend server is run. If Uvicorn is run from the project root, this path will be `highlight-website/uploaded_videos`. If run from `backend/`, it will be `highlight-website/backend/uploaded_videos`. The current `upload.py` code will create it in `backend/uploaded_videos` because of the `os.makedirs` call within that file, which uses a path relative to the file's location if not absolute.
- Python import paths within the `backend` module should be relative (e.g., `from .api.upload import router`, `from ..ml_core.highlight import ...`).
- To correctly run Uvicorn with these relative imports and ensure the `backend` directory is treated as a package, the server should be started from the project root directory (e.g., `highlight-website/`) using a command like `python3 -m uvicorn backend.main:app --reload --app-dir .`. This makes the project root the starting point for module resolution.
- FastAPI requires `python-multipart` to be installed for handling form data (file uploads). This was added to `requirements.txt`.

*(This file is dynamic and should be updated frequently, ideally after each significant work session or decision.)*
