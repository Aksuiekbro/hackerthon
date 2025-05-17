# Mock ML Core for Highlight Extraction

def extract_highlights_mock(video_path: str, video_id: str = "unknown_video"):
    """
    Mock function to simulate extracting highlights from a video.
    In a real application, this function would involve complex ML models
    to analyze video content, identify key moments, generate timestamps,
    and possibly captions.

    For now, it returns a predefined set of dummy highlights.

    Args:
        video_path (str): Path to the video file (not used in mock).
        video_id (str): An identifier for the video.

    Returns:
        dict: A dictionary containing mock highlight data.
    """
    print(f"Mock ML Core: 'Processing' video {video_id} at {video_path}...")
    
    # Simulate some processing time if needed
    # import time
    # time.sleep(2) 

    mock_data = {
        "video_id": video_id,
        "status": "highlights_extracted_mock",
        "highlights": [
            {
                "timestamp_start": "00:00:05", 
                "timestamp_end": "00:00:12", 
                "caption": "Mock highlight: Opening scene"
            },
            {
                "timestamp_start": "00:01:15", 
                "timestamp_end": "00:01:25", 
                "caption": "Mock highlight: Key event A"
            },
            {
                "timestamp_start": "00:03:30", 
                "timestamp_end": "00:03:40", 
                "caption": "Mock highlight: Important dialogue"
            }
        ],
        "summary": "This is a mock summary of the video content."
    }
    
    print(f"Mock ML Core: Finished 'processing' video {video_id}.")
    return mock_data

if __name__ == '__main__':
    # Example usage:
    test_video_path = "path/to/some/dummy/video.mp4"
    test_video_id = "test_video_001"
    highlights = extract_highlights_mock(test_video_path, test_video_id)
    import json
    print("\nGenerated Mock Highlights:")
    print(json.dumps(highlights, indent=2))
