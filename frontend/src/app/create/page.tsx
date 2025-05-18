"use client"

import Wizard from "@/components/wizard"
// // import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function CreatePage() {
  // // const { user, loading } = useAuth()
  const user = {}; // Temporarily set user to an empty object to allow rendering
  const loading = false; // Temporarily set loading to false
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/create")
    }
  }, [user, loading, router])

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

  return <Wizard />
}
