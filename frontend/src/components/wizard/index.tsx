"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Steps } from "@/components/wizard/steps"
import { VideoInput } from "@/components/wizard/video-input"
import { ModelSelection } from "@/components/wizard/model-selection"
import { FormatSettings } from "@/components/wizard/format-settings"
import { Customization } from "@/components/wizard/customization"
import { Results } from "@/components/wizard/results"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import type { VideoData, ModelType, AspectRatio, Duration, CustomOptions } from "@/types/wizard"

export default function Wizard() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // State for wizard data
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [modelType, setModelType] = useState<ModelType>("context")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16")
  const [duration, setDuration] = useState<Duration>("15s")
  const [customOptions, setCustomOptions] = useState<CustomOptions>({
    keywords: [],
    font: "Inter",
    transition: "fade",
  })
  const [result, setResult] = useState<any>(null)

  const handleNext = () => {
    if (currentStep === 1 && !videoData) {
      toast({
        title: "No video selected",
        description: "Please upload a video file or enter a YouTube URL",
        variant: "destructive",
      })
      return
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    setIsProcessing(true)

    try {
      // Mock API call to generate highlights
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock results data
      setResult({
        videoUrl: "/placeholder.svg?height=720&width=1280",
        description:
          "This highlight reel showcases the most impactful moments from the original video, focusing on key points about AI technology and its applications in video processing. The presenter discusses how machine learning models can identify patterns in video content to extract meaningful segments.",
        hashtags: ["#AIVideo", "#Highlights", "#MachineLearning", "#VideoProcessing", "#TechTalk"],
      })

      setIsComplete(true)
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Steps currentStep={currentStep} />

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        {currentStep === 1 && <VideoInput videoData={videoData} setVideoData={setVideoData} />}

        {currentStep === 2 && <ModelSelection selectedModel={modelType} setSelectedModel={setModelType} />}

        {currentStep === 3 && (
          <FormatSettings
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            duration={duration}
            setDuration={setDuration}
          />
        )}

        {currentStep === 4 && (
          <Customization options={customOptions} setOptions={setCustomOptions} modelType={modelType} />
        )}

        {currentStep === 5 && <Results isProcessing={isProcessing} isComplete={isComplete} result={result} />}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isProcessing}>
            {t("wizard.back")}
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext}>{t("wizard.next")}</Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isProcessing || isComplete}>
              {isProcessing ? t("results.processing") : t("wizard.process")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
