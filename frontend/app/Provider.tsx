"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { repoStores } from "@/Stores/repoStores";
import { authUserStore } from "@/Stores/authStores";

export const ITEMS_PER_PAGE = 10;

export default function Provider() {
  const { getRandomRepository, getPageRepository, viewsDownloads } = repoStores();
  const { checkAuth, user, checkingAuth } = authUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      sessionStorage.setItem("lastPath", pathname);
    }
  }, [pathname]);

  useEffect(() => {
    checkAuth();
    getRandomRepository();
    viewsDownloads();
    getPageRepository(1, ITEMS_PER_PAGE);
  }, []);

  useEffect(() => {
    if (checkingAuth) return;

    // Only act when we're actually ON the login page.
    if (pathname !== "/login") return;

    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (user) {
      const lastPath = sessionStorage.getItem("lastPath");
      router.replace(lastPath && lastPath !== "/login" ? lastPath : "/");
      return;
    }
  }, [user, checkingAuth, pathname, router]);

  return null;
}