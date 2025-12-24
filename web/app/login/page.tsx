"use client"
import { LoginForm } from "@/components/login-form"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconChevronLeft } from "@tabler/icons-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Button variant="ghost" asChild>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <IconChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
