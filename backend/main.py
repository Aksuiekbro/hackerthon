from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import uuid
import os
import sys # Import sys module
from pathlib import Path
import shutil # Add shutil
from pydantic import BaseModel, HttpUrl, Field, root_validator # Add root_validator
from typing import Literal, Optional # Add Optional

PYTHON_EXECUTABLE = sys.executable

app = FastAPI(
    title="AI Video Highlights API",
    description="API for uploading videos and getting AI-generated highlights.",
    version="0.1.0",
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory

# Define the path to the outputs directory (relative to main.py)
outputs_dir = Path(__file__).resolve().parent.parent / "outputs"
# Create the directory if it doesn't exist
outputs_dir.mkdir(parents=True, exist_ok=True)

# Define the path to the uploaded videos directory (relative to main.py)
project_root_for_uploads = Path(__file__).resolve().parent.parent
UPLOADED_VIDEOS_DIR = project_root_for_uploads / "uploaded_videos"
# Create the directory if it doesn't exist
UPLOADED_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

# Now mount it
app.mount("/static/outputs", StaticFiles(directory=outputs_dir), name="static_outputs")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AI Video Highlights API"}

@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": "pong"}

@app.post("/upload/video/")
async def upload_video_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    original_filename = file.filename
    extension = Path(original_filename).suffix
    # Basic validation for video types, can be expanded
    if extension.lower() not in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv']: # Added more common video types
        raise HTTPException(status_code=400, detail=f"Invalid file type: {extension}. Please upload a video file.")

    unique_filename = f"{uuid.uuid4()}{extension}"
    save_path = UPLOADED_VIDEOS_DIR / unique_filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        # Log the exception e if you have a logger configured
        # print(f"Error saving file: {e}") # For debugging
        raise HTTPException(status_code=500, detail=f"Could not save file: {original_filename}. Error: {str(e)}")
    finally:
        await file.close() # Use await for async file closing

    return {
        "message": "File uploaded successfully",
        "server_file_path": str(save_path.relative_to(project_root_for_uploads))
        # This path is relative to the project root, e.g., "uploaded_videos/xyz.mp4"
    }

class MotionRequest(BaseModel):
    video_url: Optional[HttpUrl] = None
    server_file_path: Optional[str] = None # Path relative to project root

    @root_validator(pre=False, skip_on_failure=True) # Use pre=False if HttpUrl parsing is okay
    def check_one_source_provided(cls, values):
        url, path = values.get('video_url'), values.get('server_file_path')
        if bool(url) == bool(path): # True if both are None or both are set
            raise ValueError("Exactly one of 'video_url' or 'server_file_path' must be provided.")
        return values

# Pydantic model for text processing request
class TextProcessRequest(BaseModel):
    video_url: Optional[HttpUrl] = None
    server_file_path: Optional[str] = None # Path relative to project root
    num_clips: int = Field(default=3, ge=1, description="Number of clips to generate per platform")
    max_duration_yt: int = Field(default=59, ge=10, le=60, description="Max duration for YouTube shorts in seconds")
    target_format: Literal["youtube", "instagram", "both"] = "both"

    @root_validator(pre=False, skip_on_failure=True)
    def check_one_source_provided(cls, values):
        url, path = values.get('video_url'), values.get('server_file_path')
        if bool(url) == bool(path):
            raise ValueError("Exactly one of 'video_url' or 'server_file_path' must be provided.")
        return values
# Pydantic model for transcription request
class TranscriptionRequest(BaseModel):
    server_video_file_path: str # Path relative to project root (e.g., "outputs/motion_model_outputs/job_id/video.mp4")
    output_format: Literal["txt", "srt", "vtt", "tsv", "json"] = "txt"
    model_name: Optional[str] = "base" # e.g., tiny, base, small, medium, large

# Base directory for text model outputs (relative to this file: backend/main.py)
# This constant isn't strictly used at module level in the provided snippet,
# but defined as per instructions. It's effectively used to construct paths inside the endpoint.
TEXT_OUTPUTS_BASE_DIR = Path("../outputs/text_model_outputs")

@app.post("/process/motion/")
async def process_motion_video(request: MotionRequest):
    job_id = str(uuid.uuid4())
    
    project_root = Path(__file__).resolve().parent.parent
    # Base directory for all motion model outputs, relative to project root
    motion_outputs_root = project_root / "outputs" / "motion_model_outputs"
    
    # Unique output directory for this specific job
    absolute_output_dir_for_job = motion_outputs_root / job_id
    absolute_output_dir_for_job.mkdir(parents=True, exist_ok=True)

    # Path to the motion processor script
    # Assuming motion_model is at the project root, and this main.py is in backend/
    absolute_script_path = project_root / "backend" / "motion_model" / "motion_processor.py"

    input_source_for_script = None
    if request.video_url:
        input_source_for_script = str(request.video_url)
    elif request.server_file_path:
        absolute_file_path = project_root / request.server_file_path
        if not absolute_file_path.exists() or not absolute_file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Provided server_file_path does not exist or is not a file: {request.server_file_path}")
        input_source_for_script = str(absolute_file_path)

    command = [
        PYTHON_EXECUTABLE, # Changed from "python"
        str(absolute_script_path),
        input_source_for_script,   # This is now either URL or absolute file path
        str(absolute_output_dir_for_job) # The script will create its content inside this dir
    ]

    try:
        # Using subprocess.run for simplicity, consider asyncio.create_subprocess_exec for non-blocking
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=600) # 10 min timeout
    except subprocess.CalledProcessError as e:
        print(f"Error during motion processing script execution for job {job_id}:")
        print(f"Command: {' '.join(map(str, command))}")
        print(f"Return code: {e.returncode}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Motion processing script failed. Stderr: {e.stderr}")
    except subprocess.TimeoutExpired as e:
        print(f"Motion processing script timed out for job {job_id}:")
        print(f"Command: {' '.join(map(str, command))}")
        # stdout/stderr might be bytes, decode them
        stdout_decoded = e.stdout.decode(errors='ignore') if isinstance(e.stdout, bytes) else e.stdout
        stderr_decoded = e.stderr.decode(errors='ignore') if isinstance(e.stderr, bytes) else e.stderr
        print(f"Stdout: {stdout_decoded}")
        print(f"Stderr: {stderr_decoded}")
        raise HTTPException(status_code=504, detail="Motion processing timed out.")
    except FileNotFoundError:
        # This error means either 'python' command is not found or the script_path is incorrect.
        print(f"Motion processing script or Python interpreter not found for job {job_id}. Script path: {absolute_script_path}")
        raise HTTPException(status_code=500, detail=f"Motion processing script not found at {str(absolute_script_path)} or Python interpreter not in PATH.")
    except Exception as e: # Catch any other unexpected errors
        print(f"An unexpected error occurred during motion processing for job {job_id}: {str(e)}")
        print(f"Command: {' '.join(map(str, command))}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during motion processing: {str(e)}")

    generated_files = []
    # The motion_processor.py script might create a subdirectory within absolute_output_dir_for_job.
    # We need to list all files recursively in absolute_output_dir_for_job.
    for root_dir, _, files_in_dir in os.walk(absolute_output_dir_for_job):
        for file_name in files_in_dir:
            full_path = Path(root_dir) / file_name
            try:
                # Make path relative to project_root/outputs for the response
                # e.g., "motion_model_outputs/{job_id}/file.mp4"
                relative_path = full_path.relative_to(motion_outputs_root.parent) # parent is 'outputs'
                generated_files.append(str(relative_path))
            except ValueError:
                # Fallback if the path structure is not as expected (e.g., not under motion_outputs_root.parent)
                # This might happen if absolute_output_dir_for_job was outside the expected 'outputs' structure
                # For robustness, make it relative to the job directory and then prepend a known base.
                relative_to_job_dir = full_path.relative_to(absolute_output_dir_for_job)
                generated_files.append(str(Path("motion_model_outputs") / job_id / relative_to_job_dir))
            
    if not generated_files and result.stdout: # Check stdout if no files found, for debugging
        print(f"Job {job_id} completed but no files found in {absolute_output_dir_for_job}. Script stdout: {result.stdout}")

    return {
        "job_id": job_id,
        "output_base_directory": str(Path("outputs") / "motion_model_outputs" / job_id), # Relative to project root
        "generated_files": generated_files,
        "stdout": result.stdout, # For debugging, can be removed or logged differently later
        "stderr": result.stderr  # For debugging
    }

@app.post("/process/text/")
async def process_text_video(request: TextProcessRequest):
    job_id = str(uuid.uuid4())
    
    project_root = Path(__file__).resolve().parent.parent
    absolute_script_path = project_root / "backend" / "text_model" / "process_shorts.py"
    
    # absolute_output_dir is derived from project_root, consistent with motion model
    # TEXT_OUTPUTS_BASE_DIR is effectively project_root / "outputs" / "text_model_outputs"
    absolute_output_dir = project_root / "outputs" / "text_model_outputs" / job_id
    absolute_output_dir.mkdir(parents=True, exist_ok=True)

    input_source_for_script = None
    if request.video_url:
        input_source_for_script = str(request.video_url)
    elif request.server_file_path:
        absolute_file_path = project_root / request.server_file_path
        if not absolute_file_path.exists() or not absolute_file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Provided server_file_path does not exist or is not a file: {request.server_file_path}")
        input_source_for_script = str(absolute_file_path)

    # Base command
    command = [
        PYTHON_EXECUTABLE, # Changed from "python"
        str(absolute_script_path),
        "--output", str(absolute_output_dir),
        "--clips", str(request.num_clips),
        "--max-duration", str(request.max_duration_yt),
        "--format", request.target_format
    ]
    # Add either --url or --input_file_path to the command
    if request.video_url:
        command.extend(["--url", input_source_for_script]) # input_source_for_script is the URL string
    elif request.server_file_path:
        # process_shorts.py expects --input_file_path with the path
        command.extend(["--input_file_path", input_source_for_script]) # input_source_for_script is the absolute file path

    try:
        # Consider a longer timeout for text processing + transcription
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=900) # 15 min timeout
    except subprocess.CalledProcessError as e:
        # Ensure stdout/stderr are strings, even if None or bytes
        stdout_str = e.stdout.decode(errors='ignore') if isinstance(e.stdout, bytes) else str(e.stdout) if e.stdout is not None else ""
        stderr_str = e.stderr.decode(errors='ignore') if isinstance(e.stderr, bytes) else str(e.stderr) if e.stderr is not None else ""
        
        error_detail = "Text processing script failed."
        if stdout_str: error_detail += f" STDOUT: {stdout_str}"
        if stderr_str: error_detail += f" STDERR: {stderr_str}"
        
        print(f"Error during text processing script execution for job {job_id}:")
        print(f"Command: {' '.join(map(str, command))}")
        print(f"Return code: {e.returncode}")
        if stdout_str: print(f"Stdout: {stdout_str}")
        if stderr_str: print(f"Stderr: {stderr_str}")
        raise HTTPException(status_code=500, detail=error_detail)
    except subprocess.TimeoutExpired as e:
        stdout_decoded = e.stdout.decode(errors='ignore') if isinstance(e.stdout, bytes) else str(e.stdout) if e.stdout is not None else ""
        stderr_decoded = e.stderr.decode(errors='ignore') if isinstance(e.stderr, bytes) else str(e.stderr) if e.stderr is not None else ""
        
        detail_message = "Text processing timed out after 15 minutes."
        if stdout_decoded: detail_message += f" STDOUT: {stdout_decoded}"
        if stderr_decoded: detail_message += f" STDERR: {stderr_decoded}"
        
        print(f"Text processing script timed out for job {job_id}:")
        print(f"Command: {' '.join(map(str, command))}")
        if stdout_decoded: print(f"Stdout: {stdout_decoded}")
        if stderr_decoded: print(f"Stderr: {stderr_decoded}")
        raise HTTPException(status_code=504, detail=detail_message)
    except FileNotFoundError:
        print(f"Text processing script or Python interpreter not found for job {job_id}. Script path: {absolute_script_path}")
        raise HTTPException(status_code=500, detail=f"Text processing script not found at {str(absolute_script_path)} or Python interpreter not in PATH.")
    except Exception as e: # Catch any other unexpected errors
        print(f"An unexpected error occurred during text processing for job {job_id}: {str(e)}")
        print(f"Command: {' '.join(map(str, command))}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during text processing: {str(e)}")

    generated_files = []
    outputs_root_for_relative_paths = project_root / "outputs" # Base for making paths relative
    
    for root_dir_str, _, files_in_dir in os.walk(absolute_output_dir):
        root_dir_path = Path(root_dir_str)
        for file_name in files_in_dir:
            full_path = root_dir_path / file_name
            try:
                # Make path relative to project_root/outputs for the response
                # e.g., "text_model_outputs/{job_id}/file.mp4"
                relative_path_to_outputs_root = full_path.relative_to(outputs_root_for_relative_paths)
                generated_files.append(str(relative_path_to_outputs_root))
            except ValueError: # pragma: no cover
                # Fallback if path is not under outputs_root_for_relative_paths (should not happen with correct setup)
                # This might happen if absolute_output_dir was outside the expected 'outputs' structure
                # For robustness, make it relative to the job directory and then prepend a known base.
                relative_to_job_dir = full_path.relative_to(absolute_output_dir)
                generated_files.append(str(Path("text_model_outputs") / job_id / relative_to_job_dir))
            
    if not generated_files and result.stdout: # Check stdout if no files found, for debugging
        print(f"Job {job_id} (text) completed but no files found in {absolute_output_dir}. Script stdout: {result.stdout}")

    return {
        "job_id": job_id,
        "output_base_directory": f"outputs/text_model_outputs/{job_id}", # Relative to project root
        "generated_files": generated_files,
        "stdout": result.stdout # For debugging
    }

@app.post("/transcribe/video/")
async def transcribe_video_endpoint(request: TranscriptionRequest):
    project_root = Path(__file__).resolve().parent.parent
    absolute_video_path = project_root / request.server_video_file_path

    if not absolute_video_path.is_file():
        raise HTTPException(status_code=404, detail=f"Video file not found: {request.server_video_file_path}")

    # Output directory for the transcript will be the same as the video's directory
    transcript_output_dir = absolute_video_path.parent
    # The script itself will create the output dir if it doesn't exist, based on its logic.

    transcribe_script_path = project_root / "backend" / "ml_core" / "transcribe_video.py"
    if not transcribe_script_path.is_file():
        raise HTTPException(status_code=500, detail="Transcription script not found.")

    command = [
        PYTHON_EXECUTABLE,
        str(transcribe_script_path),
        str(absolute_video_path),
        str(transcript_output_dir), # Script will save file here
        "--output_format", request.output_format,
        "--model_name", request.model_name or "base" # Pass model_name or default
    ]

    try:
        # Transcription can be lengthy
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=1800) # 30 min timeout
        
        output_lines = result.stdout.strip().split('\n')
        transcript_file_path_str = None
        # Try to find the path from "Saving transcript to: <path>"
        for line in reversed(output_lines):
            if line.startswith("Saving transcript to: "):
                transcript_file_path_str = line.replace("Saving transcript to: ", "").strip()
                break
        
        # Fallback: if not found, assume the script prints only the path as the last non-empty line
        if not transcript_file_path_str:
            for line in reversed(output_lines):
                if line.strip(): # Check for non-empty line
                    potential_path = Path(line.strip())
                    # A basic check: if it's an absolute path and exists.
                    # This is still a bit fragile. The script should ideally be more predictable.
                    if potential_path.is_absolute() and potential_path.exists() and potential_path.is_file():
                         # Check if it's within the expected output directory structure for safety
                        if transcript_output_dir in potential_path.parents:
                            transcript_file_path_str = str(potential_path)
                            break
                    # If it's not absolute, try resolving it against project_root (less likely for script output)
                    elif not potential_path.is_absolute():
                        resolved_potential_path = project_root / potential_path
                        if resolved_potential_path.exists() and resolved_potential_path.is_file():
                            if transcript_output_dir in resolved_potential_path.parents:
                                transcript_file_path_str = str(resolved_potential_path)
                                break
        
        if not transcript_file_path_str or not Path(transcript_file_path_str).is_file():
            print(f"Transcription script stdout: {result.stdout}")
            print(f"Transcription script stderr: {result.stderr}")
            raise HTTPException(status_code=500, detail="Transcription completed but output path not found or file not created from stdout.")

        # Make path relative to project root for the response
        relative_transcript_path = Path(transcript_file_path_str).relative_to(project_root)

    except subprocess.CalledProcessError as e:
        error_detail = f"Transcription script failed. STDERR: {e.stderr}"
        if e.stdout: error_detail += f" STDOUT: {e.stdout}"
        raise HTTPException(status_code=500, detail=error_detail)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Transcription timed out after 30 minutes.")
    except Exception as e: # Catch any other unexpected errors
        print(f"An unexpected error occurred during transcription: {str(e)}")
        print(f"Command: {' '.join(map(str, command))}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during transcription: {str(e)}")
    
    return {
        "message": "Transcription successful",
        "transcript_file_path": str(relative_transcript_path),
        "stdout_preview": result.stdout[:500] # For debugging, preview of stdout
    }
# API routers
from api.upload import router as upload_router
# from .api import highlights_router # Example for future highlights-specific endpoints

app.include_router(upload_router, prefix="/api")
# app.include_router(highlights_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    import os # Add os import
    port = int(os.environ.get("PORT", 8000)) # Get port from environment or default to 8000
    uvicorn.run(app, host="0.0.0.0", port=port)
