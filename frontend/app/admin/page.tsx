'use client';
import { authUserStore } from "@/Stores/authStores"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import DataAnalytics from "@/components/AdminComponents/DataAnalytics";
import { Divide } from "lucide-react";
import ThesisSubmit from "@/components/AdminComponents/ThesisSubmit";

function Admin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkingAuth } = authUserStore();   


  const breadcrumbMap: Record<string, string> = {
    "data-analytics": "Analytics Dashboard",
    "submit-thesis": "Publish Thesis",
    "settings": "Settings",
  };


  const activePage = searchParams.get("page") ?? "data-analytics";

  const setActivePage = (page: string) => {
    router.push(`/admin?page=${page}`);
  };


  useEffect(() => {
    if(checkingAuth) return;

    if (!user || user.role !== "admin") {
      router.replace('/'); 
    }
  }, [user, checkingAuth]);

  if (checkingAuth) return null;

  if (!user || user.role !== "admin") return null;

  

  return (
  <SidebarProvider>
      <AppSidebar activePage={activePage} setActivePage={setActivePage}/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Admin</BreadcrumbPage>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  {breadcrumbMap[activePage] ?? "Unknown"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
            {activePage === "data-analytics" && ( <DataAnalytics /> )}
            {activePage === "submit-thesis" && ( <ThesisSubmit />)}

      </SidebarInset>
    </SidebarProvider>
  )
}

export default Admin;