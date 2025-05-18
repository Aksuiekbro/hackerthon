"use client"

import { useLanguage } from "@/components/language-provider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type WizardFormData, isAspectRatio, isDuration, type AspectRatio, type Duration } from "@/types/wizard" // Import WizardFormData and guards
import { Smartphone, Monitor, Clock } from "lucide-react"

type FormatSettingsProps = {
  formData: WizardFormData
  updateFormData: (updatedFields: Partial<WizardFormData>) => void
}

export function FormatSettings({ formData, updateFormData }: FormatSettingsProps) {
  const { t } = useLanguage()
  const { aspectRatio, duration, selectedModelType, targetFormat } = formData

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step3")}</h2>
        <p className="text-muted-foreground">Choose the format for your highlight video</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label>{t("format.aspectRatio")}</Label>
          <RadioGroup
            value={aspectRatio}
            onValueChange={(value) => {
              if (isAspectRatio(value)) {
                updateFormData({ aspectRatio: value })
              }
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="9:16" id="portrait" className="peer sr-only" />
              <Label
                htmlFor="portrait"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Smartphone className="mb-3 h-10 w-10" />
                <div className="space-y-1 text-center">
                  <p className="font-medium leading-none">{t("format.portrait")}</p>
                  <p className="text-sm text-muted-foreground">Best for mobile platforms</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="16:9" id="landscape" className="peer sr-only" />
              <Label
                htmlFor="landscape"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Monitor className="mb-3 h-10 w-10" />
                <div className="space-y-1 text-center">
                  <p className="font-medium leading-none">{t("format.landscape")}</p>
                  <p className="text-sm text-muted-foreground">Best for YouTube/desktop</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label>{t("format.duration")}</Label>
          <RadioGroup
            value={duration}
            onValueChange={(value) => {
              if (isDuration(value)) {
                updateFormData({ duration: value })
              }
            }}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="15s" id="15s" className="peer sr-only" />
              <Label
                htmlFor="15s"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Clock className="mb-3 h-6 w-6" />
                <div className="space-y-1 text-center">
                  <p className="font-medium leading-none">{t("format.short")}</p>
                  <p className="text-xs text-muted-foreground">Quick social snippet</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="1m" id="1m" className="peer sr-only" />
              <Label
                htmlFor="1m"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Clock className="mb-3 h-6 w-6" />
                <div className="space-y-1 text-center">
                  <p className="font-medium leading-none">{t("format.medium")}</p>
                  <p className="text-xs text-muted-foreground">Comprehensive summary</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="full" id="full" className="peer sr-only" />
              <Label
                htmlFor="full"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Clock className="mb-3 h-6 w-6" />
                <div className="space-y-1 text-center">
                  <p className="font-medium leading-none">{t("format.full")}</p>
                  <p className="text-xs text-muted-foreground">Complete highlights set</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {selectedModelType === 'text' && (
          <div className="space-y-4">
            <Label htmlFor="target-format">Target Platform(s)</Label>
            <RadioGroup
              id="target-format"
              value={targetFormat || "both"}
              onValueChange={(value: 'youtube' | 'instagram' | 'both') => {
                updateFormData({ targetFormat: value });
              }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="youtube" id="format-youtube" className="peer sr-only" />
                <Label
                  htmlFor="format-youtube"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <p className="font-medium leading-none">YouTube</p>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="instagram" id="format-instagram" className="peer sr-only" />
                <Label
                  htmlFor="format-instagram"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <p className="font-medium leading-none">Instagram</p>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="both" id="format-both" className="peer sr-only" />
                <Label
                  htmlFor="format-both"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <p className="font-medium leading-none">Both</p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  )
}
