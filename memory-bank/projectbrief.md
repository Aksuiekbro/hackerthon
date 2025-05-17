--- 
description: "Kickstart rules and project brief for building an AI-powered video highlights web app with FastAPI backend, Supabase database, and Next.js + Tailwind + shadcn/ui frontend. Includes structure, stack, and first tasks."
author: "Cline (AI Assistant)"
version: "0.1"
tags: ["fastapi", "supabase", "nextjs", "tailwind", "shadcn", "react", "ml", "guide", "hackathon", "workflow"]
globs: ["/backend/", "/frontend/", "/backend/ml_core/", ".env", "requirements.txt", "docker-compose.yml"]
---

# AI Video Highlights — FastAPI + Supabase + Next.js/Tailwind/shadcn Starter

**Objective:**  
Build an AI-powered platform that finds and shows the best moments in videos.  
Stack:  
- **Backend:** FastAPI (Python), ML core (.py or .ipynb in `/ml_core`)
- **DB:** Supabase (Postgres), user auth (OAuth) — optional at MVP
- **Frontend:** Next.js (App Router), TailwindCSS, shadcn/ui

---

## Project Structure

```

/backend
main.py         # FastAPI entrypoint
/api            # All REST endpoints
/ml_core        # ML & video analysis logic (even if just a stub)
/db             # DB logic (Supabase, ORM, etc)
requirements.txt

/frontend
package.json
tailwind.config.js
/src
/components
/app         # For Next.js App Router
/ui          # shadcn/ui components
.env

```

---

## Quickstart

1. **Backend (FastAPI):**
    - Set up virtualenv:  
      `python3 -m venv venv && source venv/bin/activate`
    - Install deps:  
      `pip install fastapi uvicorn[standard] asyncpg sqlalchemy supabase`
    - Start dev server:  
      `uvicorn main:app --reload`

2. **Frontend (Next.js + Tailwind + shadcn):**
    - Init app:  
      `npx create-next-app frontend --typescript --tailwind`
    - Add shadcn/ui:  
      `npx shadcn-ui@latest init`
    - Start dev server:  
      `cd frontend && npm run dev`

3. **Supabase:**
    - [Create project](https://supabase.com)
    - Get DB URL, anon key, and put them in `.env`

---

## What to Build First?

- **/backend/api/upload:** POST endpoint to upload video (can be a stub for now)
- **/backend/ml_core/highlight.py:**  
  Mock function that "extracts highlights" (return timestamps, dummy captions)
- **/frontend/src/app/page.tsx:**  
  Simple file upload form, send to `/upload`, display highlights

---

## Cline Guidance

- Cline (AI Assistant) SHOULD use this rule for generating code, troubleshooting, onboarding, or expanding features.
- Cline SHOULD ask for clarification if ML logic or API isn’t defined yet.
- Cline MUST keep backend and frontend separated, never leak secrets.
- Cline SHOULD suggest mocking ML and DB if you’re not ready with them.

---

## Hackathon Tips

- Mock anything that blocks you.
- Ship vertical slice (upload video → see fake highlight).
- Write TODOs in code where you plan to plug in real AI/ML logic.

---

**If you’re joining the team, clone the repo, follow this guide, and ping if you’re stuck!**

---

*Ready to vibe and code. Just ask for more details if you get stuck!*
