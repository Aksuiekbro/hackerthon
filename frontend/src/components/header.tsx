"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoonIcon, SunIcon, Globe, User } from "lucide-react"
import ActualNextThemes from "next-themes" // Assuming next-themes default exports an object
import { useLanguage } from "./language-provider"
import { useEffect, useState } from "react"
// // import { useAuth } from "@/hooks/use-auth"

export default function Header() {
  // Assuming useTheme is a property on the default export
  const { setTheme } = ActualNextThemes.useTheme()
  const { language, setLanguage, t } = useLanguage()
  const pathname = usePathname()
  // // const { user, signOut } = useAuth()
  const user = null; // Temporarily set user to null
  const signOut = () => {}; // Temporarily set signOut to a no-op
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="font-bold">
            <span className="hidden sm:inline-block">AI Video Highlights</span>
            <span className="sm:hidden">AIVH</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link href="/" className={pathname === "/" ? "font-semibold" : "text-muted-foreground"}>
              {t("header.home")}
            </Link>
            <Link
              href="/dashboard"
              className={pathname.startsWith("/dashboard") ? "font-semibold" : "text-muted-foreground"}
            >
              {t("header.dashboard")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Toggle language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>English {language === "en" && "✓"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ru")}>Русский {language === "ru" && "✓"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{t("header.dashboard")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">{t("header.settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>{t("header.logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : ( */}
            <Button asChild variant="outline" size="sm">
              <Link href="/login">{t("header.login")}</Link>
            </Button>
          {/* )} */}
        </div>
      </div>
    </header>
  )
}
