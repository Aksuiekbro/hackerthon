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
