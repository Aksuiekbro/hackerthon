"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Steps } from "@/components/wizard/steps"
import { VideoInput } from "@/components/wizard/video-input"
import { ModelSelection } from "@/components/wizard/model-selection"
import { FormatSettings } from "@/components/wizard/format-settings"
import { Customization } from "@/components/wizard/customization"
import { ResultsStep } from "@/components/wizard/results"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import type { WizardFormData, ModelType, AspectRatio, Duration, CustomOptions } from "@/types/wizard" // Removed VideoData
import { callProcessMotionAPI, callProcessTextAPI, ProcessApiResponse } from "@/api/processing";

export default function Wizard() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  // const [isProcessing, setIsProcessing] = useState(false) // Will be managed by formData
  const [isComplete, setIsComplete] = useState(false)

  // State for wizard data
  const [formData, setFormData] = useState<WizardFormData>({
    videoUrl: undefined,
    serverFilePath: undefined,
    selectedModelType: "motion",
    aspectRatio: "9:16",
    duration: "15s",
    customOptions: {
      keywords: [],
      font: "Inter",
      transition: "fade",
    },
    targetFormat: "both", // Default value for targetFormat
    numClips: 3,
    maxDurationYt: 59,
    processingJobId: undefined,
    generatedFilePaths: undefined,
    processingError: null,
    isProcessing: false,
  })
  const [result, setResult] = useState<any>(null) // This might be replaced or augmented by generatedFilePaths

  const updateFormData = (updatedFields: Partial<WizardFormData>) => {
    setFormData((prevData) => ({ ...prevData, ...updatedFields }))
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.videoUrl && !formData.serverFilePath) {
      toast({
        title: "No video selected",
        description: "Please upload a video file or enter a video URL",
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

  const handleGenerateHighlights = async () => {
        if (!formData.videoUrl && !formData.serverFilePath) {
            setFormData(prev => ({ ...prev, processingError: "Please provide a video URL or upload a file." }));
            toast({
                title: "Video source missing",
                description: "Please provide a video URL or upload a file.",
                variant: "destructive",
            });
            return;
        }
        if (!formData.selectedModelType) {
            setFormData(prev => ({ ...prev, processingError: "Please select an AI model." }));
            toast({
                title: "AI Model not selected",
                description: "Please select an AI model.",
                variant: "destructive",
            });
            return;
        }

        setFormData(prev => ({ ...prev, isProcessing: true, processingError: null, generatedFilePaths: [] }));

        const videoSource: { video_url?: string; server_file_path?: string } = {};
        if (formData.videoUrl) {
            videoSource.video_url = formData.videoUrl;
        } else if (formData.serverFilePath) {
            videoSource.server_file_path = formData.serverFilePath;
        }

        try {
            let response: ProcessApiResponse;
            if (formData.selectedModelType === 'motion') {
                response = await callProcessMotionAPI(videoSource);
            } else { // Assuming 'text' model
                response = await callProcessTextAPI(
                    videoSource,
                    formData.numClips || 3, // Ensure defaults if not set
                    formData.maxDurationYt || 59,
                    formData.targetFormat || 'both'
                );
            }
            setFormData(prev => ({
                ...prev,
                processingJobId: response.job_id,
                generatedFilePaths: response.generated_files,
                isProcessing: false,
            }));
            setIsComplete(true); // Mark as complete
            setCurrentStep(5); // Navigate to results step
            toast({
                title: "Processing Started",
                description: `Job ID: ${response.job_id}. Files will be generated.`,
            });
        } catch (error: any) {
            console.error("Processing failed:", error);
            const errorMessage = error.response?.data?.detail || error.message || "An unknown error occurred during processing.";
            setFormData(prev => ({ ...prev, processingError: errorMessage, isProcessing: false }));
            toast({
                title: "Processing Failed",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };


  // const handleGenerate = async () => { // Old handleGenerate, replaced by handleGenerateHighlights
  //   setIsProcessing(true)

  //   try {
  //     // Mock API call to generate highlights
  //     await new Promise((resolve) => setTimeout(resolve, 3000))

  //     // Mock results data
  //     setResult({
  //       videoUrl: "/placeholder.svg?height=720&width=1280",
  //       description:
  //         "This highlight reel showcases the most impactful moments from the original video, focusing on key points about AI technology and its applications in video processing. The presenter discusses how machine learning models can identify patterns in video content to extract meaningful segments.",
  //       hashtags: ["#AIVideo", "#Highlights", "#MachineLearning", "#VideoProcessing", "#TechTalk"],
  //     })

  //     setIsComplete(true)
  //   } catch (error) {
  //     toast({
  //       title: "Processing failed",
  //       description: "There was an error processing your video. Please try again.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsProcessing(false)
  //   }
  // }

  return (
    <div className="container w-full max-w-none py-8">
      <Steps currentStep={currentStep} />

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        {currentStep === 1 && <VideoInput formData={formData} updateFormData={updateFormData} />}

        {currentStep === 2 && <ModelSelection selectedModel={formData.selectedModelType} setSelectedModel={setFormData} />}

        {currentStep === 3 && (
          <FormatSettings
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {currentStep === 4 && (
          <Customization formData={formData} updateFormData={updateFormData} />
        )}

        {currentStep === 5 && <ResultsStep formData={formData} />}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || !!formData.isProcessing}>
            {t("wizard.back")}
          </Button>

          {currentStep < 4 ? ( // Go to next step
            <Button onClick={handleNext} disabled={!!formData.isProcessing}>{t("wizard.next")}</Button>
          ) : currentStep === 4 ? ( // On Customization step, button becomes "Generate Highlights"
            <Button onClick={handleGenerateHighlights} disabled={!!formData.isProcessing || isComplete}>
              {formData.isProcessing ? t("results.processing") : t("wizard.generateHighlights", "Generate Highlights")}
            </Button>
          ) : ( // On Results step (currentStep === 5)
            <Button onClick={() => router.push("/dashboard")} disabled={!!formData.isProcessing}>
              {t("wizard.finish", "Finish & View Dashboard")}
            </Button>
          )}
        </div>
        {formData.processingError && (
          <p className="mt-4 text-sm text-destructive">{formData.processingError}</p>
        )}
      </div>
    </div>
  )
}
