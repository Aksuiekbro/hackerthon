"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "./use-local-storage"
import { supabase } from '@/lib/supabase'; // Corrected to use standard Next.js path alias @/lib/supabase
import { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js";

export interface User {
 id: string;
 email: string; // Must be a non-nullable string
 name: string;  // Must be a non-nullable string
}

/**
* Utility to map a Supabase user object to our local User interface,
* guaranteeing that name and email are always non-null strings.
* If name is missing, falls back to email or "Anonymous User".
* If email is missing, falls back to "unknown@example.com".
*/
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const emailString = supabaseUser.email ?? 'unknown@example.com';
  let nameString = 'Anonymous User'; // Default

  if (supabaseUser.user_metadata) { // Check if user_metadata itself exists
    nameString =
      supabaseUser.user_metadata.name ||
      supabaseUser.user_metadata.full_name ||
      emailString; // Fallback to email if metadata names are missing
  } else {
    nameString = emailString; // Fallback to email if no user_metadata
  }
  // Final fallback if email was also somehow empty (though emailString should prevent this)
  if (!nameString) nameString = 'Anonymous User';


  return {
    id: supabaseUser.id,
    email: emailString,
    name: nameString, // Ensure this is definitively a string
  };
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>("user", null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user;
      if (currentUser) {
        // Critically ensure that setUser is called with the output of mapSupabaseUser(currentUser).
        // Using 'currentUser as any' as per instruction's example,
        // consider using 'currentUser as SupabaseUser' with the import above for better type safety.
        setUser(mapSupabaseUser(currentUser as SupabaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

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
