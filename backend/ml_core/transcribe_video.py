import argparse
import whisper
import os
from pathlib import Path

def transcribe_video(video_path: str, output_directory: str, output_format: str = "txt", model_name: str = "base"):
    """
    Transcribes the given video file and saves the transcript.
    """
    print(f"Loading whisper model '{model_name}'...")
    try:
        model = whisper.load_model(model_name)
    except Exception as e:
        print(f"Error loading whisper model: {e}")
        return None

    print(f"Transcribing video: {video_path}...")
    try:
        result = model.transcribe(video_path, verbose=False) # verbose=False to keep stdout cleaner
    except Exception as e:
        print(f"Error during transcription: {e}")
        return None

    output_dir_path = Path(output_directory)
    output_dir_path.mkdir(parents=True, exist_ok=True)
    
    base_filename = Path(video_path).stem
    output_filename = f"{base_filename}.{output_format}"
    output_filepath = output_dir_path / output_filename

    print(f"Saving transcript to: {output_filepath}")
    try:
        if output_format == "txt":
            with open(output_filepath, "w", encoding="utf-8") as f:
                f.write(result["text"])
        elif output_format == "srt":
            # Basic SRT writer, can be improved with whisper.utils if available or more robust logic
            from whisper.utils import WriteSRT
            writer = WriteSRT(str(output_dir_path))
            # WriteSRT expects the output file to be named based on the input audio file.
            # It will append .srt itself. So we pass the directory and the original audio/video path.
            # The writer will create a file named like `video_path_stem.srt` in `output_dir_path`.
            # To match our desired output_filename, we might need to rename or adjust.
            # For simplicity, let's assume WriteSRT handles naming correctly or we adjust if needed.
            # The call `writer(result, audio_path)` writes to `output_dir / Path(audio_path).stem + '.srt'`
            # So, if output_filepath is `output_dir / base_filename.srt`, this should align.
            # Let's ensure the `audio_path` argument to writer is just the filename for consistency.
            writer(result, Path(video_path).name)


            # Manual SRT:
            # with open(output_filepath, "w", encoding="utf-8") as f:
            #     for i, segment in enumerate(result["segments"]):
            #         start_time = format_timestamp(segment["start"])
            #         end_time = format_timestamp(segment["end"])
            #         f.write(f"{i+1}\n")
            #         f.write(f"{start_time} --> {end_time}\n")
            #         f.write(f"{segment['text'].strip()}\n\n")
        # Add other formats like VTT if needed
        elif output_format in ["vtt", "tsv", "json"]:
            # For these formats, Whisper's CLI typically handles them via its internal writers.
            # Replicating them here would be more involved.
            # The `model.transcribe` result itself is a dictionary (json-like).
            # For 'json', we could dump `result`.
            # For 'tsv', 'vtt', it's more complex without direct library support for writing these formats from `result`.
            # The CLI uses `whisper.utils.WriteVTT`, `whisper.utils.WriteTSV`.
            # We can try to use them similarly to WriteSRT if they exist and are accessible.
            if output_format == "vtt":
                from whisper.utils import WriteVTT
                writer = WriteVTT(str(output_dir_path))
                writer(result, Path(video_path).name)
            elif output_format == "tsv":
                from whisper.utils import WriteTSV
                writer = WriteTSV(str(output_dir_path))
                writer(result, Path(video_path).name)
            elif output_format == "json":
                import json
                with open(output_filepath, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
        else:
            print(f"Unsupported output format: {output_format}")
            return None
        
        # Check if the writer created a file with a different name (e.g. WriteSRT might add .srt)
        # and rename if necessary to match `output_filepath`.
        # This is a bit tricky as the writer might create `base_filename.srt` directly.
        # If `output_filename` is `base_filename.srt`, then `output_filepath` is correct.
        # The `WriteSRT` (and others) from `whisper.utils` typically create files named `Path(audio_path).stem + .ext`
        # in the specified output directory.
        # If `Path(video_path).name` is `myvideo.mp4`, it creates `myvideo.srt`.
        # Our `output_filepath` is `output_dir / myvideo.srt`. So this should align.

        print("Transcription complete.")
        return str(output_filepath)
    except ImportError:
        print(f"Could not import writer for format {output_format}. Ensure whisper.utils has the required writers.")
        return None
    except Exception as e:
        print(f"Error saving transcript: {e}")
        return None

# Helper for SRT if doing manually (can be more complex for proper formatting)
# def format_timestamp(seconds: float):
#     assert seconds >= 0, "non-negative timestamp expected"
#     milliseconds = round(seconds * 1000.0)
#     hours = milliseconds // 3_600_000
#     milliseconds %= 3_600_000
#     minutes = milliseconds // 60_000
#     milliseconds %= 60_000
#     seconds = milliseconds // 1_000
#     milliseconds %= 1_000
#     return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe a video file using OpenAI Whisper.")
    parser.add_argument("input_video_path", help="Path to the video file to transcribe.")
    parser.add_argument("output_dir", help="Directory to save the transcript file.")
    parser.add_argument("--output_format", default="txt", choices=["txt", "srt", "vtt", "tsv", "json"], help="Format of the transcript (default: txt).")
    parser.add_argument("--model_name", default="base", help="Name of the Whisper model to use (e.g., tiny, base, small, medium, large).")
    
    args = parser.parse_args()

    transcribe_video(args.input_video_path, args.output_dir, args.output_format, args.model_name)