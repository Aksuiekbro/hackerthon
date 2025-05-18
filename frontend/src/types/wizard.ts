export type VideoData = {
  type: "file" | "youtube"
  url: string
  name: string
  file?: File
}

export type ModelType = "motion" | "text" | "context"

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

// Type Guards
export const MODEL_TYPES: ModelType[] = ["motion", "text", "context"];
export function isModelType(value: any): value is ModelType {
  return MODEL_TYPES.includes(value);
}

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "16:9"];
export function isAspectRatio(value: any): value is AspectRatio {
  return ASPECT_RATIOS.includes(value);
}

export const DURATIONS: Duration[] = ["15s", "1m", "full"];
export function isDuration(value: any): value is Duration {
  return DURATIONS.includes(value);
}

export type SupportedLanguage = "en" | "ru";
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "ru"];
export function isSupportedLanguage(value: any): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value);
}
