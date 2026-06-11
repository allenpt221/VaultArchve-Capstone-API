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

    const lastPath = sessionStorage.getItem("lastPath");

    if (user && lastPath && lastPath !== "/login") {
      router.replace(lastPath);
      return;
    }

    if (user?.role === "admin" && pathname === "/login") {
      router.replace("/admin");
      return;
    }

    if (user && pathname === "/login") {
      router.replace("/");
      return;
    }

  }, [user, checkingAuth, pathname, router]);

  return null;
}