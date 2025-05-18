import axios from "axios";

// Define a type for the highlight structure returned by the YouTube API
export interface YouTubeHighlight {
  timestamp: string;
  summary: string;
}

// Define a type for the API response from /youtube/highlights
export interface YouTubeApiResponse {
  video_title: string;
  highlights: YouTubeHighlight[];
  download_path: string;
}

export const getYoutubeHighlights = async (url: string): Promise<YouTubeApiResponse> => {
  // Determine API URL (replace with your actual backend URL if different)
  // The project brief uses "http://localhost:8000/youtube/highlights"
  // The router in backend/api/youtube.py is mounted at root in main.py,
  // so the path is /youtube/highlights
  const apiUrl = process.env.NEXT_PUBLIC_API_URL 
                 ? `${process.env.NEXT_PUBLIC_API_URL}/youtube/highlights` 
                 : "http://localhost:8000/youtube/highlights";

  try {
    const response = await axios.post<YouTubeApiResponse>(apiUrl, { url });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error fetching YouTube highlights:", error.response.data);
      throw new Error(error.response.data.detail || "Failed to fetch YouTube highlights from server.");
    } else if (axios.isAxiosError(error) && error.request) {
      // The request was made but no response was received
      console.error("No response received for YouTube highlights request:", error.request);
      throw new Error("No response from server. Please check backend connectivity.");
    } else {
      // Something happened in setting up the request that triggered an Error
      // Handle unknown error type
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Error setting up YouTube highlights request:", message);
      throw new Error(message);
    }
  }
};
