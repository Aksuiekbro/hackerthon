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
## Наши ИИ Модели

### Модель Анализа Движения (Motion Model)

*   **Назначение:** Обнаружение сцен с высокой активностью и динамичным движением в видео.
*   **Уникальность/Креативность:** Модель использует библиотеку OpenCV для анализа видеопотока. Она вычисляет разницу между последовательными кадрами ([`cv2.absdiff`](motion_model/motion_processor.py:68)) после применения размытия по Гауссу ([`cv2.GaussianBlur`](motion_model/motion_processor.py:62)) для снижения шума. На основе этих различий рассчитываются "оценки движения" для каждого кадра. Интервалы с высокой активностью определяются, когда оценки движения превышают динамически рассчитанный порог (среднее значение + 0.2 * стандартное отклонение всех оценок - см. [`detect_motion_intervals`](motion_model/motion_processor.py:52)). Близкорасположенные активные интервалы объединяются для создания более связных хайлайтов ([`merge_intervals`](motion_model/motion_processor.py:95)).
*   **Почему это ИИ:** Модель демонстрирует элементы ИИ через распознавание образов в визуальных данных (идентификация значимого движения на основе изменений пикселей) и принятие решений (выбор сегментов для хайлайтов) на основе вычисленной интенсивности движения и адаптивных пороговых значений.

### Текстовая Модель (Text Model)

*   **Назначение:** Транскрибирование речи из видео и идентификация ключевых сегментов на основе диалогов и других контекстульных признаков.
*   **Уникальность/Креативность:** Основой модели является OpenAI Whisper ([`whisper.load_model("base").transcribe(video_path)`](text_model/process_video.py:441-443), также используется в [`backend/ml_core/transcribe_video.py`](backend/ml_core/transcribe_video.py:12)) для преобразования речи в текст. "Креативность" заключается в многофакторной системе оценки сегментов транскрипции для отбора наиболее интересных моментов. Эта система учитывает:
    *   Аудио пики, обнаруженные с помощью `librosa` ([`librosa.util.peak_pick`](text_model/process_video.py:112)), указывающие на эмоциональные или громкие моменты.
    *   Наличие ключевых слов (например, "главное", "вопрос", "итог").
    *   Смены сцен, определяемые `scenedetect.ContentDetector` ([`detect_scenes`](text_model/process_video.py:85)), которые могут коррелировать со сменой тем.
    *   Оптимальную длительность сегмента.
    *   Присутствие вопросительных или восклицательных знаков в тексте.
    Логика скоринга реализована в функции [`compute_score_enhanced`](text_model/process_video.py:130).
*   **Почему это ИИ:** Модель применяет ИИ в нескольких аспектах:
    *   Преобразование речи в текст (ASR) с помощью продвинутой модели Whisper.
    *   Элементы понимания естественного языка (NLU) через анализ ключевых слов и пунктуации.
    *   Принятие решений на основе комплексной системы оценок, которая объединяет лингвистические, акустические и визуальные (смена сцен) сигналы для выбора наиболее релевантных сегментов видео.

## Использование API в Проекте

### Внутренние API Бэкенда

Основные эндпоинты определены в [`backend/main.py`](backend/main.py:1) и файлах внутри [`backend/api/`](backend/api):

*   **`/upload/video/`** (POST, [`backend/main.py`](backend/main.py:55)): Загружает видеофайл на сервер. Сохраняет файл в директорию [`uploaded_videos/`](uploaded_videos).
*   **`/process/motion/`** (POST, [`backend/main.py`](backend/main.py:121)): Обрабатывает видео (по URL или пути на сервере) с использованием "Модели Анализа Движения" ([`motion_model/motion_processor.py`](motion_model/motion_processor.py:1)) для генерации хайлайтов на основе движения. Результаты сохраняются в уникальную директорию внутри [`outputs/motion_model_outputs/`](outputs/motion_model_outputs).
*   **`/process/text/`** (POST, [`backend/main.py`](backend/main.py:210)): Обрабатывает видео (по URL или пути на сервере) с использованием "Текстовой Модели" (скрипт [`text_model/process_video.py`](text_model/process_video.py:1) был проанализирован, хотя в [`main.py`](backend/main.py:215) указан `process_shorts.py`) для создания хайлайтов на основе транскрипции и анализа текста. Результаты сохраняются в уникальную директорию внутри [`outputs/text_model_outputs/`](outputs/text_model_outputs).
*   **`/transcribe/video/`** (POST, [`backend/main.py`](backend/main.py:315)): Транскрибирует видеофайл, уже находящийся на сервере, с помощью OpenAI Whisper. Использует скрипт [`backend/ml_core/transcribe_video.py`](backend/ml_core/transcribe_video.py:1).
*   **`/youtube/highlights`** (POST, роутер из [`backend/api/youtube.py`](backend/api/youtube.py:1) подключен в `main.py`): Загружает видео с YouTube с помощью `yt-dlp` и извлекает хайлайты (использует [`extract_highlights`](backend/api/youtube.py:96) из `ml_core.highlight`).

### Вызовы API со Стороны Фронтенда

Фронтенд взаимодействует с бэкенд API через функции, определенные в основном в [`frontend/src/api/`](frontend/src/api):

*   **[`frontend/src/api/processing.ts`](frontend/src/api/processing.ts:1):**
    *   [`uploadVideoFileAPI`](frontend/src/api/processing.ts:44): Вызывает `/upload/video/` для загрузки файлов.
    *   [`callProcessMotionAPI`](frontend/src/api/processing.ts:18): Вызывает `/process/motion/` для запуска анализа движения.
    *   [`callProcessTextAPI`](frontend/src/api/processing.ts:24): Вызывает `/process/text/` для запуска текстового анализа.
    *   [`callTranscribeVideoAPI`](frontend/src/api/processing.ts:61): Вызывает `/transcribe/video/` для транскрибации.
*   **[`frontend/src/api/youtube.ts`](frontend/src/api/youtube.ts:1):**
    *   [`getYoutubeHighlights`](frontend/src/api/youtube.ts:16): Вызывает `/youtube/highlights` для обработки YouTube ссылок.

В целом, фронтенд использует библиотеку `axios` для отправки POST-запросов на бэкенд. Передаются данные, такие как URL видео, пути к файлам на сервере или данные форм. В ответ обычно получается JSON с информацией о статусе задачи, ID задачи или путями к сгенерированным файлам.

### Внешние API и Сервисы

*   **OpenAI Whisper:** Используется "Текстовой Моделью" ([`text_model/process_video.py`](text_model/process_video.py:441-443) и [`backend/ml_core/transcribe_video.py`](backend/ml_core/transcribe_video.py:12)) для высококачественного преобразования речи в текст.
*   **Supabase:** Согласно `.clinerules`, Supabase используется для базы данных и аутентификации. Бэкенд может взаимодействовать с Supabase для хранения информации о пользователях, метаданных видео и сгенерированных хайлайтах. Фронтенд использует [`@supabase/supabase-js`](frontend/src/lib/supabase.ts:1) для аутентификации.
*   **YouTube (через `yt-dlp`):** Бэкенд использует утилиту `yt-dlp` (например, в [`backend/api/youtube.py`](backend/api/youtube.py:54) и [`motion_model/motion_processor.py`](motion_model/motion_processor.py:47)) для скачивания видео с YouTube. `yt-dlp` в свою очередь взаимодействует с внутренними API YouTube.