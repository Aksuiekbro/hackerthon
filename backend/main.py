from fastapi import FastAPI

app = FastAPI(
    title="AI Video Highlights API",
    description="API for uploading videos and getting AI-generated highlights.",
    version="0.1.0",
)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AI Video Highlights API"}

# API routers
from .api.upload import router as upload_router  # Changed to relative import
# from .api import highlights_router # Example for future highlights-specific endpoints

app.include_router(upload_router, prefix="/api")
# app.include_router(highlights_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
