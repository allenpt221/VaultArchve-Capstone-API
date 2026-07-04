'use client';
import { authUserStore } from "@/Stores/authStores";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronRight,
  Menu,
  X,
  Users,
  LogOut,
  Home,
} from "lucide-react";

import DataAnalytics from "@/components/AdminComponents/DataAnalytics";
import ThesisSubmit from "@/components/AdminComponents/ThesisSubmit";
import Link from "next/link";
import UserManagement from "@/components/AdminComponents/UserManagement";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkingAuth, logOut } = authUserStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activePage = searchParams.get("dashboard") ?? "data-analytics"; 
  const getInitials = (email: string) => email?.charAt(0).toUpperCase() ?? "U";



 
  const setActivePage = (page: string) => {
    router.push(`/admin?dashboard=${page}`);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      logOut();
      router.replace('/');
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
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
        className={`hidden lg:flex flex-col bg-[#0B1C33] border-r border-[#0B1C33] shadow-sm 
        sticky top-0 h-screen shrink-0
        transition-all duration-300 ease-in-out overflow-hidden transform-gpu
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Header */}
        <div className={`px-3 pt-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          
          <Link href={'/'}
            className={`font-bold text-white text-lg whitespace-nowrap transition-all duration-300
            ${collapsed ? "opacity-0 -translate-x-2 w-0 overflow-hidden" : "opacity-100 translate-x-0 w-auto"}`}
          >
            Vault
            
            <span className="text-amber-400">
              Archve
            </span>
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <ChevronRight
              size={20}
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-0" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Home / Back to site */}
        <div className="px-2 mt-4">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:scale-[1.02] transition-all duration-300
            ${collapsed ? "justify-center" : ""}`}
          >
            <Home size={20} className="shrink-0" />
            <span
              className={`whitespace-nowrap transition-all duration-300 ease-in-out cursor-pointer
              ${collapsed ? "hidden" : "block"}`}
            >
              Back to Home
            </span>
          </Link>
          
          {/* Divider */}
          <div className='h-px bg-white/10 my-2' />
        </div>

        {/* Menu */}
        <nav className="flex-1 mt-4 px-2 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer
                ${isActive
                  ? "bg-amber-500/15 text-amber-400 font-medium shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:scale-[1.02]"
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

        {/* User info + Logout */}
        <div className="px-2 pb-2">
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5
            ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-8 h-8 rounded-full bg-amber-400 text-[#0B1C33] font-bold flex items-center justify-center text-sm">
                {(user?.email?.[0] || user?.email?.[0] || "A").toUpperCase()}
              </div>
              <div
                className={`min-w-0 transition-all duration-300
                ${collapsed ? "hidden" : "block"}`}
              >
                <p className="text-sm font-medium text-white truncate">
                  {user?.email || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
                className="shrink-0 p-2 rounded-md text-gray-300 hover:bg-red-500/15 hover:text-red-400 transition disabled:opacity-60 cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-xs text-gray-400 text-center">
          <span className={`transition-opacity duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`}>
            Admin Panel v1.0
          </span>
        </div>
      </aside>


      <main className="flex-1 overflow-y-auto h-screen relative">

        {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0B1C33] shadow-md border-b border-white/10">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-white/10 text-white active:scale-95 transition"
        >
          <Menu size={24} />
        </button>
        <Link href={'/'}>
          <span className="sm:text-lg text-white font-bold tracking-tight leading-tight">
            Vault<span className="text-amber-400">Archve</span>
          </span>
        </Link> 
      </div>

        <div className="">
          {activePage === "data-analytics" && <DataAnalytics isCollapsed={collapsed} />}
          {activePage === "submit-thesis" && <ThesisSubmit />}
          {activePage === "users-management" && <UserManagement />}

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
          className={`absolute left-0 top-0 h-full w-64 bg-[#0B1C33] shadow-lg flex flex-col transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 flex justify-between items-center border-b border-white/10">
            <Link href={'/'}>
              <span className="sm:text-lg text-white font-bold tracking-tight leading-tight">
                Vault<span className="text-amber-400">Archve</span>
              </span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="text-white">
              <X size={20} />
            </button>
          </div>

        {user && (
          <div className='mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3'>
            <div className='h-9 w-9 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-sm shrink-0'>
              {getInitials(user.email)}
            </div>
            <div className='min-w-0'>
              <p className='text-white/40 text-xs'>Signed in as</p>
              <p className='text-white text-sm font-medium truncate'>{user.email}</p>
            </div>
          </div>
        )}

          {/* Home / Back to site */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="mx-4 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 transition text-sm font-medium"
          >
            <Home size={18} />
            Back to Home
          </Link>

          {/* Divider */}
          <div className='h-px bg-white/10 my-2' />

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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
                  ${isActive
                    ? "bg-amber-500/15 text-amber-400 font-medium"
                    : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user && (
            <div className='px-4 pb-2'>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className='w-full flex items-center justify-center gap-2 font-medium text-sm px-4 py-2.5 rounded-lg
                           border border-red-400/20 bg-red-500/10 text-red-400
                           hover:bg-red-500/15 hover:border-red-400/30 active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 cursor-pointer'
              >
                <LogOut size={16} className={loggingOut ? 'animate-pulse' : ''} />
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          )}
          <div className='p-4 border-t border-white/10'>
            <p className='text-white/20 text-xs text-center tracking-wider uppercase'>Guagua Community College</p>
          </div>
        </aside>

      </div>

    </div>
  );
}

function Admin() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}

export default Admin;