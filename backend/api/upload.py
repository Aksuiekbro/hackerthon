from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os
from ..ml_core.highlight import extract_highlights_mock # Import the mock function, changed to relative

router = APIRouter()

# Define a directory to store uploads temporarily or permanently
# For a hackathon, a simple local directory might suffice.
# Ensure this directory exists or is created.
UPLOAD_DIRECTORY = "./uploaded_videos" 
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@router.post("/upload", tags=["Video Upload"])
async def upload_video(file: UploadFile = File(...)):
    """
    Stub endpoint to upload a video file.
    In a real scenario, this would save the file, process it (e.g., trigger ML),
    and store metadata.
    For now, it just simulates saving the file and returns a mock response.
    """
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video.")

    file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
    
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        file.file.close()

    # Call the mock ML core function
    # In a real application, this might be an async task or a call to a separate service
    highlights_data = extract_highlights_mock(video_path=file_location, video_id=file.filename)
    
    return highlights_data

# To integrate this router into the main app (in backend/main.py):
# from .api.upload import router as upload_router
# app.include_router(upload_router, prefix="/api")
