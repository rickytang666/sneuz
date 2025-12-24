import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from "@/lib/actions/user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login?next=/dashboard')
  }

  const profile = await getProfile()

  return (
    <SidebarProvider>
      <AppSidebar user={profile} />
      <main className="w-full">
        <div className="flex items-center p-4">
             <SidebarTrigger />
        </div>
         <div className="p-4">
            {children}
         </div>
      </main>
    </SidebarProvider>
  )
}
