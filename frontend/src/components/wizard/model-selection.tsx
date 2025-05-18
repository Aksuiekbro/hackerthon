"use client"

import { useLanguage } from "@/components/language-provider"
import { type ModelType, type WizardFormData, isModelType } from "@/types/wizard" // Added WizardFormData and isModelType
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import React from "react" // Added React for Dispatch and SetStateAction

type ModelSelectionProps = {
  selectedModel: ModelType | undefined
  setSelectedModel: React.Dispatch<React.SetStateAction<WizardFormData>> // Changed type
}

export function ModelSelection({ selectedModel, setSelectedModel }: ModelSelectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step2")}</h2>
        <p className="text-muted-foreground">Choose which AI model to use for generating your highlights. You can choose between Motion Model and Text Model.</p>
      </div>

      <RadioGroup
        defaultValue={selectedModel}
        onValueChange={(value: string) => {
          if (isModelType(value)) {
            setSelectedModel(prev => ({ ...prev, selectedModelType: value }))
          }
        }}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2 rounded-md border p-4 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors">
          <RadioGroupItem value="motion" id="motion-model" />
          <Label htmlFor="motion-model" className="flex-1 cursor-pointer">
            <span className="font-semibold">Motion Model</span>
            <p className="text-sm text-muted-foreground">
              Perfect for sports, dances, and action videos. Detects moments with high motion or activity.
            </p>
          </Label>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-4 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors">
          <RadioGroupItem value="text" id="text-model" />
          <Label htmlFor="text-model" className="flex-1 cursor-pointer">
            <span className="font-semibold">Text Model</span>
            <p className="text-sm text-muted-foreground">
              Great for speeches, interviews, and presentations. Analyses audio transcripts to find key moments.
            </p>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
