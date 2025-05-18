# -*- coding: utf-8 -*-
# This script downloads a video, detects motion intervals,
# creates a highlight reel, and saves it.
#
# Required Python libraries: yt-dlp, opencv-python, moviepy, numpy
# Required system packages: ffmpeg, imagemagick
#
# Ensure these are installed in your environment.
# Example pip installation:
# pip install yt-dlp opencv-python moviepy numpy
#
# Example system package installation (Debian/Ubuntu):
# sudo apt-get update
# sudo apt-get install -y ffmpeg imagemagick

import os
import cv2
import yt_dlp
import numpy as np
from moviepy.editor import VideoFileClip, concatenate_videoclips
from moviepy.audio.AudioClip import AudioArrayClip
import moviepy.video.fx.all as vfx

# Target dimensions for output videos
PORTRAIT_DIMENSIONS = (1080, 1920)  # width, height (9:16)
LANDSCAPE_DIMENSIONS = (1920, 1080) # width, height (16:9)

# Target dimensions for Instagram frames (4:5 aspect ratio)
INSTAGRAM_FRAME_WIDTH = 1080
INSTAGRAM_FRAME_HEIGHT = 1350 # 1080 * 5/4

SHORT_VIDEO_TARGET_DURATION = 58 # Max duration for the short highlight video in seconds
STORY_VIDEO_TARGET_DURATION = 15 # Max duration for the Instagram Story highlight video in seconds

BASE_OUTPUT_DIR = "url_test" # Consistent with process_video.py structure

# === 1. СКАЧИВАНИЕ ВИДЕО ===
def download_video(url, output_path="input/video.mp4"):
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'outtmpl': output_path,
        'quiet': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    return output_path

# === 2. АНАЛИЗ ДВИЖЕНИЯ (OpenCV) ===
def detect_motion_intervals(video_path, min_motion_frames=3):
    cap = cv2.VideoCapture(video_path)
    motion_scores = []
    prev_frame = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if prev_frame is None:
            prev_frame = gray
            continue

        frame_diff = cv2.absdiff(prev_frame, gray)
        score = np.sum(frame_diff) / 255
        motion_scores.append(score)
        prev_frame = gray

    cap.release()

    motion_scores = np.array(motion_scores)
    mean_score = np.mean(motion_scores)
    std_score = np.std(motion_scores)
    threshold_score = mean_score + 0.2 * std_score

    intervals = []
    start, count = None, 0
    for i, score in enumerate(motion_scores):
        if score > threshold_score:
            if start is None:
                start = i
            count += 1
        else:
            if count >= min_motion_frames:
                intervals.append((start / 30, (i - 1) / 30))
            start, count = None, 0

    return intervals

# === 2.5 ОБЪЕДИНЕНИЕ БЛИЗКИХ ИНТЕРВАЛОВ ===
def merge_intervals(intervals, max_gap=1.0):
    if not intervals:
        return []
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] - prev[1] <= max_gap:
            merged[-1] = (prev[0], max(prev[1], current[1]))
        else:
            merged.append(current)
    return merged

# === 3. СОЗДАНИЕ ХАЙЛАЙТ ВИДЕО ===
def create_highlight_video(video_path, intervals):
    base_clip = VideoFileClip(video_path)
    video_duration = base_clip.duration
    min_total_duration = 0.1 * video_duration
    min_clip_duration = 3
    max_clip_duration = 23

    # Объединяем интервалы
    merged_intervals = merge_intervals(intervals)

    # Фильтрация валидных клипов
    valid_segments = []
    for start, end in merged_intervals:
        end = min(end + 0.3, base_clip.duration)
        duration = end - start
        if min_clip_duration <= duration <= max_clip_duration:
            valid_segments.append((start, end, duration))

    # Отбор по убыванию длительности до набора 10%
    valid_segments.sort(key=lambda x: x[2], reverse=True)

    selected_segments_info = [] # To store (start, end, dur) of selected segments
    total_duration = 0
    # First, select segments based on duration
    for start, end, dur in valid_segments:
        selected_segments_info.append((start, end, dur))
        total_duration += dur
        if total_duration >= min_total_duration:
            break

    if not selected_segments_info:
        raise ValueError("❌ Not enough valid highlights (3–23 sec) to build summary.")

    # Now, sort the selected_segments_info by their original start time (chronological order)
    # x[0] corresponds to the 'start' time of the segment.
    selected_segments_info.sort(key=lambda x: x[0])

    # Create subclips in chronological order
    subclips = []
    for start, end, dur in selected_segments_info: # dur is not strictly needed here but kept for consistency
        subclips.append(base_clip.subclip(start, end))

    final_clip = concatenate_videoclips(subclips, method='chain')

    # Обработка звука
    if final_clip.audio is None:
        sr = 44100
        silence = AudioArrayClip(np.zeros((int(final_clip.duration * sr), 2)), fps=sr)
        final_clip = final_clip.set_audio(silence)
    
    return final_clip, selected_segments_info # Return segments for frame extraction

# === 3.5 СОЗДАНИЕ ХАЙЛАЙТ ВИДЕО С ЦЕЛЕВОЙ ДЛИТЕЛЬНОСТЬЮ ===
def create_targeted_duration_highlight_video(video_path, all_chronological_highlight_segments, target_duration_seconds, video_type_name="highlight"):
    """
    Creates a highlight video with a maximum duration of approximately target_duration_seconds.

    Args:
        video_path (str): Path to the original video file.
        all_chronological_highlight_segments (list): A list of tuples (start, end, duration)
                                                     for all valid highlight segments, sorted chronologically.
                                                     These are already filtered by min/max clip duration.
        target_duration_seconds (float): The target maximum duration for this video.
        video_type_name (str): A descriptive name for the video type (e.g., "short", "story") for logging.

    Returns:
        tuple: (moviepy.VideoFileClip or None, list)
               The concatenated highlight video clip, or None if no clips are selected.
               A list of (start, end, duration) tuples for the segments included in the video.
    """
    base_clip = VideoFileClip(video_path)
    selected_video_segments = []
    current_total_duration = 0

    # Calculate total duration of all available highlight segments
    total_available_duration = sum(seg[2] for seg in all_chronological_highlight_segments)

    if not all_chronological_highlight_segments:
        print(f"⚠️ No highlight segments provided to create_targeted_duration_highlight_video for {video_type_name} video. Cannot create reel.")
        if base_clip: base_clip.close()
        return None, []

    # "Little Material" Case: If total duration of all clips is already less than or equal to target
    if total_available_duration <= target_duration_seconds:
        print(f"ℹ️ Total duration of all highlights ({total_available_duration:.2f}s) is within target ({target_duration_seconds}s) for {video_type_name} video. Using all clips.")
        selected_video_segments = list(all_chronological_highlight_segments) # Use a copy
    else:
        # "Too Much Material" Case: Iterate and add clips chronologically until target duration is approached
        print(f"ℹ️ Total duration of all highlights ({total_available_duration:.2f}s) exceeds target ({target_duration_seconds}s) for {video_type_name} video. Selecting clips chronologically.")
        for start, end, dur in all_chronological_highlight_segments: # These are already chronologically sorted
            if current_total_duration + dur <= target_duration_seconds:
                selected_video_segments.append((start, end, dur))
                current_total_duration += dur
            else:
                # Next clip would exceed the target duration
                print(f"  Stopping clip addition for {video_type_name} video: current total {current_total_duration:.2f}s, next clip {dur:.2f}s would exceed {target_duration_seconds}s.")
                break
    
    if not selected_video_segments:
        print(f"⚠️ No clips selected for the {video_type_name} highlight video (e.g., all individual clips too long or no highlights).")
        if base_clip: base_clip.close()
        return None, []

    # Create subclips from the selected segments
    subclips = []
    for start, end, dur in selected_video_segments:
        subclips.append(base_clip.subclip(start, end))

    if not subclips: # Should be caught by the previous check, but as a safeguard
        print(f"⚠️ No subclips generated for {video_type_name} video concatenation.")
        if base_clip: base_clip.close()
        return None, selected_video_segments # Return empty list of segments

    final_targeted_clip = concatenate_videoclips(subclips, method='chain')

    # Handle audio for the clip
    if final_targeted_clip.audio is None:
        sr = 44100
        silence = AudioArrayClip(np.zeros((int(final_targeted_clip.duration * sr), 2)), fps=sr)
        final_targeted_clip = final_targeted_clip.set_audio(silence)
    
    # base_clip.close() # Closing here might be too early if original_clip is needed later by other functions using the same path.
    # The subclips derived from base_clip (which form final_short_clip) need the base_clip's reader to remain open
    # until they are fully processed (e.g., written to a file by save_video).
    # MoviePy typically handles the closing of these resources when the clips are garbage collected.
    # Explicitly closing base_clip here makes final_short_clip unusable for subsequent operations like saving.
    #
    # if base_clip: # This was causing the AttributeError: 'NoneType' object has no attribute 'get_frame'
    #     base_clip.close()

    print(f"✅ {video_type_name.capitalize()} highlight video created with {len(selected_video_segments)} segments, total duration: {final_targeted_clip.duration:.2f}s.")
    return final_targeted_clip, selected_video_segments

# === 4. СОХРАНЕНИЕ ВИДЕО ===
def save_video(clip, base_output_name="output/highlight_final"):
    if not hasattr(clip, 'size'):
        print("⚠️ Error: Input clip does not have size attribute. Skipping video saving.")
        return
        
    original_w, original_h = clip.size
    if original_w == 0 or original_h == 0: # Avoid division by zero for invalid clips
        print(f"⚠️ Error: Original clip dimensions are zero ({original_w}x{original_h}). Skipping video saving.")
        return

    output_fps = clip.fps if hasattr(clip, 'fps') and clip.fps and clip.fps > 0 else 30
    common_write_args = {'codec': 'libx264', 'fps': output_fps, 'threads': 4, 'preset': 'medium'}

    # --- Process and Save Portrait Video (9:16) ---
    target_w_p, target_h_p = PORTRAIT_DIMENSIONS
    
    # Calculate scaling factor to cover the target dimensions
    scale_p = max(target_w_p / original_w, target_h_p / original_h)
    resized_w_p, resized_h_p = int(original_w * scale_p), int(original_h * scale_p)

    # Ensure dimensions are even for some codecs
    if resized_w_p % 2 != 0: resized_w_p += 1
    if resized_h_p % 2 != 0: resized_h_p += 1
    
    if resized_w_p <= 0 or resized_h_p <= 0:
        print(f"⚠️ Error: Invalid resized dimensions for portrait ({resized_w_p}x{resized_h_p}). Skipping portrait video.")
    else:
        resized_clip_p = clip.resize(newsize=(resized_w_p, resized_h_p))
        
        # Ensure crop dimensions do not exceed resized clip dimensions
        crop_width_p = min(target_w_p, resized_clip_p.w)
        crop_height_p = min(target_h_p, resized_clip_p.h)

        if crop_width_p <= 0 or crop_height_p <= 0:
            print(f"⚠️ Error: Invalid crop dimensions for portrait ({crop_width_p}x{crop_height_p}). Skipping portrait video.")
        else:
            cropped_portrait_clip = resized_clip_p.fx(vfx.crop,
                                                      x_center=resized_clip_p.w / 2,
                                                      y_center=resized_clip_p.h / 2,
                                                      width=crop_width_p,
                                                      height=crop_height_p)
            
            portrait_output_path = f"{base_output_name}_portrait.mp4"
            print(f"⏳ Saving portrait video to {portrait_output_path} ({crop_width_p}x{crop_height_p})...")
            try:
                cropped_portrait_clip.write_videofile(portrait_output_path, audio_codec='aac', **common_write_args)
            except Exception as e:
                print(f"⚠️ Error writing portrait video with audio: {e}. Trying without audio.")
                try:
                    cropped_portrait_clip.write_videofile(portrait_output_path, audio=False, **common_write_args)
                except Exception as e2:
                    print(f"❌ Failed to write portrait video: {e2}")
            else:
                print(f"✅ Portrait video saved: {portrait_output_path}")

    # --- Process and Save Landscape Video (16:9) ---
    target_w_l, target_h_l = LANDSCAPE_DIMENSIONS

    scale_l = max(target_w_l / original_w, target_h_l / original_h)
    resized_w_l, resized_h_l = int(original_w * scale_l), int(original_h * scale_l)

    if resized_w_l % 2 != 0: resized_w_l += 1
    if resized_h_l % 2 != 0: resized_h_l += 1

    if resized_w_l <= 0 or resized_h_l <= 0:
        print(f"⚠️ Error: Invalid resized dimensions for landscape ({resized_w_l}x{resized_h_l}). Skipping landscape video.")
    else:
        resized_clip_l = clip.resize(newsize=(resized_w_l, resized_h_l))

        crop_width_l = min(target_w_l, resized_clip_l.w)
        crop_height_l = min(target_h_l, resized_clip_l.h)
        
        if crop_width_l <= 0 or crop_height_l <= 0:
            print(f"⚠️ Error: Invalid crop dimensions for landscape ({crop_width_l}x{crop_height_l}). Skipping landscape video.")
        else:
            cropped_landscape_clip = resized_clip_l.fx(vfx.crop,
                                                       x_center=resized_clip_l.w / 2,
                                                       y_center=resized_clip_l.h / 2,
                                                       width=crop_width_l,
                                                       height=crop_height_l)

            landscape_output_path = f"{base_output_name}_landscape.mp4"
            print(f"⏳ Saving landscape video to {landscape_output_path} ({crop_width_l}x{crop_height_l})...")
            try:
                cropped_landscape_clip.write_videofile(landscape_output_path, audio_codec='aac', **common_write_args)
            except Exception as e:
                print(f"⚠️ Error writing landscape video with audio: {e}. Trying without audio.")
                try:
                    cropped_landscape_clip.write_videofile(landscape_output_path, audio=False, **common_write_args)
                except Exception as e2:
                    print(f"❌ Failed to write landscape video: {e2}")
            else:
                print(f"✅ Landscape video saved: {landscape_output_path}")

# === NEW: INSTAGRAM FRAME EXTRACTION ===
def crop_frame_to_4_5(frame_array, target_w, target_h):
    """
    Resizes and crops a frame (numpy array HxWxC) to target_w x target_h (e.g., 4:5 aspect ratio).
    """
    img_h, img_w = frame_array.shape[:2]
    if img_h == 0 or img_w == 0:
        print(f"⚠️ Warning: Invalid input frame dimensions ({img_w}x{img_h}). Skipping frame.")
        return None

    target_aspect = target_w / target_h
    img_aspect = img_w / img_h

    if img_aspect > target_aspect: # Image is wider than target aspect
        scale_factor = target_h / img_h
        resized_w = int(img_w * scale_factor)
        resized_h = target_h
    else: # Image is taller or same aspect as target
        scale_factor = target_w / img_w
        resized_w = target_w
        resized_h = int(img_h * scale_factor)
    
    if resized_w <= 0 or resized_h <= 0: # Should be caught by img_h/w check, but good practice
        print(f"⚠️ Warning: Invalid resize dimensions ({resized_w}x{resized_h}). Skipping frame.")
        return None
        
    resized_frame = cv2.resize(frame_array, (resized_w, resized_h), interpolation=cv2.INTER_AREA)

    crop_x = max(0, (resized_w - target_w) // 2)
    crop_y = max(0, (resized_h - target_h) // 2)
    
    # Ensure the crop area does not exceed the resized frame dimensions
    actual_crop_w = min(target_w, resized_w - crop_x)
    actual_crop_h = min(target_h, resized_h - crop_y)

    cropped_frame = resized_frame[crop_y : crop_y + actual_crop_h, crop_x : crop_x + actual_crop_w]

    # If the crop is not the exact target size (e.g. source smaller than target), resize to target
    if cropped_frame.shape[0] != target_h or cropped_frame.shape[1] != target_w:
        cropped_frame = cv2.resize(cropped_frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
    return cropped_frame

def extract_and_save_instagram_frames(original_video_path, selected_segments,
                                      output_dir="output/instagram_frames",
                                      frames_per_segment_points=None):
    if frames_per_segment_points is None:
        frames_per_segment_points = [0.25, 0.50, 0.75] # Extract at 25%, 50%, 75% of segment

    os.makedirs(output_dir, exist_ok=True)

    if not selected_segments:
        print("⚠️ No segments selected for frame extraction.")
        return

    print(f"🎞️ Extracting important frames for Instagram to {output_dir} (up to {len(frames_per_segment_points)} per highlight)...")
    try:
        original_clip = VideoFileClip(original_video_path)
    except Exception as e:
        print(f"❌ Error opening original video {original_video_path} for frame extraction: {e}")
        return

    frame_count = 0

    for i, (start_time, end_time, duration) in enumerate(selected_segments):
        if duration <= 0:
            print(f"  Segment {i+1} has zero or negative duration ({duration:.2f}s). Skipping.")
            continue

        for point_index, percentage in enumerate(frames_per_segment_points):
            if not (0 < percentage < 1): # Ensure percentage is within (0,1) to avoid start/end issues
                extraction_time = start_time + duration * 0.5 # Default to middle if percentage is weird
                print(f"  ⚠️ Invalid percentage {percentage} for segment {i+1}, defaulting to middle.")
            else:
                extraction_time = start_time + duration * percentage
            
            # Ensure extraction_time is within the clip's bounds
            extraction_time = min(max(extraction_time, 0), original_clip.duration - 0.01 if original_clip.duration > 0.01 else 0)

            try:
                frame_rgb = original_clip.get_frame(extraction_time) # HxWxC, RGB
                if frame_rgb is None:
                    print(f"  ⚠️ Got None frame from segment {i+1} at time {extraction_time:.2f}s.")
                    continue
                frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

                processed_frame = crop_frame_to_4_5(frame_bgr, INSTAGRAM_FRAME_WIDTH, INSTAGRAM_FRAME_HEIGHT)

                if processed_frame is not None and processed_frame.size > 0 :
                    frame_count += 1
                    output_filename = os.path.join(output_dir, f"frame_seg{i+1:02d}_pt{point_index+1:02d}_{frame_count:03d}.jpg")
                    cv2.imwrite(output_filename, processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    # print(f"  🖼️ Saved: {output_filename}")
                else:
                    print(f"  ⚠️ Skipped saving frame from segment {i+1} (point {percentage*100:.0f}%) at time {extraction_time:.2f}s due to processing error.")

            except Exception as e:
                print(f"  ⚠️ Error extracting/processing frame from segment {i+1} (point {percentage*100:.0f}%) at time {extraction_time:.2f}s: {e}")

    if original_clip:
        original_clip.close()
    if frame_count > 0:
        print(f"✅ {frame_count} Instagram frames saved to {output_dir}")
    else:
        print(f"⚠️ No Instagram frames were saved.")

# === 5. ГЛАВНАЯ ФУНКЦИЯ ===
def generate_highlights_from_url(video_url):
    os.makedirs("input", exist_ok=True)
    # Create base output directory and subdirectories for frames
    os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.join(BASE_OUTPUT_DIR, "instagram_frames"), exist_ok=True)
    # No separate landscape/portrait subdirs for merged videos in abduk_motion.py,
    # they will be named distinctively in the BASE_OUTPUT_DIR.

    downloaded = download_video(video_url)
    if not os.path.exists(downloaded):
        print(f"❌ Failed to download video from {video_url}")
        return

    motion_intervals = detect_motion_intervals(downloaded)
    
    try:
        highlight_clip, selected_segments_for_main_reel = create_highlight_video(downloaded, motion_intervals)
    except ValueError as e:
        print(e) # e.g., "❌ Not enough valid highlights..."
        return
    except Exception as e:
        print(f"❌ Error creating highlight video: {e}")
        return

    save_video(highlight_clip, os.path.join(BASE_OUTPUT_DIR, "merged_highlights_main"))
    extract_and_save_instagram_frames(downloaded, selected_segments_for_main_reel, os.path.join(BASE_OUTPUT_DIR, "instagram_frames"))

    # Create and save the short highlight video
    print("\n🎬 Creating short highlight video (<1 minute)...")
    short_highlight_clip, _ = create_targeted_duration_highlight_video(
        downloaded,
        selected_segments_for_main_reel,
        SHORT_VIDEO_TARGET_DURATION,
        "short"
    )

    if short_highlight_clip:
        save_video(short_highlight_clip, os.path.join(BASE_OUTPUT_DIR, "merged_highlights_short"))
        print(f"   Short Portrait video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_short_portrait.mp4')}")
        print(f"   Short Landscape video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_short_landscape.mp4')}")
    else:
        print("⚠️ Short highlight video (58s) could not be created or no segments were selected.")

    # Create and save the Instagram Story highlight video
    print("\n🎬 Creating Instagram Story highlight video (~15 seconds)...")
    story_highlight_clip, _ = create_targeted_duration_highlight_video(
        downloaded,
        selected_segments_for_main_reel, # Use the same pool of chronological clips
        STORY_VIDEO_TARGET_DURATION,
        "story"
    )

    if story_highlight_clip:
        save_video(story_highlight_clip, os.path.join(BASE_OUTPUT_DIR, "merged_highlights_story"))
        print(f"   Story Portrait video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_story_portrait.mp4')}")
        print(f"   Story Landscape video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_story_landscape.mp4')}")
    else:
        print("⚠️ Instagram Story highlight video (15s) could not be created or no segments were selected.")

    print(f"\n✅ Highlight processing complete. Check the '{BASE_OUTPUT_DIR}/' directory for results.")
    print(f"   Main Portrait video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_main_portrait.mp4')}")
    print(f"   Main Landscape video: {os.path.join(BASE_OUTPUT_DIR, 'merged_highlights_main_landscape.mp4')}")
    print(f"   Instagram frames: {os.path.join(BASE_OUTPUT_DIR, 'instagram_frames')}/")
    # Specific short/story video paths are printed above if successfully created.

# === 🔽 ССЫЛКА НА ВИДЕО ===
generate_highlights_from_url("https://youtu.be/DF6W1XD25Dc?si=3-cxTc2lweGG7N9w")