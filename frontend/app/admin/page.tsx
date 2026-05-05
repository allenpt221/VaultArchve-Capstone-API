'use client';
import { authUserStore } from "@/Stores/authStores";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronRight,
  Menu,
  X,
  Users,
} from "lucide-react";

import DataAnalytics from "@/components/AdminComponents/DataAnalytics";
import ThesisSubmit from "@/components/AdminComponents/ThesisSubmit";
import Link from "next/link";

function Admin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkingAuth } = authUserStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activePage = searchParams.get("dashboard") ?? "data-analytics";

  const setActivePage = (page: string) => {
    router.push(`/admin?dashboard=${page}`);
  };

  useEffect(() => {
    if (checkingAuth) return;
    if (!user || user.role !== "admin") {
      router.replace('/');
    }
  }, [user, checkingAuth]);

  if (checkingAuth) return null;
  if (!user || user.role !== "admin") return null;

  const menuItems = [
    { id: "data-analytics", label: "Analytics Dashboard", icon: LayoutDashboard },
    { id: "submit-thesis", label: "Publish Thesis", icon: FileText },
    { id: "users-management", label: "User Management", icon: Users  },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 relative">

      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 shadow-sm 
        transition-all duration-300 ease-in-out overflow-hidden transform-gpu
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Header */}
        <div className={`px-3 pt-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          
          <Link href={'/'}
            className={`font-bold text-gray-800 text-lg whitespace-nowrap transition-all duration-300
            ${collapsed ? "opacity-0 -translate-x-2 w-0 overflow-hidden" : "opacity-100 translate-x-0 w-auto"}`}
          >
            Vault
            
            <span className="text-yellow-400">
              Archve
            </span>
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
          >
            <ChevronRight
              size={20}
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-0" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 mt-8 px-2 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer
                ${isActive
                  ? "bg-black/10 text-black font-medium shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:scale-[1.02]"
                }
                ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={20} className="shrink-0" />

                <span
                  className={`whitespace-nowrap transition-all duration-300 ease-in-out
                  ${collapsed
                    ? "hidden"
                    : "block"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-xs text-gray-400 text-center">
          <span className={`transition-opacity duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`}>
            Admin Panel v1.0
          </span>
        </div>
      </aside>


      <main className="flex-1 overflow-auto relative">

        {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white shadow-md border-b">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100 active:scale-95 transition"
        >
          <Menu size={24} />
        </button>

        <span className="font-semibold text-base tracking-wide">
          VaultArchive
        </span>
      </div>

        <div className="">
          {activePage === "data-analytics" && <DataAnalytics isCollapsed={collapsed} />}
          {activePage === "submit-thesis" && <ThesisSubmit />}
          {activePage === "settings" && (
            <div className="bg-white rounded-lg shadow p-6 transition-all duration-300">
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-gray-600 mt-2">
                Customize your admin preferences here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* mobile screen */}
      <div
        className={`fixed inset-0 z-60 lg:hidden transition-all duration-300 ${
          mobileOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 flex justify-between items-center border-b">
            <span className="font-bold">ValtArche</span>
            <button onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition
                  ${isActive ? "bg-black/10 font-medium" : "hover:bg-gray-100"}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

    </div>
  );
}

export default Admin;