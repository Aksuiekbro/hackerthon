"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { ModelType } from "@/types/wizard"
import { Brain, Activity } from "lucide-react"

type ModelSelectionProps = {
  selectedModel: ModelType
  setSelectedModel: (model: ModelType) => void
}

export function ModelSelection({ selectedModel, setSelectedModel }: ModelSelectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step2")}</h2>
        <p className="text-muted-foreground">Choose which AI model to use for generating your highlights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-colors ${
            selectedModel === "context" ? "border-primary bg-primary/5" : "hover:border-primary/50"
          }`}
          onClick={() => setSelectedModel("context")}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{t("model.context")}</CardTitle>
              <div
                className={`rounded-full p-2 ${
                  selectedModel === "context" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Brain className="h-5 w-5" />
              </div>
            </div>
            <CardDescription>{t("model.contextDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground list-disc space-y-1 pl-5">
              <li>Great for speeches, interviews, and presentations</li>
              <li>Analyses audio transcripts to find key moments</li>
              <li>Can be guided by specific keywords</li>
              <li>Best for content-focused videos</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            selectedModel === "motion" ? "border-primary bg-primary/5" : "hover:border-primary/50"
          }`}
          onClick={() => setSelectedModel("motion")}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{t("model.motion")}</CardTitle>
              <div
                className={`rounded-full p-2 ${
                  selectedModel === "motion" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <CardDescription>{t("model.motionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground list-disc space-y-1 pl-5">
              <li>Perfect for sports, dances, and action videos</li>
              <li>Detects moments with high motion or activity</li>
              <li>Identifies exciting visual events</li>
              <li>Best for action-packed content</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
