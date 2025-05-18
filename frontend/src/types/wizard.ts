export type VideoData = {
  type: "file" | "youtube"
  url: string
  name: string
  file?: File
}

export type ModelType = "context" | "motion"

export type AspectRatio = "9:16" | "16:9"

export type Duration = "15s" | "1m" | "full"

export type CustomOptions = {
  keywords: string[]
  font: string
  transition: string
}
