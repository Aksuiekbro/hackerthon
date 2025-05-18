"use client"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Download, AlertCircle } from "lucide-react"
import { WizardFormData } from "@/types/wizard" // Adjusted import path

interface ResultsStepProps {
  formData: WizardFormData
}

export function ResultsStep({ formData }: ResultsStepProps) {
  const { t } = useLanguage()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
          const fileUrl = `${API_URL}/static/outputs/${filePath}`
          const fileName = filePath.substring(filePath.lastIndexOf("/") + 1)
          const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase()

          if (["mp4", "mov", "webm", "ogv"].includes(extension)) {
            return (
              <div key={filePath} className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-md font-semibold mb-2 truncate" title={fileName}>{fileName}</h3>
                <div className="aspect-video bg-black rounded overflow-hidden mb-2">
                  <video controls width="100%" src={fileUrl} className="w-full h-full object-contain">
                    Your browser does not support the video tag.
                  </video>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={fileUrl} download={fileName}>
                    <Download className="mr-2 h-4 w-4" /> Download Video
                  </a>
                </Button>
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
