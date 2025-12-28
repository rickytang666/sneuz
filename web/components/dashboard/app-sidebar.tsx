"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconCalendar,
  IconDatabase,
  IconSettings,
  IconUser,
} from "@tabler/icons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/dashboard/user-nav"
import { UserProfile } from "@/lib/types"

// Menu items.
const items = [
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: IconCalendar,
  },
  {
    title: "Data",
    url: "/dashboard/data",
    icon: IconDatabase,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: IconUser,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: UserProfile | null }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
         <div className="flex items-center gap-2 px-2 py-4">
            <Image src="/favicon.svg" alt="Logo" width={24} height={24} />
            <span className="font-bold text-primary text-lg group-data-[collapsible=icon]:hidden">Sneuz</span>
         </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
         <div className="flex flex-col gap-4 p-4 group-data-[collapsible=icon]:items-center">
            <div className="flex items-center justify-between gap-2">
                 <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Theme</span>
                 <ModeToggle />
            </div>
            <div className="flex items-center justify-between gap-2">
                 <UserNav user={user} />
            </div>
         </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
