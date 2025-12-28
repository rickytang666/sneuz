import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
          Sneuz
        </h1>
        <p className="text-muted-foreground text-lg">
          Master your sleep schedule. Simple, manual, effective.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}
