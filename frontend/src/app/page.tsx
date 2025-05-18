"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { UploadCloud, Wand2, Video, Download, ChevronRight } from "lucide-react"

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">{t("home.title")}</h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">{t("home.subtitle")}</p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/create">{t("home.getStarted")}</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#how-it-works">{t("home.howItWorks")}</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-full md:h-[450px] lg:h-[500px]">
                <Image
                  src="/placeholder.svg?height=500&width=800"
                  alt="Video highlights preview"
                  fill
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">{t("home.howItWorks")}</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Generate highlight videos in just a few simple steps
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Upload Video</h3>
              <p className="text-center text-muted-foreground">Upload your video or paste a YouTube link</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Choose AI Model</h3>
              <p className="text-center text-muted-foreground">Select between Context AI or Motion AI</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Customize</h3>
              <p className="text-center text-muted-foreground">Choose aspect ratio, duration, and more</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Get Results</h3>
              <p className="text-center text-muted-foreground">
                Download your highlight video with description and hashtags
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/create">
                {t("home.getStarted")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
