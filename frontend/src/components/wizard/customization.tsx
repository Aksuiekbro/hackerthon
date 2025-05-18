"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { X } from "lucide-react"
import { useState } from "react"
import type { CustomOptions, ModelType } from "@/types/wizard"

type CustomizationProps = {
  options: CustomOptions
  setOptions: (options: CustomOptions) => void
  modelType: ModelType
}

export function Customization({ options, setOptions, modelType }: CustomizationProps) {
  const { t } = useLanguage()
  const [keywordInput, setKeywordInput] = useState("")

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
    if (keywordInput.trim() !== "" && !options.keywords.includes(keywordInput.trim())) {
      setOptions({
        ...options,
        keywords: [...options.keywords, keywordInput.trim()],
      })
      setKeywordInput("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setOptions({
      ...options,
      keywords: options.keywords.filter((k) => k !== keyword),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step4")}</h2>
        <p className="text-muted-foreground">{t("custom.title")}</p>
      </div>

      <div className="space-y-6">
        {modelType === "context" && (
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
              {options.keywords.map((keyword) => (
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
              {options.keywords.length === 0 && <p className="text-sm text-muted-foreground">No keywords added yet</p>}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font">{t("custom.font")}</Label>
            <Select value={options.font} onValueChange={(value) => setOptions({ ...options, font: value })}>
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
            <Select value={options.transition} onValueChange={(value) => setOptions({ ...options, transition: value })}>
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
