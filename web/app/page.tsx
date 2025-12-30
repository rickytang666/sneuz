import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { IconArrowNarrowRight, IconBrandAppleFilled } from "@tabler/icons-react"

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
      
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Soft glowing logo container */}
        <div className="relative group">
           <div className="absolute -inset-5 bg-gradient-to-r from-primary/30 to-pink-500/30 rounded-4xl blur opacity-20 group-hover:opacity-70 transition duration-500"></div>
           <Image
            src="/logo.png"
            alt="Sneuz Logo"
            width={100}
            height={100}
            className="relative rounded-2xl shadow-xl transition-transform duration-500"
            priority
          />
        </div>

        <div className="space-y-5">
          <h1 className="text-5xl md:text-6xl mb-4">
            Sneuz
          </h1>
          
          <div className="space-y-1">
            <p className="text-xl md:text-2xl text-foreground/90">
              iOS Sleep tracker that feels <span className="relative inline-block font-serif italic text-2xl md:text-3xl text-foreground">
                invisible
              </span>.
            </p>
            <p className="text-xl md:text-2xl text-foreground/90">
              Wake up. Data&apos;s ready.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3 sm:gap-6">
             <div className="flex flex-col items-start space-y-1 text-sm md:text-base text-foreground/70">
                <span className="inline-flex items-center">
                  <Image
                    src="https://help.apple.com/assets/6781C3C67B7D74FBA40A8869/6781C3D2FBC8FC20260A5112/en_US/e5b2bdfad57b2e0b806c0f65d8d1db72.png"
                    alt="Shortcuts"
                    width={20}
                    height={20}
                    className="mr-1"
                  />
                  Shortcuts
                </span>
                <span className="inline-flex items-center">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Icon_-_Apple_Health.png/1200px-Icon_-_Apple_Health.png?20250228021041"
                    alt="Apple Health"
                    width={20}
                    height={20}
                    className="mr-1"
                  />
                  Apple Health Export
                </span>
                <span className="inline-flex items-center">
                  <span className="text-[20px] mr-1">🌐</span> Web Dashboard
                </span>
             </div>
             
             {/* Arrow */}
             <div className="flex items-center text-foreground">
                <IconArrowNarrowRight strokeWidth={1} className="h-10 w-10" />
             </div>

             <div className="text-lg md:text-xl font-medium text-foreground tracking-tight pl-2">
                Zero Effort.
             </div>
          </div>
        </div>

        <div className="flex gap-4 mt-5">
          <Button asChild size="lg" className="rounded-full px-8 h-12 text-base font-medium bg-primary/80 hover:bg-primary hover:drop-shadow-md hover:drop-shadow-primary text-primary-foreground border-2 border-transparent">
            <Link href="/login">Enter</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-medium bg-background/50 backdrop-blur-sm border-2 border-primary/40 text-foreground hover:bg-background/80 hover:border-primary transition-all duration-300">
            <Link href="/signup">Join</Link>
          </Button>
        </div>
        
        <p className="flex items-center mt-5 text-lg text-muted-foreground font-medium tracking-wider">
          <IconBrandAppleFilled className="inline mr-1" />
          iOS App: Coming Soon
        </p>
      </div>
    </div>
  )
}
