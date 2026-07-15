"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authUserStore } from "@/Stores/authStores";
import DisabledPage from "./disable";

const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
];

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = authUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const isDisabled = user?.status !== "active";

  useEffect(() => {
    if (loading) return;

    if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;

  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  if (user && isDisabled && !PUBLIC_ROUTES.includes(pathname)) {
    return <DisabledPage />;
  }

  return <>{children}</>;
}