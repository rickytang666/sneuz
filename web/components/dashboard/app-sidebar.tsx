"use client"

import * as React from "react"
import {
  IconCalendar,
  IconChartBar,
  IconSettings,
  IconLayoutDashboard,
  IconMoon,
} from "@tabler/icons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/dashboard/user-nav"

// Menu items.
const items = [
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: IconCalendar,
  },
  {
    title: "Stats",
    url: "/dashboard/stats",
    icon: IconChartBar,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
         <div className="flex items-center gap-2 px-2 py-4">
            <IconMoon className="h-6 w-6" />
            <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Sleep Tracker</span>
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
                 <UserNav />
            </div>
         </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
