"use client";

import { useEffect } from "react";
import { repoStores } from "@/Stores/repoStores";

export default function Provider() {
  const { getRandomRepository, getAllRepository } = repoStores();

  useEffect(() => {
    getRandomRepository();
    getAllRepository();
  }, []);

  return null;
}