"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react" // Added useEffect
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Upload, Youtube, X, Loader2 } from "lucide-react" // Added Loader2
import { useToast } from "@/hooks/use-toast"
import type { WizardFormData } from "@/types/wizard" // Changed VideoData to WizardFormData
import { uploadVideoFileAPI, FileUploadResponse } from "@/api/processing" // Added API import

type VideoInputProps = {
  formData: WizardFormData
  updateFormData: (data: Partial<WizardFormData>) => void
}

export function VideoInput({ formData, updateFormData }: VideoInputProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload") // Changed "youtube" to "url"
  const [localVideoUrl, setLocalVideoUrl] = useState(formData.videoUrl || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync localVideoUrl with formData on initial load or when formData.videoUrl changes externally
  useEffect(() => {
    setLocalVideoUrl(formData.videoUrl || "");
  }, [formData.videoUrl]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.includes("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file);
      setLocalVideoUrl(''); // Clear URL if a file is chosen
      updateFormData({ videoUrl: undefined, serverFilePath: undefined }); // Clear previous
      setIsUploading(true);
      setUploadError(null);
      try {
        const response = await uploadVideoFileAPI(file);
        updateFormData({ serverFilePath: response.server_file_path, videoUrl: undefined });
        toast({ title: "File Uploaded", description: file.name });
      } catch (error: any) {
        console.error("File upload failed:", error);
        const errorMsg = error.response?.data?.detail || error.message || "File upload failed. Please try again.";
        setUploadError(errorMsg);
        updateFormData({ serverFilePath: undefined }); // Clear server path on error
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.type.includes("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file);
      setLocalVideoUrl(''); // Clear URL if a file is chosen
      updateFormData({ videoUrl: undefined, serverFilePath: undefined }); // Clear previous
      setIsUploading(true);
      setUploadError(null);
      try {
        const response = await uploadVideoFileAPI(file);
        updateFormData({ serverFilePath: response.server_file_path, videoUrl: undefined });
        toast({ title: "File Uploaded", description: file.name });
      } catch (error: any) {
        console.error("File upload failed:", error);
        const errorMsg = error.response?.data?.detail || error.message || "File upload failed. Please try again.";
        setUploadError(errorMsg);
        updateFormData({ serverFilePath: undefined }); // Clear server path on error
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    }
  }

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setLocalVideoUrl(newUrl);
    // Debounce or submit on button click? For now, update formData directly.
    // Consider adding a submit button for URL if direct update is too aggressive.
    updateFormData({ videoUrl: newUrl, serverFilePath: undefined });
    setSelectedFile(null); // Clear selected file if URL is being typed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  };


  const clearVideo = () => {
    updateFormData({ videoUrl: undefined, serverFilePath: undefined })
    setLocalVideoUrl("")
    setSelectedFile(null)
    setUploadError(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileNameFromPath = (path?: string) => {
    if (!path) return "Uploaded Video";
    return path.split(/[\\/]/).pop() || "Uploaded Video";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step1")}</h2>
        <p className="text-muted-foreground">Upload a video file or provide a video URL</p>
      </div>

      {formData.videoUrl || formData.serverFilePath || selectedFile ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {formData.serverFilePath || selectedFile ? (
                  <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                    <Youtube className="h-8 w-8 text-muted-foreground" /> {/* Or a generic URL icon */}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {formData.serverFilePath
                      ? getFileNameFromPath(formData.serverFilePath)
                      : selectedFile
                      ? selectedFile.name
                      : formData.videoUrl || "Video URL"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.serverFilePath || selectedFile
                      ? selectedFile ? `${Math.round((selectedFile.size / 1024 / 1024) * 100) / 100} MB` : "Uploaded File"
                      : "Video URL"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearVideo} aria-label="Remove video">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isUploading && (
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading {selectedFile?.name}...
              </div>
            )}
            {uploadError && (
              <p className="mt-2 text-sm text-destructive">{uploadError}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue="upload"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "upload" | "url")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t("wizard.upload")}</TabsTrigger>
            <TabsTrigger value="url">{t("wizard.videoUrl")}</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging ? "border-primary" : "border-muted-foreground/25"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-xl font-medium">{t("wizard.dragDrop")}</p>
              <p className="mb-4 text-sm text-muted-foreground">{t("wizard.or")}</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload-input" // Changed id to avoid conflict if any
                disabled={isUploading}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("wizard.selectFile")}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="url" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url-input">Video URL</Label>
                <Input
                  id="video-url-input"
                  placeholder="e.g., https://example.com/video.mp4"
                  value={localVideoUrl}
                  onChange={handleUrlInputChange}
                  disabled={isUploading}
                />
                {/* Removed the explicit submit button for URL, updates on change */}
                {/* If a submit button is desired, it can be added back here */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
