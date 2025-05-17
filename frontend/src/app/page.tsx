"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a type for the highlight structure
interface Highlight {
  timestamp_start: string;
  timestamp_end: string;
  caption: string;
}

// Define a type for the API response
interface ApiResponse {
  video_id: string;
  status: string;
  highlights: Highlight[];
  summary?: string; // Optional summary
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setApiResponse(null); // Reset previous results
      setError(null); // Reset previous errors
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a video file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    const formData = new FormData();
    formData.append("file", file);

    // Determine API URL (replace with your actual backend URL if different)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/upload";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        // Note: Do not set 'Content-Type' header when using FormData with fetch,
        // the browser will set it correctly with the boundary.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error occurred" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setApiResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to upload video or parse response.");
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-zinc-800 dark:text-zinc-100">
            AI Video Highlights
          </CardTitle>
          <CardDescription className="text-center text-zinc-600 dark:text-zinc-400">
            Upload your video to get AI-generated highlights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="video-upload" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Choose video file
              </label>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-700 dark:file:text-zinc-100 dark:hover:file:bg-zinc-600"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600" disabled={isLoading}>
              {isLoading ? "Uploading & Processing..." : "Get Highlights"}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiResponse && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                Processed Video: {apiResponse.video_id}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Status: {apiResponse.status}</p>
              
              {apiResponse.summary && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-200">Summary:</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{apiResponse.summary}</p>
                </div>
              )}

              <h4 className="font-semibold text-zinc-700 dark:text-zinc-200">Highlights:</h4>
              {apiResponse.highlights.length > 0 ? (
                <ul className="space-y-3">
                  {apiResponse.highlights.map((highlight, index) => (
                    <li key={index} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md shadow-sm">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {highlight.timestamp_start} - {highlight.timestamp_end}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{highlight.caption}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No highlights were extracted.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
