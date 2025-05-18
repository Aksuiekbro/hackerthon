"use client"

import { useLanguage } from "@/components/language-provider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { AspectRatio, Duration } from "@/types/wizard"
import { Smartphone, Monitor, Clock } from "lucide-react"

type FormatSettingsProps = {
  aspectRatio: AspectRatio
  setAspectRatio: (ratio: AspectRatio) => void
  duration: Duration
  setDuration: (duration: Duration) => void
}

export function FormatSettings({ aspectRatio, setAspectRatio, duration, setDuration }: FormatSettingsProps) {
  const { t } = useLanguage()

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
            onValueChange={(value) => setAspectRatio(value as AspectRatio)}
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
            onValueChange={(value) => setDuration(value as Duration)}
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
      </div>
    </div>
  )
}
