"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { Loader2, Save } from "lucide-react"
import {
  type AspectRatio,
  type Duration,
  type ModelType,
  isModelType,
  isAspectRatio,
  isDuration,
  type SupportedLanguage,
  isSupportedLanguage,
} from "@/types/wizard"

export default function SettingsPage() {
  // const { user, loading } = useAuth()
  const user = null; // Temporarily set user to null
  const loading = false; // Temporarily set loading to false
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [defaultModel, setDefaultModel] = useState<ModelType>("text")
  const [defaultAspect, setDefaultAspect] = useState<AspectRatio>("9:16")
  const [defaultDuration, setDefaultDuration] = useState<Duration>("15s")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/settings")
    } else if (user) {
      setName(user.name ?? '')
      setEmail(user.email ?? '')
    }
  }, [user, loading, router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSaving(false)
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="account" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">{t("settings.account")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("settings.preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account")}</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("settings.save")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.preferences")}</CardTitle>
              <CardDescription>Customize your app experience and defaults</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("settings.language")}</Label>
                    <Select
                      value={language}
                      onValueChange={(value) => {
                        if (isSupportedLanguage(value)) {
                          setLanguage(value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.theme")}</Label>
                    <Select value={theme} onValueChange={(value) => setTheme(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>{t("settings.defaultModel")}</Label>
                    <RadioGroup
                      value={defaultModel}
                      onValueChange={(value) => {
                        if (isModelType(value)) {
                          setDefaultModel(value)
                        }
                      }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="context" id="default-context" className="peer sr-only" />
                        <Label
                          htmlFor="default-context"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("model.context")}</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value="motion" id="default-motion" className="peer sr-only" />
                        <Label
                          htmlFor="default-motion"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("model.motion")}</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.defaultAspect")}</Label>
                    <RadioGroup
                      value={defaultAspect}
                      onValueChange={(value) => {
                        if (isAspectRatio(value)) {
                          setDefaultAspect(value)
                        }
                      }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="9:16" id="default-portrait" className="peer sr-only" />
                        <Label
                          htmlFor="default-portrait"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("format.portrait")}</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value="16:9" id="default-landscape" className="peer sr-only" />
                        <Label
                          htmlFor="default-landscape"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("format.landscape")}</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.defaultDuration")}</Label>
                    <RadioGroup
                      value={defaultDuration}
                      onValueChange={(value) => {
                        if (isDuration(value)) {
                          setDefaultDuration(value)
                        }
                      }}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="15s" id="default-15s" className="peer sr-only" />
                        <Label
                          htmlFor="default-15s"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("format.short")}</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value="1m" id="default-1m" className="peer sr-only" />
                        <Label
                          htmlFor="default-1m"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("format.medium")}</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value="full" id="default-full" className="peer sr-only" />
                        <Label
                          htmlFor="default-full"
                          className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-1">
                            <p className="font-medium leading-none">{t("format.full")}</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("settings.save")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
