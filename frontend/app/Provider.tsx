"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { repoStores } from "@/Stores/repoStores";
import { authUserStore } from "@/Stores/authStores";

export const ITEMS_PER_PAGE = 4;


export default function Provider() {
  const { getRandomRepository, getPageRepository } = repoStores();
  const { checkAuth, user } = authUserStore();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    getRandomRepository();
    getPageRepository(1, ITEMS_PER_PAGE);
    checkAuth();
  }, [getRandomRepository, getPageRepository, checkAuth]);

useEffect(() => {
  if (user && pathname === '/login') {
    router.replace('/');
  }
}, [user, pathname, router]);

  return null;
}