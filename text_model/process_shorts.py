#!/usr/bin/env python3

import os
import sys
import argparse
import subprocess
import json
import random
from math import ceil
from pathlib import Path # Add this import

def get_clip_duration(filepath):
    """Gets the duration of a video file using ffprobe."""
    if not os.path.exists(filepath):
        print(f"Warning: File not found, cannot get duration: {filepath}")
        return 0
    try:
        duration_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", filepath
        ]
        result = subprocess.run(duration_cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except subprocess.CalledProcessError as e:
        print(f"Error getting duration for {filepath}: {e}")
        return 0
    except ValueError as e:
        print(f"Error converting duration to float for {filepath}: {e} (stdout: '{result.stdout.strip()}')")
        return 0

def main():
    parser = argparse.ArgumentParser(description="Generate short-form video clips compatible with various platforms")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", type=str, help="URL of the video to process.")
    group.add_argument("--input_file_path", type=str, help="Local path to the video file to process.")
    parser.add_argument("--output", type=str, default="short_clips", help="Output directory")
    parser.add_argument("--clips", type=int, default=3, help="Number of distinct clips to generate per platform (if content allows)")
    parser.add_argument("--max-duration", type=int, default=59, help="Maximum duration in seconds for YouTube (default: 59)")
    # Instagram duration is fixed at 15s
    parser.add_argument("--resolution", type=str, default="1080x1920", help="Resolution for shorts (default: 1080x1920)")
    parser.add_argument("--format", type=str, choices=["youtube", "instagram", "both"], default="youtube", 
                        help="Format type: youtube (up to 59s), instagram (15s), or both (default: youtube)")
    
    args = parser.parse_args()
    
    platform_configs = []
    if args.format == "youtube" or args.format == "both":
        platform_configs.append({"name": "youtube", "max_duration": min(59, args.max_duration), "num_clips_to_generate": args.clips})
    if args.format == "instagram" or args.format == "both":
        platform_configs.append({"name": "instagram", "max_duration": 15, "num_clips_to_generate": args.clips})
    
    # Determine how many initial highlight segments to extract.
    # We want enough short segments to build longer platform-specific clips.
    # Let's aim for enough material to potentially create the longest requested clip from ~5s segments.
    longest_platform_duration = 0
    if platform_configs:
        longest_platform_duration = max(p_conf["max_duration"] for p_conf in platform_configs)
    
    # We'll ask process_video.py to extract more, shorter clips
    # Max 15s segments gives good flexibility.
    initial_extraction_max_duration = 15 
    # Estimate needed clips: if longest is 59s, and we generate 3 such clips, that's ~180s.
    # If segments are ~5-10s long, we need ~18-36 segments. Let's set a higher base.
    num_initial_highlights_to_extract = max(10, args.clips * ceil(longest_platform_duration / 5.0 if longest_platform_duration > 0 else 1.0))


    print("\n===== EXTRACTING INITIAL HIGHLIGHT SEGMENTS =====")
    # Get the directory of the current script (process_shorts.py)
    current_script_dir = Path(__file__).resolve().parent
    # Construct the path to process_video.py
    path_to_process_video_script = current_script_dir / "process_video.py"

    cmd = ["python3", str(path_to_process_video_script)]
    if args.url:
        cmd.extend(["--url", args.url])
    elif args.input_file_path:
        abs_input_file_path = os.path.abspath(args.input_file_path)
        cmd.extend(["--file", abs_input_file_path])
    cmd.extend([
        "--output", args.output, # This is the output for process_video.py, which becomes an input dir for process_shorts
        "--clips", str(int(num_initial_highlights_to_extract)), 
        "--formats", "both",
        "--frames",
        "--max-duration", str(initial_extraction_max_duration) 
    ])
    print(f"Requesting {num_initial_highlights_to_extract} initial highlight segments (max {initial_extraction_max_duration}s each)...")
    subprocess.run(cmd)
    
    portrait_dir = os.path.join(args.output, "portrait")
    if not os.path.exists(portrait_dir) or not os.listdir(portrait_dir):
        print(f"Error: No portrait highlight clips found in {portrait_dir} after initial extraction. Exiting.")
        # Fallback or landscape conversion logic could be here if needed, but current focus is on using portrait.
        sys.exit(1)

    all_portrait_highlights_with_duration = []
    raw_portrait_files = sorted([f for f in os.listdir(portrait_dir) if f.startswith("highlight_") and f.endswith(".mp4")])
    for f_name in raw_portrait_files:
        f_path = os.path.join(portrait_dir, f_name)
        duration = get_clip_duration(f_path)
        if duration > 0:
            all_portrait_highlights_with_duration.append({"path": f_path, "duration": duration, "used": False, "name": f_name})
    
    if not all_portrait_highlights_with_duration:
        print("Error: Could not determine duration for any portrait highlights. Exiting.")
        sys.exit(1)

    for platform_config in platform_configs:
        platform_name = platform_config["name"]
        platform_max_duration = platform_config["max_duration"]
        num_clips_to_make_for_platform = platform_config["num_clips_to_generate"]
        
        print(f"\n===== OPTIMIZING FOR {platform_name.upper()} FORMAT (Target: {num_clips_to_make_for_platform} clip(s), Max Duration: {platform_max_duration}s) =====")
        
        platform_output_dir = os.path.join(args.output, platform_name)
        os.makedirs(platform_output_dir, exist_ok=True)
        
        # Reset 'used' status for each platform to reuse highlights if needed
        for hl in all_portrait_highlights_with_duration:
            hl["used"] = False

        clips_made_for_this_platform = 0

        if platform_name == "youtube":
            process_for_youtube(all_portrait_highlights_with_duration, platform_output_dir, platform_name, args.resolution, platform_max_duration, num_clips_to_make_for_platform)
        elif platform_name == "instagram":
            process_for_instagram(all_portrait_highlights_with_duration, platform_output_dir, platform_name, args.resolution, platform_max_duration, num_clips_to_make_for_platform)
        
        print(f"\n{platform_name.capitalize()} clips generation complete for this pass!")
        print(f"Clips are in: {platform_output_dir}")

def process_ffmpeg_command(input_path, output_path, resolution, duration_to_take, start_time=None):
    """Helper to run common ffmpeg command for scaling, padding, and duration."""
    width, height = resolution.split("x")
    ffmpeg_cmd = ["ffmpeg", "-i", input_path]
    if start_time is not None:
        ffmpeg_cmd.extend(["-ss", str(start_time)])
    ffmpeg_cmd.extend([
        "-t", str(duration_to_take),
        "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-y", output_path
    ])
    print(f"Running ffmpeg: {' '.join(ffmpeg_cmd)}")
    subprocess.run(ffmpeg_cmd)

def process_for_youtube(available_highlights, platform_dir, platform_name, resolution, max_clip_duration, num_clips_to_generate):
    """
    Processes highlights for YouTube.
    Tries to create num_clips_to_generate, each up to max_clip_duration.
    It will concatenate available chronological highlights to fill the duration.
    """
    clips_generated_count = 0
    highlight_idx = 0

    # Corrected loop: Iterate exactly num_clips_to_generate times
    for _i in range(num_clips_to_generate): 
        if clips_generated_count >= num_clips_to_generate: # Redundant check, but safe
            break
        if highlight_idx >= len(available_highlights):
            print("No more highlights available for YouTube.")
            break

        current_clip_parts_paths = []
        current_total_duration = 0
        
        temp_concat_list_path = os.path.join(platform_dir, f"concat_list_yt_{clips_generated_count + 1}.txt") # Use clips_generated_count
        
        # Try to build a clip by concatenating
        temp_highlight_idx = highlight_idx
        while temp_highlight_idx < len(available_highlights):
            hl = available_highlights[temp_highlight_idx]
            if current_total_duration + hl["duration"] <= max_clip_duration:
                current_clip_parts_paths.append(hl["path"])
                current_total_duration += hl["duration"]
                # Mark as "potentially" used for this specific output clip.
                # We advance highlight_idx only after successful generation.
                temp_highlight_idx += 1 
            else: # Next clip would exceed max_duration
                # If we have nothing yet, but this single clip is too long, trim it.
                if not current_clip_parts_paths and hl["duration"] > max_clip_duration :
                    current_clip_parts_paths.append(hl["path"])
                    current_total_duration = max_clip_duration # We will trim this single clip
                    temp_highlight_idx += 1
                break 
        
        if not current_clip_parts_paths:
            print(f"Could not form YouTube clip {clips_generated_count + 1}, not enough suitable short highlights remaining or next one is too short.")
            # Try to see if the very next UNUSED highlight can be trimmed (if we haven't advanced highlight_idx yet)
            if highlight_idx < len(available_highlights):
                 hl_next = available_highlights[highlight_idx]
                 if hl_next["duration"] > 0: # Must have some duration
                    output_filename = os.path.join(platform_dir, f"{platform_name}_clip_{clips_generated_count + 1}.mp4")
                    duration_to_use = min(hl_next["duration"], max_clip_duration)
                    print(f"Making YouTube clip {clips_generated_count + 1} from single highlight {hl_next['name']}, trimmed to {duration_to_use:.2f}s.")
                    process_ffmpeg_command(hl_next["path"], output_filename, resolution, duration_to_use)
                    clips_generated_count += 1
                    highlight_idx +=1 # Consume this highlight
                    continue # Try to make the next YouTube clip
            break # Stop trying to make more YouTube clips if we can't form the current one


        output_filename = os.path.join(platform_dir, f"{platform_name}_clip_{clips_generated_count + 1}.mp4")

        if len(current_clip_parts_paths) == 1:
            # Single clip, might need trimming if it was selected as the "too long" single clip
            duration_to_use = min(get_clip_duration(current_clip_parts_paths[0]), current_total_duration) # current_total_duration would be max_clip_duration if trimmed
            if duration_to_use == 0 : # Safety check if get_clip_duration failed
                print(f"Skipping YT clip {clips_generated_count +1} due to zero duration for {current_clip_parts_paths[0]}")
                highlight_idx = temp_highlight_idx # Advance past used clips
                continue

            print(f"Making YouTube clip {clips_generated_count + 1} from single highlight, duration {duration_to_use:.2f}s.")
            process_ffmpeg_command(current_clip_parts_paths[0], output_filename, resolution, duration_to_use)
        else:
            # Concatenate multiple clips
            print(f"Making YouTube clip {clips_generated_count + 1} by concatenating {len(current_clip_parts_paths)} highlights (total {current_total_duration:.2f}s).")
            with open(temp_concat_list_path, 'w') as f_concat:
                for part_path in current_clip_parts_paths:
                    f_concat.write(f"file '{os.path.abspath(part_path)}'\n")
            
            width, height = resolution.split("x")
            ffmpeg_cmd_concat = [
                "ffmpeg", "-f", "concat", "-safe", "0", "-i", temp_concat_list_path,
                "-t", str(current_total_duration), # Use the actual combined duration
                "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-y", output_filename
            ]
            print(f"Running ffmpeg concat: {' '.join(ffmpeg_cmd_concat)}")
            subprocess.run(ffmpeg_cmd_concat)
            if os.path.exists(temp_concat_list_path):
                os.remove(temp_concat_list_path)
        
        clips_generated_count += 1
        highlight_idx = temp_highlight_idx # Advance main index past the clips used for this YT short
        if clips_generated_count >= num_clips_to_generate: # Ensure we break if limit reached
            break

    if clips_generated_count < num_clips_to_generate:
        print(f"Warning: Only {clips_generated_count} YouTube clips were generated, less than the requested {num_clips_to_generate}.")
    elif clips_generated_count == 0 :
        print("No YouTube clips were generated.")


def process_for_instagram(available_highlights, platform_dir, platform_name, resolution, max_clip_duration, num_clips_to_generate):
    """
    Processes highlights for Instagram.
    Creates num_clips_to_generate, each from a distinct chronological highlight.
    Each clip is trimmed to max_clip_duration (15s) if longer, or used as is.
    """
    clips_generated_count = 0
    current_highlight_source_index = 0 # Keep track of which highlight to use next

    for _i in range(num_clips_to_generate): # Iterate exactly num_clips_to_generate times
        if clips_generated_count >= num_clips_to_generate: # Redundant, but safe
            break
        
        if current_highlight_source_index >= len(available_highlights):
            print("No more unique highlights available for Instagram.")
            break
            
        hl = available_highlights[current_highlight_source_index]
        current_highlight_source_index += 1 # Move to next highlight for the next IG clip

        output_filename = os.path.join(platform_dir, f"{platform_name}_clip_{clips_generated_count + 1}.mp4")
        
        duration_to_use = min(hl["duration"], max_clip_duration)
        if duration_to_use <= 0.1: # Skip if too short or zero duration
            print(f"Skipping Instagram clip for {hl['name']} as effective duration is too short ({duration_to_use:.2f}s).")
            # We don't `continue` here in the outer loop directly, but this clip won't be made,
            # and clips_generated_count won't increment for this iteration.
            # The loop will try to make the "next" clip in the next iteration if num_clips_to_generate allows.
        else:
            print(f"Making Instagram clip {clips_generated_count + 1} from {hl['name']}, duration {duration_to_use:.2f}s.")
            process_ffmpeg_command(hl["path"], output_filename, resolution, duration_to_use)
            clips_generated_count += 1
        
        if clips_generated_count >= num_clips_to_generate: # Ensure we break if limit reached
            break

    if clips_generated_count < num_clips_to_generate:
        print(f"Warning: Only {clips_generated_count} Instagram clips were generated, less than the requested {num_clips_to_generate}.")
    elif clips_generated_count == 0:
        print("No Instagram clips were generated.")


if __name__ == "__main__":
    main() 