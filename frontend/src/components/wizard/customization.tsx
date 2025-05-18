"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { X } from "lucide-react"
import { useState } from "react"
import type { WizardFormData, CustomOptions, ModelType } from "@/types/wizard" // Added WizardFormData

type CustomizationProps = {
  formData: WizardFormData // Changed from options and modelType
  updateFormData: (updatedFields: Partial<WizardFormData>) => void // Changed from setOptions
}

export function Customization({ formData, updateFormData }: CustomizationProps) {
  const { t } = useLanguage()
  const [keywordInput, setKeywordInput] = useState("")
  const { customOptions, selectedModelType, numClips, maxDurationYt } = formData // Destructure for easier access

  const fontOptions = [
    { value: "Inter", label: "Inter" },
    { value: "Arial", label: "Arial" },
    { value: "Roboto", label: "Roboto" },
    { value: "Georgia", label: "Georgia" },
    { value: "Montserrat", label: "Montserrat" },
  ]

  const transitionOptions = [
    { value: "none", label: "None (cut)" },
    { value: "fade", label: "Fade" },
    { value: "crossfade", label: "Cross Fade" },
    { value: "slide", label: "Slide" },
    { value: "zoom", label: "Zoom" },
  ]

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    if (keywordInput.trim() !== "" && !customOptions.keywords.includes(keywordInput.trim())) {
      updateFormData({
        customOptions: {
          ...customOptions,
          keywords: [...customOptions.keywords, keywordInput.trim()],
        },
      })
      setKeywordInput("")
    }
  }

  const removeKeyword = (keyword: string) => {
    updateFormData({
      customOptions: {
        ...customOptions,
        keywords: customOptions.keywords.filter((k) => k !== keyword),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step4")}</h2>
        <p className="text-muted-foreground">{t("custom.title")}</p>
      </div>

      <div className="space-y-6">
        {/* Keywords section - assuming 'context' was a typo and meant 'text' or similar for keyword relevance */}
        {/* If 'context' is a specific model type, this logic remains. Otherwise, adjust as needed. */}
        {/* For this task, we focus on the new 'text' model specific settings. */}
        {selectedModelType === "text" && ( // Changed from modelType to selectedModelType
          <div className="space-y-2">
            <Label htmlFor="keywords">{t("custom.keywords")}</Label>
            <form onSubmit={addKeyword} className="flex space-x-2">
              <Input
                id="keywords"
                placeholder={t("custom.keywordsHint")}
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-2">
              {customOptions.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="px-2 py-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {customOptions.keywords.length === 0 && <p className="text-sm text-muted-foreground">No keywords added yet</p>}
            </div>
          </div>
        )}

        {/* Conditional UI for Text Model */}
        {selectedModelType === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="num-clips">Number of Clips per Platform</Label>
              <Input
                id="num-clips"
                type="number"
                min="1"
                value={numClips || 3}
                onChange={(e) => {
                  updateFormData({ numClips: parseInt(e.target.value, 10) || 1 });
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-duration-yt">Max YouTube Short Duration (seconds)</Label>
              <Input
                id="max-duration-yt"
                type="number"
                min="10"
                max="60"
                value={maxDurationYt || 59}
                onChange={(e) => {
                  updateFormData({ maxDurationYt: parseInt(e.target.value, 10) || 59 });
                }}
                className="w-full"
              />
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font">{t("custom.font")}</Label>
            <Select value={customOptions.font} onValueChange={(value) => updateFormData({ customOptions: { ...customOptions, font: value } })}>
              <SelectTrigger id="font">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transition">{t("custom.transition")}</Label>
            <Select value={customOptions.transition} onValueChange={(value) => updateFormData({ customOptions: { ...customOptions, transition: value } })}>
              <SelectTrigger id="transition">
                <SelectValue placeholder="Select transition style" />
              </SelectTrigger>
              <SelectContent>
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
