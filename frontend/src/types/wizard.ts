export type VideoData = {
  type: "file" | "youtube"
  url: string
  name: string
  file?: File
}

export type ModelType = "motion" | "text"

export type AspectRatio = "9:16" | "16:9"

export type Duration = "15s" | "1m" | "full"

export type CustomOptions = {
  keywords: string[]
  font: string
  transition: string
}

export interface WizardFormData {
  videoUrl?: string; // For pasted URLs
  serverFilePath?: string; // For uploaded files (path returned by backend)
  selectedModelType?: ModelType
  aspectRatio?: AspectRatio
  duration?: Duration
  customOptions?: CustomOptions
  targetFormat?: 'youtube' | 'instagram' | 'both';
  numClips?: number;
  maxDurationYt?: number;
  processingJobId?: string;
  generatedFilePaths?: string[];
  processingError?: string | null;
  isProcessing?: boolean;
}
