"use client"

import { useState } from "react" // Added import
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Download, AlertCircle } from "lucide-react"
import { WizardFormData } from "@/types/wizard" // Adjusted import path
import { callTranscribeVideoAPI } from "@/api/processing" // Added import

interface ResultsStepProps {
  formData: WizardFormData
}

export function ResultsStep({ formData }: ResultsStepProps) {
  const { t } = useLanguage()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const [transcribingVideoPath, setTranscribingVideoPath] = useState<string | null>(null)
  const [transcriptResults, setTranscriptResults] = useState<Record<string, { path?: string; error?: string }>>({})

  const handleStartTranscription = async (videoFilePath: string, outputFormat: "txt" | "srt" = "txt") => {
    setTranscribingVideoPath(videoFilePath)
    setTranscriptResults(prev => ({ ...prev, [videoFilePath]: { path: undefined, error: undefined } })) // Clear previous for this file

    try {
      // The serverVideoFilePath for callTranscribeVideoAPI should be relative to project root,
      // which formData.generatedFilePaths already are (e.g., "outputs/motion_model_outputs/job_id/video.mp4")
      const response = await callTranscribeVideoAPI(videoFilePath, outputFormat)
      setTranscriptResults(prev => ({
        ...prev,
        [videoFilePath]: { path: response.transcript_file_path, error: undefined },
      }))
    } catch (error: any) {
      console.error(`Transcription failed for ${videoFilePath}:`, error)
      const errorMessage = error.response?.data?.detail || error.message || "Transcription failed."
      setTranscriptResults(prev => ({
        ...prev,
        [videoFilePath]: { path: undefined, error: errorMessage },
      }))
    } finally {
      setTranscribingVideoPath(null)
    }
  }

  if (formData.isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-medium">{t("results.processing")}</h3>
        <p className="text-muted-foreground mt-2 text-center">
          Processing your video, please wait... This may take a few moments.
        </p>
      </div>
    )
  }

  if (formData.processingError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Processing Video</AlertTitle>
        <AlertDescription>{formData.processingError}</AlertDescription>
      </Alert>
    )
  }

  if (!formData.generatedFilePaths || formData.generatedFilePaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium">No Files Generated</h3>
        <p className="text-muted-foreground mt-2 text-center">
          No files were generated, or processing is not yet complete. Please ensure previous steps are complete or try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step5")}</h2>
        <p className="text-muted-foreground">
          Your generated files are ready! Preview and download them below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formData.generatedFilePaths.map((filePath) => {
          const fileUrl = `${API_URL}/static/${filePath}` // filePath is already relative to project root like "outputs/..."
          const fileName = filePath.substring(filePath.lastIndexOf("/") + 1)
          const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase()
          const currentTranscript = transcriptResults[filePath]

          if (["mp4", "mov", "webm", "ogv"].includes(extension)) {
            return (
              <div key={filePath} className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-md font-semibold mb-2 truncate" title={fileName}>{fileName}</h3>
                <div className="aspect-video bg-black rounded overflow-hidden mb-2">
                  <video controls width="100%" src={fileUrl} className="w-full h-full object-contain">
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center mt-2 space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <a href={fileUrl} download={fileName} className="flex items-center justify-center">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartTranscription(filePath)}
                    disabled={transcribingVideoPath === filePath}
                    className="w-full sm:w-auto"
                  >
                    {transcribingVideoPath === filePath ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {transcribingVideoPath === filePath ? "Transcribing..." : "Transcribe (TXT)"}
                  </Button>
                </div>
                {currentTranscript?.path && (
                  <a
                    href={`${API_URL}/static/${currentTranscript.path}`} // transcript_file_path is relative to project root
                    download={currentTranscript.path.split("/").pop()}
                    className="text-xs text-green-600 hover:underline block mt-2 text-center sm:text-left"
                  >
                    Download Transcript (.txt)
                  </a>
                )}
                {currentTranscript?.error && (
                  <p className="text-xs text-red-500 mt-2 text-center sm:text-left">Error: {currentTranscript.error}</p>
                )}
              </div>
            )
          } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
            return (
              <div key={filePath} className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-md font-semibold mb-2 truncate" title={fileName}>{fileName}</h3>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2">
                  <img src={fileUrl} alt={fileName} className="w-full h-full object-contain" />
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={fileUrl} download={fileName}>
                    <Download className="mr-2 h-4 w-4" /> Download Image
                  </a>
                </Button>
              </div>
            )
          } else {
            return (
              <div key={filePath} className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-md font-semibold mb-2 truncate" title={fileName}>{fileName}</h3>
                <p className="text-sm text-muted-foreground mb-2">Unsupported file type for preview.</p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={fileUrl} download={fileName}>
                    <Download className="mr-2 h-4 w-4" /> Download {fileName}
                  </a>
                </Button>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
