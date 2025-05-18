"use client"

import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

type StepsProps = {
  currentStep: number
}

export function Steps({ currentStep }: StepsProps) {
  const { t } = useLanguage()

  const steps = [
    { id: 1, title: t("wizard.step1") },
    { id: 2, title: t("wizard.step2") },
    { id: 3, title: t("wizard.step3") },
    { id: 4, title: t("wizard.step4") },
    { id: 5, title: t("wizard.step5") },
  ]

  return (
    <div className="hidden w-full justify-between sm:flex">
      {steps.map((step) => (
        <div key={step.id} className={cn("flex flex-col items-center", step.id !== steps.length && "relative")}>
          {step.id !== steps.length && (
            <div
              className={cn(
                "absolute left-[50%] top-[15px] h-[2px] w-full translate-y-[-50%]",
                step.id < currentStep ? "bg-primary" : "bg-muted-foreground/20",
              )}
            />
          )}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
              step.id === currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : step.id < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/20 bg-background text-muted-foreground",
            )}
          >
            {step.id}
          </div>
          <div
            className={cn(
              "mt-2 text-center text-xs font-medium",
              step.id === currentStep ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {step.title}
          </div>
        </div>
      ))}
    </div>
  )
}
