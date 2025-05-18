# AI-Powered Video Highlights Web App

An AI-powered video highlights web app using FastAPI, Supabase, Next.js, TailwindCSS, and shadcn/ui. This project aims to provide a seamless experience for generating highlights from videos, leveraging a modern tech stack for scalability and a beautiful user interface.

## Demo Video

[Watch the Demo Video](https://www.youtube.com/watch?v=p6MYhU97MSY)

## Example Output

Check out an example of a generated highlight video:
[./test_output/highlight_final-5.mp4](./test_output/highlight_final-5.mp4)

---

## Project Structure

```
/backend
    main.py
    /api
    /ml_core
    /db
    requirements.txt
/frontend
    package.json
    tailwind.config.js
    /src
        /app
        /components
        /lib
        /ui    # shadcn components live here
.env
```

---

## Backend: FastAPI + Supabase

### 1. Init backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] asyncpg sqlalchemy supabase openai
```

### 2. .env Example

```
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_KEY=your_anon_or_service_role_key
```

### 3. Example FastAPI API (`backend/main.py`)

```python
from fastapi import FastAPI, UploadFile, File
# Assuming these modules exist as per the .clinerules structure
# from backend.ml_core.highlight import extract_highlights
# from backend.db.video import save_video, get_highlights

app = FastAPI()

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    # video_id = await save_video(file) # Placeholder
    # return {"video_id": video_id} # Placeholder
    return {"message": "Upload endpoint placeholder"}


@app.get("/highlights/{video_id}")
async def get_video_highlights(video_id: str):
    # highlights = await get_highlights(video_id) # Placeholder
    # return highlights # Placeholder
    return {"message": f"Highlights for {video_id} placeholder"}
```

---

## Frontend: Next.js + TailwindCSS + shadcn/ui

### 1. Init Next.js + TailwindCSS

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npx shadcn-ui@latest init
npm install axios @supabase/supabase-js
```

### 2. Example API calls (`frontend/src/api.ts`)

```ts
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const uploadVideo = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API_URL}/upload`, formData);
};

export const getHighlights = (video_id: string) =>
  axios.get(`${API_URL}/highlights/${video_id}`);
```

### 3. Supabase Auth Example

* In `frontend/src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

* See [Supabase + Next.js quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs) for login.

### 4. UI Structure (w/ shadcn/ui)

* Use shadcn/ui components for all inputs, buttons, modals, cards, etc.
* Examples:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function VideoUpload() {
  // ...file upload logic
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold mb-2">Upload Your Video</h2>
        {/* shadcn Button */}
        <Button>Choose File</Button>
      </CardContent>
    </Card>
  );
}
```

* TailwindCSS powers layout/styling — shadcn/ui handles beautiful, production-ready components with full customization.

---

## Hackathon Principles

* **Mock what isn’t ready** (ML, DB, Auth)
* **Code clear & modular:** API in FastAPI, UI in Next.js + shadcn/ui, ML in `/ml_core/`
* **Use shadcn/ui everywhere for modern UI/UX**
* **Keep secrets out of public repo**
* **Update README as you go**

---