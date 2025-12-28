import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 transition-colors duration-500">
      {/* Static Gradient Layer - Brand Purple (Top Right) - 2x More Obvious */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-90 dark:opacity-50"
        style={{
          background: "radial-gradient(ellipse 900px 700px at 80% 15%, rgba(139, 92, 246, 0.45), transparent 55%)"
        }}
      />
      
      {/* Static Gradient Layer - Brand Pink (Bottom Left) - 2x More Obvious */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-90 dark:opacity-50" 
        style={{
          background: "radial-gradient(ellipse 800px 600px at 20% 85%, rgba(236, 72, 153, 0.4), transparent 55%)"
        }}
      />
      
      {/* Static Gradient Layer - Purple (Center) - Additional Depth */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 dark:opacity-35"
        style={{
          background: "radial-gradient(ellipse 700px 900px at 50% 50%, rgba(139, 92, 246, 0.3), transparent 65%)"
        }}
      />
      
      {/* Realistic Paper Texture - Using CSS backdrop filter approach */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none paper-texture"
      />
      
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Soft glowing logo container */}
        <div className="relative group">
           <div className="absolute -inset-5 bg-gradient-to-r from-primary/30 to-pink-500/30 rounded-4xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
           <Image
            src="/logo.png"
            alt="Sneuz Logo"
            width={100}
            height={100}
            className="relative rounded-2xl shadow-xl transition-transform duration-500"
            priority
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl">
            Sneuz
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed">
            Master your sleep schedule. <br />
            <span className="italic text-foreground/80">Simple. Manual. Effective.</span>
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full px-8 bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <Link href="/login">Enter</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full px-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-300">
            <Link href="/signup">Join</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
