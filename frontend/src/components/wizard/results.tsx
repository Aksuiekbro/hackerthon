"use client"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ResultsProps = {
  isProcessing: boolean
  isComplete: boolean
  result: any | null
}

export function Results({ isProcessing, isComplete, result }: ResultsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()

  const copyToClipboard = (text: string, type: "description" | "hashtags") => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${type === "description" ? "Description" : "Hashtags"} copied`,
      description: "Text has been copied to your clipboard",
    })
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-medium">{t("results.processing")}</h3>
        <p className="text-muted-foreground mt-2 text-center">
          This may take a few moments. We're extracting the best moments from your video.
        </p>
      </div>
    )
  }

  if (!isComplete || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium">{t("wizard.step5")}</h3>
        <p className="text-muted-foreground mt-2 text-center">
          Click the "Generate Highlights" button to process your video
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("wizard.step5")}</h2>
        <p className="text-muted-foreground">
          Your highlights are ready! Preview, download, and use generated content.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg overflow-hidden border">
          <video controls className="w-full aspect-video" poster={result.videoUrl}>
            <source src={result.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex justify-center">
          <Button className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> {t("results.download")}
          </Button>
        </div>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description">{t("results.description")}</TabsTrigger>
            <TabsTrigger value="hashtags">{t("results.hashtags")}</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="p-4 border rounded-md mt-2">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{t("results.description")}</h3>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.description, "description")}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <p className="text-sm">{result.description}</p>
          </TabsContent>
          <TabsContent value="hashtags" className="p-4 border rounded-md mt-2">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{t("results.hashtags")}</h3>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.hashtags.join(" "), "hashtags")}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.hashtags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
