"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { repoStores } from "@/Stores/repoStores";
import { authUserStore } from "@/Stores/authStores";

export default function Provider() {
  const { getRandomRepository, getAllRepository } = repoStores();
  const { checkAuth, user } = authUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getRandomRepository();
    getAllRepository();
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, pathname]);

  return null;
}