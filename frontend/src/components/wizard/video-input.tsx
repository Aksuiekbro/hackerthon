"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import type { VideoData } from "@/types/wizard"
import { Upload, Youtube, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type VideoInputProps = {
  videoData: VideoData | null
  setVideoData: (data: VideoData | null) => void
}

export function VideoInput({ videoData, setVideoData }: VideoInputProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"upload" | "youtube">("upload")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const fileUrl = URL.createObjectURL(file)
      setVideoData({
        type: "file",
        file,
        url: fileUrl,
        name: file.name,
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
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

      const fileUrl = URL.createObjectURL(file)
      setVideoData({
        type: "file",
        file,
        url: fileUrl,
        name: file.name,
      })
    }
  }

  const handleYoutubeSubmit = () => {
    // Very basic validation
    if (!youtubeUrl.includes("youtube.com/") && !youtubeUrl.includes("youtu.be/")) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      })
      return
    }

    setVideoData({
      type: "youtube",
      url: youtubeUrl,
      name: "YouTube Video",
    })
  }

  const clearVideo = () => {
    setVideoData(null)
    setYoutubeUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step1")}</h2>
        <p className="text-muted-foreground">Upload a video file or provide a YouTube link</p>
      </div>

      {videoData ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {videoData.type === "file" ? (
                  <div className="relative h-16 w-24 overflow-hidden rounded">
                    <video src={videoData.url} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                    <Youtube className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{videoData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {videoData.type === "file"
                      ? `${Math.round((videoData.file.size / 1024 / 1024) * 100) / 100} MB`
                      : "YouTube URL"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearVideo} aria-label="Remove video">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue="upload"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "upload" | "youtube")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t("wizard.upload")}</TabsTrigger>
            <TabsTrigger value="youtube">{t("wizard.youtube")}</TabsTrigger>
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
                id="video-upload"
              />
              <Button onClick={() => fileInputRef.current?.click()}>{t("wizard.selectFile")}</Button>
            </div>
          </TabsContent>
          <TabsContent value="youtube" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <Button onClick={handleYoutubeSubmit}>Submit</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
