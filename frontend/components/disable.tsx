"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, BookOpen, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { authUserStore } from "@/Stores/authStores";

interface DisabledPageProps {
  message?: string;
  contactEmail?: string;
}

export default function DisabledPage({
  message = "Your account has been disabled due to a violation of our community guidelines. If you believe this is a mistake, please reach out to the admin team below.",
  contactEmail = "admin@gcc.edu.ph",
}: DisabledPageProps) {
  const { logOut, user } = authUserStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  console.log(user)

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-10">
          <BookOpen className="h-6 w-6 text-amber-500" strokeWidth={2.5} />
          <span className="text-[#0B1C33] font-bold text-lg">
            Vault<span className="text-amber-500">Archve</span>
          </span>
        </div>

        {/* Status icon */}
        <div className="h-16 w-16 rounded-full bg-red-50 border p-4 border-red-200 flex items-center justify-center mb-8">
          <Lock className="h-7 w-7 text-red-500" strokeWidth={2} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-4 py-1 text-xs font-medium text-red-500 tracking-wide uppercase mb-6">
          Account Disabled
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1C33] leading-tight mb-4">
          This account is
          <br />
          <span className="text-amber-500">currently restricted</span>
        </h1>

        <p className="text-slate-600 text-base leading-relaxed mb-10">
          {message}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B1C33] hover:bg-[#132745] transition-colors px-6 py-3 text-sm font-semibold text-white"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg border hover:bg-muted border-slate-300 hover:bg-slate-50 transition-colors px-6 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Guagua Community College · Academic Digital Repository
        </p>
      </div>
    </div>
  );
}