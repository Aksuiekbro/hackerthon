import os
import uuid
import yt_dlp # Use yt-dlp
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..ml_core.highlight import extract_highlights

router = APIRouter()

# Define DOWNLOAD_DIR relative to the backend directory structure
# This assumes the backend server is run from the project root
# and 'backend' is in PYTHONPATH or --app-dir is used.
CURRENT_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Navigate up two levels (from backend/api to project_root) then into backend/downloads
# This ensures it's always backend/downloads relative to the backend package
DOWNLOAD_DIR = os.path.join(os.path.dirname(CURRENT_SCRIPT_DIR), "downloads")

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

class YouTubeRequest(BaseModel):
    url: str

@router.post("/youtube/highlights", tags=["YouTube Processing"])
async def download_and_highlight_ytdlp(data: YouTubeRequest):
    url = data.url
    if not url:
        raise HTTPException(status_code=400, detail="YouTube URL cannot be empty.")

    video_filename = f"{uuid.uuid4()}.mp4"
    # Ensure output_template uses a path relative to where yt-dlp will be "run" from
    # or an absolute path. Since DOWNLOAD_DIR is absolute or correctly relative, this should be fine.
    output_template = os.path.join(DOWNLOAD_DIR, video_filename)
    
    # yt-dlp options
    # Forcing mp4 can sometimes fail if a native mp4 isn't available in the chosen quality.
    # 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' is a robust format selector.
    # 'postprocessors' can be used to convert to mp4 if needed, but adds complexity (ffmpeg dependency).
    # For simplicity, we'll try to get an mp4 directly.
    # Using a format string less likely to require merging if ffmpeg is not present.
    ydl_opts = {
        'format': 'best[ext=mp4]/best', # Prefer best single MP4 file, fallback to overall best
        'outtmpl': output_template,
        'noplaylist': True,       # Download only the single video
        'quiet': True,            # Suppress yt-dlp console output
        'no_warnings': True,
        # 'verbose': True, # Uncomment for debugging yt-dlp issues
    }

    downloaded_file_path = None # Initialize to ensure it's defined

    try:
        print(f"Processing YouTube URL with yt-dlp: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False) # First get info
            video_title = info_dict.get('title', 'Unknown Title')
            
            # Check if a direct mp4 format is available, otherwise yt-dlp might download something else
            # and we'd need a postprocessor to convert.
            # For this version, we rely on yt-dlp finding an mp4.
            
            print(f"Downloading video: {video_title}")
            ydl.download([url]) # Perform download
            
            # yt-dlp might add format suffix to filename if not mp4, or if title is used in template.
            # Since we use a UUID.mp4, it should be fairly predictable.
            # The `prepare_filename` method is safer if `outtmpl` uses template strings like %(title)s.
            # With a fixed output_template like ours, the path should be `output_template`.
            downloaded_file_path = output_template 
            if not os.path.exists(downloaded_file_path):
                # Fallback if filename was altered by yt-dlp (e.g. if it wasn't mp4 and it saved as .mkv etc)
                # This is a simple check; more robust would be to parse ydl.prepare_filename(info_dict)
                # or check info_dict for actual downloaded filename if possible.
                # For now, assume output_template is the correct path if download succeeded.
                # A common issue: if format is not mp4, it saves as e.g. .mkv, then this path is wrong.
                # Let's try to find the downloaded file if exact match fails.
                possible_files = [os.path.join(DOWNLOAD_DIR, f) for f in os.listdir(DOWNLOAD_DIR) if f.startswith(str(uuid.UUID(video_filename.split('.')[0])))]
                if possible_files:
                    downloaded_file_path = possible_files[0] # take the first match
                    print(f"Adjusted downloaded file path to: {downloaded_file_path}")
                else: # if still not found
                    raise HTTPException(status_code=500, detail=f"Downloaded file not found at expected path: {output_template} or similar.")

    except yt_dlp.utils.DownloadError as e:
        print(f"yt-dlp DownloadError: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download video with yt-dlp: {str(e)}")
    except Exception as e:
        print(f"Error during YouTube processing with yt-dlp: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred with yt-dlp: {str(e)}")

    if not downloaded_file_path or not os.path.exists(downloaded_file_path):
         raise HTTPException(status_code=500, detail="File was not downloaded or path is incorrect.")

    try:
        print(f"Extracting highlights from: {downloaded_file_path}")
        highlights = extract_highlights(downloaded_file_path)
        print(f"Highlights extracted: {highlights}")
        # os.remove(downloaded_file_path) # Optionally delete
        # print(f"Deleted downloaded file: {downloaded_file_path}")
        return {"video_title": video_title, "highlights": highlights, "download_path": downloaded_file_path}
    except Exception as e:
        print(f"Error during highlight extraction: {e}")
        # if os.path.exists(downloaded_file_path): # Optionally delete on error
        #     os.remove(downloaded_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to extract highlights: {str(e)}")
