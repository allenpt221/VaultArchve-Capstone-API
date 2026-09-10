// components/ConditionalShell.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ProtectedRoute from "./ProtectedRoute";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide everything on these pages
  const hideShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Hide only the footer on recommendation pages
  const hideFooter = pathname.startsWith("/recommendation");

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <Navbar />
      {children}
      {!hideFooter && <Footer />}
    </ProtectedRoute>
  );
}