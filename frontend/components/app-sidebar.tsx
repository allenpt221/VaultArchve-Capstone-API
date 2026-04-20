"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, PlusIcon, MinusIcon } from "lucide-react"
import Link from "next/link"

const data = {
  navMain: [
    {
      title: "Repository",
      url: "#",
      items: [
        { title: "Data Analytics", page: "data-analytics" },
        { title: "Submit Thesis", page: "submit-thesis" },
      ],
    },
    {
      title: "Manage Student",
      url: "#",
      items: [
        { title: "Routing", page: "routing" },
        { title: "Data Fetching", page: "data-fetching" },
      ],
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activePage: string;
  setActivePage: (page: string) => void;
}

export function AppSidebar({ activePage, setActivePage, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={'/'} >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-400 text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon className="size-4 text-[#060f24]/90" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Admin Dashboard</span>
                  <span className="text-xs">Guagua Community Collge</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 0}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}
                      <PlusIcon className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <MinusIcon className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={activePage === subItem.page}
                            >
                              <button className="w-full cursor-pointer" onClick={() => setActivePage(subItem.page)}>
                                {subItem.title}
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}