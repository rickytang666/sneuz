import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getProfile } from "@/lib/actions/user";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getProfile();

  return (
    <SidebarProvider>
      <AppSidebar user={profile} />
      <main className="w-full">
        <div className="flex items-center p-4">
          <SidebarTrigger />
        </div>
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}
