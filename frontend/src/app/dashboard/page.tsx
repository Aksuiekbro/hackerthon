"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/components/language-provider"
import { Download, Eye, Trash2, Loader2, Plus, Video } from "lucide-react"
import Link from "next/link"
import type { ModelType, AspectRatio, Duration } from "@/types/wizard"

type Project = {
  id: string
  title: string
  date: string
  thumbnail: string
  modelType: ModelType
  aspectRatio: AspectRatio
  duration: Duration
}

export default function DashboardPage() {
  // const { user, loading } = useAuth()
  const user = {}; // Temporarily set user to an empty object to allow rendering
  const loading = false; // Temporarily set loading to false
  const router = useRouter()
  const { t } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/dashboard")
    } else if (user) {
      // Mock API call to fetch user's projects
      setTimeout(() => {
        setProjects([
          {
            id: "proj-1",
            title: "Conference Keynote Highlights",
            date: "2025-05-12",
            thumbnail: "/placeholder.svg?height=200&width=300",
            modelType: "context",
            aspectRatio: "16:9",
            duration: "1m",
          },
          {
            id: "proj-2",
            title: "Dance Performance",
            date: "2025-05-10",
            thumbnail: "/placeholder.svg?height=200&width=300",
            modelType: "motion",
            aspectRatio: "9:16",
            duration: "15s",
          },
          {
            id: "proj-3",
            title: "Product Tutorial",
            date: "2025-05-05",
            thumbnail: "/placeholder.svg?height=200&width=300",
            modelType: "context",
            aspectRatio: "16:9",
            duration: "full",
          },
        ])
        setIsLoading(false)
      }, 1000)
    }
  }, [user, loading, router])

  if (loading || isLoading) {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">Your saved highlight projects</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.createNew")}
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">{t("dashboard.noProjects")}</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            You haven't created any highlight projects yet. Get started by creating your first highlight video.
          </p>
          <Button asChild className="mt-6">
            <Link href="/create">{t("dashboard.createNew")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={project.thumbnail || "/placeholder.svg"}
                  alt={project.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="secondary" className="capitalize">
                    {project.modelType === "context" ? "Context AI" : "Motion AI"}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    {project.aspectRatio}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {new Date(project.date).toLocaleDateString()} •{" "}
                  {project.duration === "15s" ? "15 seconds" : project.duration === "1m" ? "1 minute" : "Full set"}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/projects/${project.id}`}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
