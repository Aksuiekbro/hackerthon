#!/usr/bin/env python3
import os
import sys
import json
import ssl
import argparse
import logging # Added
import numpy as np
import librosa
import whisper
import yt_dlp
import certifi
import cv2
from scenedetect import open_video, SceneManager
from scenedetect.detectors import ContentDetector
from moviepy.editor import VideoFileClip, vfx
from PIL import Image, ImageDraw, ImageFont

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,  # Or logging.DEBUG for more verbosity
    format='%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
    handlers=[logging.StreamHandler()] # Ensures logs go to stdout/stderr
)

# Fix SSL certificate verification issue on macOS
try:
    # Set environment variables for SSL certificates
    os.environ['SSL_CERT_FILE'] = certifi.where()
    os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
    # Also use unverified context as a fallback
    ssl._create_default_https_context = ssl._create_unverified_context
    logging.info(f"Using SSL certificates from: {certifi.where()}")
except Exception as e:
    logging.warning(f"Warning: Could not set SSL context: {e}")

# Default settings (will be overridden by command-line arguments)
OUTPUT_DIR = os.path.join(os.getcwd(), "highlight_clips")
NUM_CLIPS = 5
MERGE_CLIPS = True
GENERATE_BOTH_FORMATS = True  # Whether to generate both landscape and portrait versions
EXTRACT_FRAMES = True  # Whether to extract screenshot frames

# Target dimensions for screenshot frames
INSTAGRAM_FRAME_WIDTH = 1080
INSTAGRAM_FRAME_HEIGHT = 1350  # 4:5 aspect ratio for Instagram
LANDSCAPE_FRAME_WIDTH = 1920
LANDSCAPE_FRAME_HEIGHT = 1080  # 16:9 aspect ratio
PORTRAIT_FRAME_WIDTH = 1080
PORTRAIT_FRAME_HEIGHT = 1920  # 9:16 aspect ratio

BASE_DIR = os.getcwd()

def download_from_url(url, output_dir=None):
    """Downloads a video from a URL using yt-dlp."""
    logging.debug(f"Entering download_from_url with url: {url}, output_dir: {output_dir}")
    if output_dir is None:
        output_dir = BASE_DIR
    
    logging.info(f"Downloading video from URL: {url}")
    
    # Set up yt-dlp options
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': os.path.join(output_dir, 'downloaded_video.%(ext)s'),
        'quiet': False,
        'no_warnings': False,
        'ignoreerrors': False,
        'nocheckcertificate': True,  # Skip certificate validation
    }
    
    # The client_certificate option was causing issues, removed it
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            output_path = ydl.prepare_filename(info)
            logging.debug(f"Exiting download_from_url, returning: {output_path}")
            return output_path
    except Exception as e:
        logging.error(f"Error downloading video: {e}")
        logging.debug(f"Exiting download_from_url, returning: None")
        return None

def detect_scenes(video_path):
    """Detects scene boundaries in a video file."""
    logging.debug(f"Entering detect_scenes with video_path: {video_path}")
    try:
        video = open_video(video_path)
        scene_manager = SceneManager()
        scene_manager.add_detector(ContentDetector(threshold=30.0))
        scene_manager.detect_scenes(frame_source=video)
        scenes_list = scene_manager.get_scene_list()
        scenes_data = [(s[0].get_seconds(), s[1].get_seconds()) for s in scenes_list]
        logging.debug(f"Exiting detect_scenes, returning {len(scenes_data)} scenes")
        return scenes_data
    except Exception as e:
        logging.error(f"Scene detection error: {e}")
        logging.debug(f"Exiting detect_scenes, returning empty list due to error")
        return []


def get_audio_peaks(video_path):
    """Extracts audio peaks from a video file."""
    logging.debug(f"Entering get_audio_peaks with video_path: {video_path}")
    temp_audio = os.path.join(BASE_DIR, "temp_audio.wav")
    try:
        logging.debug(f"Attempting to extract audio to {temp_audio} using ffmpeg.")
        os.system(f"ffmpeg -i '{video_path}' -q:a 0 -map a '{temp_audio}' -y -loglevel error") # Changed quiet to error
        y, sr = librosa.load(temp_audio, sr=None)
        energy = librosa.feature.rms(y=y)[0]
        peaks = librosa.util.peak_pick(
            x=energy,
            pre_max=50, post_max=50,
            pre_avg=50, post_avg=50,
            delta=0.05, wait=10
        )
        peak_times = [round(p * 512 / sr, 2) for p in peaks]
        logging.debug(f"Exiting get_audio_peaks, returning {len(peak_times)} peaks")
        return peak_times
    except Exception as e:
        logging.error(f"Audio peak extraction error: {e}")
        logging.debug(f"Exiting get_audio_peaks, returning empty list due to error")
        return []
    finally:
        if os.path.exists(temp_audio):
            os.remove(temp_audio)


def compute_score_enhanced(segment, peaks, keywords, scenes):
    """Scores a transcription segment for highlight selection."""
    logging.debug(f"Entering compute_score_enhanced for segment: {segment.get('text', '')[:50]}...")
    score = 0
    start, end, text = segment['start'], segment['end'], segment['text']
    if any(start - 0.5 <= p <= end + 0.5 for p in peaks):
        score += 1
    score += sum(text.lower().count(k.lower()) * 2 for k in keywords)
    if any(abs(start - s[0]) < 1 for s in scenes):
        score += 1.5
    duration = end - start
    score += 0.5 if 3 <= duration <= 20 else -0.5 if duration < 3 or duration > 30 else 0
    if '?' in text or '!' in text:
        score += 0.5
    logging.debug(f"Exiting compute_score_enhanced with score: {score}")
    return score


def add_subtitles_pillow(frame, segments, current_time, frame_size,
                         text_color=(255,255,255), bg_color=(0,0,0,180),
                         font_size=40, stroke_color=(0,0,0), stroke_width=2,
                         subtitle_position=("center", 0.75)):  # Changed from 0.85 to 0.75 to position subtitles higher
    """Overlays subtitles onto a video frame using Pillow."""
    img = Image.fromarray(frame)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
    
    w, h = frame_size
    # For 9:16 format, we need to ensure text fits within the middle 60-70% of the width
    # to avoid being cut off at the edges when cropped
    max_text_width = int(w * 0.7)  # Use 70% of the frame width as max text width
    
    for seg in segments:
        if seg['start'] <= current_time < seg['end']:
            text = seg['text'].strip()
            if not text:
                continue
                
            # Wrap text to ensure it fits within the safe area
            words = text.split()
            lines = []
            current_line = ""
            
            for word in words:
                test_line = current_line + " " + word if current_line else word
                bbox = draw.textbbox((0,0), test_line, font=font)
                test_width = bbox[2] - bbox[0]
                
                if test_width <= max_text_width:
                    current_line = test_line
                else:
                    lines.append(current_line)
                    current_line = word
            
            if current_line:
                lines.append(current_line)
                
            # Calculate total height for all lines
            line_height = font_size * 1.2
            total_text_height = len(lines) * line_height
            
            # Draw each line of text
            y_start = h * subtitle_position[1] - total_text_height/2
            
            for i, line in enumerate(lines):
                bbox = draw.textbbox((0,0), line, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                x = (w - text_w) / 2  # Center the text
                y = y_start + i * line_height
                
                # Draw background
                draw.rectangle([x-10, y-5, x+text_w+10, y+text_h+5], fill=bg_color)
                
                # Draw stroke (outline)
                for dx in (-stroke_width, stroke_width):
                    for dy in (-stroke_width, stroke_width):
                        draw.text((x+dx, y+dy), line, font=font, fill=stroke_color)
                        
                # Draw the text
                draw.text((x, y), line, font=font, fill=text_color)
    
    return np.array(img)


def crop_to_aspect_ratio(clip, target_aspect=(9, 16)):
    """Crops the clip to the target aspect ratio."""
    original_width, original_height = clip.size
    original_aspect_ratio = original_width / original_height
    target_aspect_ratio = target_aspect[0] / target_aspect[1]

    if original_aspect_ratio > target_aspect_ratio:
        # Video is too wide - crop width
        target_width = original_height * target_aspect_ratio
        x_center = original_width / 2
        x1 = x_center - target_width / 2
        x2 = x_center + target_width / 2
        return vfx.crop(clip, x1=int(x1), x2=int(x2))
    elif original_aspect_ratio < target_aspect_ratio:
        # Video is too tall - crop height
        target_height = original_width / target_aspect_ratio
        y_center = original_height / 2
        y1 = y_center - target_height / 2
        y2 = y_center + target_height / 2
        return vfx.crop(clip, y1=int(y1), y2=int(y2))
    return clip


def convert_to_compatible_format(input_file, output_file=None):
    """
    Convert video to a format compatible with most players:
    - Even dimensions with pad
    - yuv420p pixel format
    - h264 video codec
    - aac audio codec
    - Fast start for web playback
    """
    if output_file is None:
        base, ext = os.path.splitext(input_file)
        output_file = f"{base}_compatible{ext}"
    
    ffmpeg_cmd = (
        f"ffmpeg -i '{input_file}' "
        f"-c:v libx264 -preset fast "
        f"-vf 'pad=ceil(iw/2)*2:ceil(ih/2)*2' "
        f"-pix_fmt yuv420p "
        f"-c:a aac "
        f"-movflags +faststart "
        f"-y '{output_file}'"
    )
    
    logging.debug(f"Entering convert_to_compatible_format for input: {input_file}, output: {output_file}")
    logging.info(f"Attempting to convert {input_file} to compatible format at {output_file}")
    try:
        os.system(ffmpeg_cmd + " -loglevel error") # Added loglevel
        result_path = output_file if os.path.exists(output_file) else None
        if result_path:
            logging.info(f"Successfully converted video to {result_path}")
        else:
            logging.error(f"Failed to convert video {input_file} to {output_file}")
        logging.debug(f"Exiting convert_to_compatible_format, returning: {result_path}")
        return result_path
    except Exception as e:
        logging.error(f"Error converting video {input_file}: {e}")
        logging.debug(f"Exiting convert_to_compatible_format, returning: None due to error")
        return None


def crop_frame_to_aspect_ratio(frame_array, target_w, target_h):
    """
    Resizes and crops a frame (numpy array HxWxC) to target width and height.
    """
    img_h, img_w = frame_array.shape[:2]
    if img_h == 0 or img_w == 0:
        logging.warning(f"Invalid input frame dimensions ({img_w}x{img_h}). Skipping frame.")
        return None

    target_aspect = target_w / target_h
    img_aspect = img_w / img_h

    if img_aspect > target_aspect:  # Image is wider than target aspect
        scale_factor = target_h / img_h
        resized_w = int(img_w * scale_factor)
        resized_h = target_h
    else:  # Image is taller or same aspect as target
        scale_factor = target_w / img_w
        resized_w = target_w
        resized_h = int(img_h * scale_factor)
    
    if resized_w <= 0 or resized_h <= 0:
        logging.warning(f"Invalid resize dimensions ({resized_w}x{resized_h}). Skipping frame.")
        return None
        
    logging.debug(f"Resizing frame from {img_w}x{img_h} to {resized_w}x{resized_h}")
    resized_frame = cv2.resize(frame_array, (resized_w, resized_h), interpolation=cv2.INTER_AREA)

    crop_x = max(0, (resized_w - target_w) // 2)
    crop_y = max(0, (resized_h - target_h) // 2)
    
    # Ensure the crop area does not exceed the resized frame dimensions
    actual_crop_w = min(target_w, resized_w - crop_x)
    actual_crop_h = min(target_h, resized_h - crop_y)

    cropped_frame = resized_frame[crop_y:crop_y + actual_crop_h, crop_x:crop_x + actual_crop_w]

    # If the crop is not the exact target size (e.g. source smaller than target), resize to target
    if cropped_frame.shape[0] != target_h or cropped_frame.shape[1] != target_w:
        cropped_frame = cv2.resize(cropped_frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
    return cropped_frame

def extract_frames_from_highlights(video_path, highlights, output_dir,
                                  frame_formats=["instagram", "landscape", "portrait"],
                                  frames_per_segment=3):
    logging.debug(f"Entering extract_frames_from_highlights for {len(highlights)} highlights, output_dir: {output_dir}, formats: {frame_formats}")
    """
    Extract frames from highlight segments in various formats.
    
    Args:
        video_path: Path to the original video
        highlights: List of highlight segments with start/end times
        output_dir: Base directory to save extracted frames
        frame_formats: List of formats to extract (instagram, landscape, portrait)
        frames_per_segment: Number of frames to extract from each segment
    """
    if not highlights:
        logging.info("No highlights to extract frames from.")
        logging.debug("Exiting extract_frames_from_highlights, no highlights provided.")
        return []
    
    # Create output directories for each format
    frame_dirs = {}
    for format_name in frame_formats:
        format_dir = os.path.join(output_dir, f"{format_name}_frames")
        os.makedirs(format_dir, exist_ok=True)
        frame_dirs[format_name] = format_dir
    
    logging.info(f"Extracting frames from {len(highlights)} highlight clips...")
    
    try:
        video = VideoFileClip(video_path)
    except Exception as e:
        logging.error(f"Error opening video for frame extraction: {e}")
        logging.debug("Exiting extract_frames_from_highlights due to video open error.")
        return []
    
    extracted_frames = []
    
    for i, clip in enumerate(highlights):
        start_time = clip.get('start', 0)
        end_time = clip.get('end', 0)
        duration = end_time - start_time
        
        if duration <= 0:
            logging.warning(f"Segment {i+1} has zero or negative duration ({duration:.2f}s). Skipping frame extraction for this segment.")
            continue
        
        # Calculate time points for frame extraction (evenly spaced)
        time_points = [
            start_time + duration * (j + 1) / (frames_per_segment + 1)
            for j in range(frames_per_segment)
        ]
        
        for j, time_point in enumerate(time_points):
            try:
                # Get frame at specified time point (in RGB format)
                frame_rgb = video.get_frame(time_point)
                
                # Convert from RGB to BGR for OpenCV
                frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
                
                # Process and save frame in each requested format
                for format_name in frame_formats:
                    if format_name == "instagram":
                        target_w, target_h = INSTAGRAM_FRAME_WIDTH, INSTAGRAM_FRAME_HEIGHT
                    elif format_name == "landscape":
                        target_w, target_h = LANDSCAPE_FRAME_WIDTH, LANDSCAPE_FRAME_HEIGHT
                    elif format_name == "portrait":
                        target_w, target_h = PORTRAIT_FRAME_WIDTH, PORTRAIT_FRAME_HEIGHT
                    else:
                        continue
                    
                    # Crop and resize frame to target aspect ratio
                    processed_frame = crop_frame_to_aspect_ratio(frame_bgr, target_w, target_h)
                    
                    if processed_frame is not None:
                        # Save frame to file
                        output_path = os.path.join(
                            frame_dirs[format_name],
                            f"highlight_{i+1:02d}_frame_{j+1:02d}.jpg"
                        )
                        logging.debug(f"Attempting to save frame: {output_path}")
                        cv2.imwrite(output_path, processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                        logging.debug(f"Successfully saved frame: {output_path}")
                        
                        # Add to extracted frames list
                        extracted_frames.append({
                            "highlight_index": i+1,
                            "frame_index": j+1,
                            "format": format_name,
                            "time": time_point,
                            "file": output_path
                        })
            except Exception as e:
                logging.error(f"Error extracting frame from segment {i+1} at time {time_point:.2f}s for format {format_name}: {e}")
    
    video.close()
    
    logging.info(f"Successfully extracted {len(extracted_frames)} frames in {len(frame_formats)} formats.")
    logging.debug(f"Exiting extract_frames_from_highlights, extracted {len(extracted_frames)} frames.")
    return extracted_frames

def process_video_for_highlights(source, num_clips=5, output_dir=None, generate_both_formats=True, extract_frames=True):
    """Main pipeline: download/transcribe/process and save highlight clips."""
    logging.debug(f"Entering process_video_for_highlights with source: {source}, num_clips: {num_clips}, output_dir: {output_dir}, generate_both: {generate_both_formats}, extract_frames: {extract_frames}")
    # Prepare video
    video_path = source
    if not os.path.exists(video_path):
        logging.error(f"Video not found: {video_path}")
        raise FileNotFoundError(f"Video not found: {video_path}")
    
    logging.info(f"Detecting scenes for {video_path}")
    scenes = detect_scenes(video_path)
    logging.info(f"Extracting audio peaks for {video_path}")
    peaks = get_audio_peaks(video_path)
    
    # Transcription
    logging.info("Loading whisper model (base)...")
    model = whisper.load_model("base")
    logging.info(f"Transcribing video: {video_path}")
    result = model.transcribe(video_path)
    raw_segments = result.get("segments", [])
    logging.info(f"Found {len(raw_segments)} raw segments initially from transcription.")
    
    keywords = ["главное","вопрос","важно","итог","ответ",
                "ключевое","education","students","learning","school",
                "ai", "developers", "artificial", "intelligence", "coding"]
    
    found = [k for k in keywords if k in result.get("text","").lower()]
    data = []
    logging.info("Filtering and scoring segments...")
    for seg_idx, seg in enumerate(raw_segments):
        logging.debug(f"Processing raw segment {seg_idx + 1}/{len(raw_segments)}: Start: {seg.get('start', 0):.2f}s, End: {seg.get('end', 0):.2f}s, Text: '{seg.get('text', '')[:50]}...'")
        score = compute_score_enhanced(seg, peaks, keywords, scenes)
        if score <= 0:
            logging.debug(f"Segment {seg_idx + 1} (Start: {seg.get('start',0):.2f}s) failed filtering with score {score}.")
            continue
        logging.info(f"Segment {seg_idx + 1} (Start: {seg.get('start',0):.2f}s) passed filtering with score {score}.")
        hashtags = list({f"#{w.lower()}" for w in seg['text'].split() if w.isalpha() and len(w)>3} |
                        {f"#{k.lower()}" for k in found})
        data.append({**seg, 'score': score, 'hashtags': hashtags})
    
    logging.info(f"Selected {len(data)} segments after scoring, sorting to get top {num_clips}.")
    top = sorted(data, key=lambda x: -x['score'])[:num_clips]
    logging.info(f"Attempting to create highlight clips from {len(top)} candidate segments.")
    
    # Save clips
    if output_dir is None:
        output_dir = os.path.join(BASE_DIR, "highlight_clips")
    os.makedirs(output_dir, exist_ok=True)
    
    # Create directories for landscape and portrait formats
    landscape_dir = os.path.join(output_dir, "landscape")
    portrait_dir = os.path.join(output_dir, "portrait")
    os.makedirs(landscape_dir, exist_ok=True)
    os.makedirs(portrait_dir, exist_ok=True)
    
    logging.info(f"Processing video into up to {num_clips} highlight clips...")
    video = VideoFileClip(video_path)
    results = []
    
    if not top:
        logging.warning("No segments selected as top candidates. No highlight clips will be generated.")

    for i, clip_data in enumerate(top, 1):
        logging.info(f"Creating highlight clip {i}/{len(top)} (Segment Start: {clip_data['start']:.2f}s, End: {clip_data['end']:.2f}s)...")
        logging.debug(f"Full data for clip {i}: {clip_data}")
        # First extract the clip from the original video
        sub = video.subclip(clip_data['start'], clip_data['end'])
        subs = [{'start':s['start']-clip_data['start'], 'end':s['end']-clip_data['start'], 'text':s['text']} \
                for s in result['segments'] if s['start']>=clip_data['start'] and s['end']<=clip_data['end']]
        
        portrait_path_final = None # Initialize
        # Create portrait (vertical) version
        if generate_both_formats:
            logging.info(f"  - Creating portrait (9:16) version for highlight {i}...")
            portrait = crop_to_aspect_ratio(sub, target_aspect=(9, 16))
            
            if subs:
                logging.debug(f"    Adding subtitles to portrait clip {i}")
                portrait = portrait.fl(
                    lambda get_frame, t: add_subtitles_pillow(
                        get_frame(t),
                        subs,
                        t,
                        portrait.size
                    ),
                    keep_duration=True
                )
            
            portrait_path_final = os.path.join(portrait_dir, f"highlight_{i}.mp4")
            temp_portrait_path = os.path.join(portrait_dir, f"temp_highlight_{i}.mp4")
            
            logging.info(f"    Attempting to save temporary portrait file: {temp_portrait_path}")
            portrait.write_videofile(
                temp_portrait_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile=os.path.join(output_dir, f"temp-audio-portrait-{i}.m4a"),
                remove_temp=True,
                fps=video.fps if video.fps else 24,
                verbose=False,
                logger=None # Suppress moviepy console output
            )
            logging.info(f"    Successfully saved temporary portrait file: {temp_portrait_path}")
            
            # Convert to compatible format
            portrait_path_final = convert_to_compatible_format(temp_portrait_path, portrait_path_final)
            if os.path.exists(temp_portrait_path):
                os.remove(temp_portrait_path)
            
            if portrait_path_final and os.path.exists(portrait_path_final):
                logging.info(f"    Successfully created final portrait clip: {portrait_path_final}")
            else:
                logging.warning(f"    Failed to create/find final portrait clip for highlight {i} at expected path: {portrait_path_final or os.path.join(portrait_dir, f'highlight_{i}.mp4')}")
                portrait_path_final = None # Ensure it's None if failed
        
        # Create landscape (16:9) version
        logging.info(f"  - Creating landscape (16:9) version for highlight {i}...")
        landscape = crop_to_aspect_ratio(sub, target_aspect=(16, 9))
        
        if subs:
            logging.debug(f"    Adding subtitles to landscape clip {i}")
            landscape = landscape.fl(
                lambda get_frame, t: add_subtitles_pillow(
                    get_frame(t),
                    subs,
                    t,
                    landscape.size
                ),
                keep_duration=True
            )
        
        landscape_path_final = os.path.join(landscape_dir, f"highlight_{i}.mp4")
        temp_landscape_path = os.path.join(landscape_dir, f"temp_highlight_{i}.mp4")
        
        logging.info(f"    Attempting to save temporary landscape file: {temp_landscape_path}")
        landscape.write_videofile(
            temp_landscape_path,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=os.path.join(output_dir, f"temp-audio-landscape-{i}.m4a"),
            remove_temp=True,
            fps=video.fps if video.fps else 24,
            verbose=False,
            logger=None # Suppress moviepy console output
        )
        logging.info(f"    Successfully saved temporary landscape file: {temp_landscape_path}")
        
        # Convert to compatible format
        landscape_path_final = convert_to_compatible_format(temp_landscape_path, landscape_path_final)
        if os.path.exists(temp_landscape_path):
            os.remove(temp_landscape_path)

        if landscape_path_final and os.path.exists(landscape_path_final):
            logging.info(f"    Successfully created final landscape clip: {landscape_path_final}")
        else:
            logging.warning(f"    Failed to create/find final landscape clip for highlight {i} at expected path: {landscape_path_final or os.path.join(landscape_dir, f'highlight_{i}.mp4')}")
            landscape_path_final = None # Ensure it's None if failed
        
        # Add to results - use landscape as default for metadata
        results.append({**clip_data, 'file': landscape_path_final, 'portrait_file': portrait_path_final})
    
    video.close()

    num_portrait_results = sum(1 for r in results if r.get('portrait_file'))
    if generate_both_formats and num_portrait_results == 0 and top:
        logging.error(f"No portrait highlight clips were successfully generated and saved from {len(top)} candidates. Check logs for individual segment processing details.")
    elif generate_both_formats and top:
        logging.info(f"Successfully generated {num_portrait_results} portrait clips out of {len(top)} candidates.")

    # Save metadata
    meta_path = os.path.join(output_dir, "highlights.json")
    logging.info(f"Attempting to save highlights metadata to: {meta_path}")
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    logging.info(f"Successfully saved highlights metadata to: {meta_path}")
    
    # Extract frames from highlights if requested
    extracted_frames = []
    if extract_frames:
        frame_formats = []
        if generate_both_formats or args.formats == 'landscape':
            frame_formats.append("landscape")
        if generate_both_formats or args.formats == 'portrait':
            frame_formats.append("portrait")
        frame_formats.append("instagram")  # Always include Instagram format
        
        extracted_frames = extract_frames_from_highlights(
            video_path, 
            top,  # Use the top segments
            output_dir,
            frame_formats=frame_formats
        )
        
        # Save extracted frames metadata
        frames_meta_path = os.path.join(output_dir, "frames.json")
        logging.info(f"Attempting to save frames metadata to: {frames_meta_path}")
        with open(frames_meta_path, 'w', encoding='utf-8') as f:
            json.dump(extracted_frames, f, ensure_ascii=False, indent=2)
        logging.info(f"Successfully saved frames metadata to: {frames_meta_path}")
    
    logging.debug(f"Exiting process_video_for_highlights, returning {len(results)} highlights")
    return results


def merge_highlights_with_transitions(clips_dir, output_file, transition_duration=0.1, format="landscape"):
    """
    Merges multiple highlight clips with smooth crossfade transitions into a single video.
    
    Args:
        clips_dir: Directory containing highlight clips
        output_file: Path for the output merged video
        transition_duration: Duration of transitions in seconds
        format: Either "landscape" or "portrait"
    """
    from moviepy.editor import VideoFileClip, concatenate_videoclips, vfx
    
    # Get the proper format directory
    if format == "landscape":
        format_dir = os.path.join(clips_dir, "landscape")
    elif format == "portrait":
        format_dir = os.path.join(clips_dir, "portrait")
    else:
        format_dir = clips_dir  # Fallback to main directory
    
    if not os.path.exists(format_dir):
        format_dir = clips_dir  # Fallback to main directory if format dir doesn't exist
        
    # Get all highlight clips and sort them
    highlight_files = sorted([f for f in os.listdir(format_dir)
                            if f.startswith('highlight_') and f.endswith('.mp4')])
    if not highlight_files:
        logging.warning(f"No highlight clips found in {format_dir} for merging.")
        return None
    
    logging.info(f"Merging {len(highlight_files)} {format} highlight clips from {format_dir} into a single video: {output_file}")
    video_clips = []
    try:
        # Load and prepare clips with fade effects
        for file in highlight_files:
            clip = VideoFileClip(os.path.join(format_dir, file))
            # Add fadeout to end of clip
            clip = clip.fadein(transition_duration).fadeout(transition_duration)
            video_clips.append(clip)
            
        # Concatenate with crossfading
        final_clip = concatenate_videoclips(
            video_clips,
            method="compose",
            padding=-transition_duration  # Overlap clips by transition duration
        )
        
        # Write final video with compatible settings
        temp_output = output_file + ".temp.mp4"
        final_clip.write_videofile(
            temp_output,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile="temp-audio-merge.m4a",
            remove_temp=True,
            fps=video_clips[0].fps,
            verbose=False,
            logger=None # Suppress moviepy console output
        )
        logging.info(f"Temporary merged file saved to {temp_output}")
        
        # Convert to fully compatible format
        final_merged_path = convert_to_compatible_format(temp_output, output_file)
        if os.path.exists(temp_output):
            os.remove(temp_output)
        
        if final_merged_path and os.path.exists(final_merged_path):
            logging.info(f"Successfully merged and converted highlights to {final_merged_path}")
        else:
            logging.error(f"Failed to create final merged video at {output_file}")
            
    finally:
        # Clean up
        for clip in video_clips:
            clip.close()
            
    return final_merged_path if final_merged_path and os.path.exists(final_merged_path) else None


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Extract, process and create highlight videos from a source video")
    
    # Define input source group (either file or URL)
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--file', type=str, help="Path to local video file")
    input_group.add_argument('--url', type=str, help="URL to download video from (YouTube, Twitter, etc.)")
    
    # Other optional arguments
    parser.add_argument('--output', type=str, default=OUTPUT_DIR, help="Output directory for highlight clips")
    parser.add_argument('--clips', type=int, default=NUM_CLIPS, help="Number of highlight clips to extract")
    parser.add_argument('--merge', action='store_true', default=MERGE_CLIPS, help="Merge highlight clips into a single video")
    parser.add_argument('--no-merge', dest='merge', action='store_false', help="Don't merge highlight clips")
    parser.add_argument('--formats', choices=['both', 'landscape', 'portrait'], default='both', 
                        help="Which format(s) to generate: 'landscape' (16:9), 'portrait' (9:16), or 'both'")
    parser.add_argument('--frames', action='store_true', default=EXTRACT_FRAMES, 
                        help="Extract screenshot frames from highlight clips")
    parser.add_argument('--no-frames', dest='frames', action='store_false', 
                        help="Don't extract screenshot frames from highlight clips")
    parser.add_argument('--frames-per-clip', type=int, default=3, 
                        help="Number of frames to extract from each highlight clip")
    
    # Add max duration parameter for YouTube Shorts
    parser.add_argument("--max-duration", type=int, default=None, 
                      help="Maximum duration in seconds for each highlight clip (useful for Shorts/TikTok)")
    
    return parser.parse_args()


if __name__ == "__main__":
    # Parse command line arguments
    args = parse_arguments()
    
    # Set parameters based on arguments
    OUTPUT_DIR = args.output
    NUM_CLIPS = args.clips
    MERGE_CLIPS = args.merge
    GENERATE_BOTH_FORMATS = (args.formats == 'both')
    EXTRACT_FRAMES = args.frames
    
    # Determine video source
    video_source = None
    if args.file:
        video_source = args.file
        if not os.path.exists(video_source):
            logging.error(f"Error: File not found: {video_source}")
            sys.exit(1)
    elif args.url:
        # Download video from URL
        logging.info(f"URL provided, attempting download: {args.url}")
        video_source = download_from_url(args.url)
        if not video_source:
            logging.error(f"Error: Failed to download video from URL: {args.url}")
            sys.exit(1)
        logging.info(f"Video downloaded to: {video_source}")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Process video
    logging.info(f"Starting video processing for: {video_source}")
    try:
        highlights = process_video_for_highlights(
            video_source,
            NUM_CLIPS,
            OUTPUT_DIR,
            GENERATE_BOTH_FORMATS,
            EXTRACT_FRAMES
        )
        logging.debug(f"Highlights data: {json.dumps(highlights, ensure_ascii=False, indent=2)}") # Changed to debug
        
        # Merge if requested
        if MERGE_CLIPS and highlights:
            logging.info("Merging highlight clips as requested.")
            # Merge landscape clips
            if GENERATE_BOTH_FORMATS or args.formats == 'landscape':
                landscape_merged_path = os.path.join(OUTPUT_DIR, "merged_highlights_landscape.mp4")
                merged_landscape = merge_highlights_with_transitions(OUTPUT_DIR, landscape_merged_path, format="landscape")
                if merged_landscape:
                    logging.info(f"Merged landscape video saved to: {merged_landscape}")
                else:
                    logging.warning(f"Failed to merge landscape clips. Check logs for {OUTPUT_DIR}/landscape.")

            # Merge portrait clips if both formats are generated
            if GENERATE_BOTH_FORMATS or args.formats == 'portrait':
                portrait_merged_path = os.path.join(OUTPUT_DIR, "merged_highlights_portrait.mp4")
                merged_portrait = merge_highlights_with_transitions(OUTPUT_DIR, portrait_merged_path, format="portrait")
                if merged_portrait:
                    logging.info(f"Merged portrait video saved to: {merged_portrait}")
                else:
                    logging.warning(f"Failed to merge portrait clips. Check logs for {OUTPUT_DIR}/portrait.")
        elif MERGE_CLIPS and not highlights:
            logging.warning("Merging requested, but no highlights were generated to merge.")

        logging.info("Processing complete!")
        logging.info(f"Highlight clips saved to: {OUTPUT_DIR}")
        
        if EXTRACT_FRAMES:
            logging.info(f"Screenshot frames saved to:")
            logging.info(f"  - Instagram frames: {os.path.join(OUTPUT_DIR, 'instagram_frames/')}")
            if GENERATE_BOTH_FORMATS or args.formats == 'landscape':
                logging.info(f"  - Landscape frames: {os.path.join(OUTPUT_DIR, 'landscape_frames/')}")
            if GENERATE_BOTH_FORMATS or args.formats == 'portrait':
                logging.info(f"  - Portrait frames: {os.path.join(OUTPUT_DIR, 'portrait_frames/')}")
    except Exception as e:
        logging.error(f"Unhandled error during main processing: {e}", exc_info=True) # Added exc_info
        sys.exit(1)