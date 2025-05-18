"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "./use-local-storage"

type User = {
  id: string
  name: string
  email: string
  image?: string
}

/**
 * Utility to map a Supabase user object to our local User interface,
 * guaranteeing that name and email are always non-null strings.
 * If name is missing, falls back to email or "Anonymous User".
 * If email is missing, falls back to "unknown@example.com".
 */
function mapSupabaseUser(currentUser: any): User {
  return {
    id: currentUser.id,
    name:
      currentUser.user_metadata?.name ||
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.display_name ||
      currentUser.email ||
      "Anonymous User",
    email: currentUser.email || "unknown@example.com",
    image: currentUser.user_metadata?.avatar_url || undefined,
  }
}

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
  loading: boolean
}

// Mock data for demonstration
const MOCK_USER: User = {
  id: "user-1",
  name: "Demo User",
  email: "user@example.com",
  image: "/placeholder.svg?height=32&width=32",
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>("user", null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate auth state initialization
    // If using Supabase, you would do:
    // const { data: { user: currentUser } } = await supabase.auth.getUser();
    // if (currentUser) setUser(mapSupabaseUser(currentUser));
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email && password) {
      setUser(MOCK_USER)
      router.push("/dashboard")
    }
    setLoading(false)
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email && password && name) {
      const newUser = { ...MOCK_USER, email, name }
      setUser(newUser)
      router.push("/dashboard")
    }
    setLoading(false)
  }

  const signOut = () => {
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
