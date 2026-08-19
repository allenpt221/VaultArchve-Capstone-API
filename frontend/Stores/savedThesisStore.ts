import { create } from "zustand";
import axios from "@/lib/axios"; // adjust to your actual axios instance path

// ---- Types ----
export interface SavedThesisItem {
  id: string;
  createdAt: string;
  Thesis: {
    id: string;
    title: string;
    author: string;
    course: string;
    issue_date: string;
    thesis_file_url: string;
    thesis_file_name: string;
    ThesisDataAnalytics?: { views: number; downloads: number };
    [key: string]: any;
  };
}

interface MutationResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface SavedThesisState {
  savedThesis: SavedThesisItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;

  // per-thesis save status cache, e.g. { [thesisId]: true }
  saveStatusMap: Record<string, boolean>;

  isLoading: boolean;
  isSaving: boolean;
  isUnsaving: boolean;
  isCheckingStatus: boolean;
  error: string | null;

  fetchSavedThesis: (page: number, limit: number) => Promise<void>;
  saveThesis: (thesisId: string) => Promise<MutationResult>;
  unsaveThesis: (thesisId: string) => Promise<MutationResult>;
  checkSaveStatus: (thesisId: string) => Promise<boolean>;
  reset: () => void;
}

export const useSavedThesisStore = create<SavedThesisState>((set, get) => ({
  savedThesis: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,

  saveStatusMap: {},

  isLoading: false,
  isSaving: false,
  isUnsaving: false,
  isCheckingStatus: false,
  error: null,

  fetchSavedThesis: async (page, limit) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get("/saved-thesis/saved", {
        params: { page, limit },
      });

      const { savedThesis, totalCount, currentPage, totalPages } =
        res.data.savedThesis;

      set({
        savedThesis,
        totalCount,
        currentPage,
        totalPages,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch saved theses";
      set({ isLoading: false, error: message });
    }
  },

  saveThesis: async (thesisId) => {
    set({ isSaving: true, error: null });
    try {
      const res = await axios.post("/saved-thesis/saved", { thesisId });

      // optimistic status update, no full refetch needed
      set((state) => ({
        isSaving: false,
        saveStatusMap: { ...state.saveStatusMap, [thesisId]: true },
      }));

      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save thesis";
      set({ isSaving: false, error: message });
      return { success: false, error: message };
    }
  },

  unsaveThesis: async (thesisId) => {
    set({ isUnsaving: true, error: null });
    try {
      const res = await axios.delete(`/saved-thesis/saved/${thesisId}`);

      set((state) => ({
        isUnsaving: false,
        saveStatusMap: { ...state.saveStatusMap, [thesisId]: false },
        // remove from the current list if it's loaded (e.g. "My Saved Theses" page)
        savedThesis: state.savedThesis.filter(
          (item) => item.Thesis?.id !== thesisId
        ),
      }));

      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to unsave thesis";
      set({ isUnsaving: false, error: message });
      return { success: false, error: message };
    }
  },

  checkSaveStatus: async (thesisId) => {
    const cached = get().saveStatusMap[thesisId];
    if (cached !== undefined) return cached;

    set({ isCheckingStatus: true });
    try {
      const res = await axios.get(
        `/saved-thesis/saved/${thesisId}/status`
      );
      const saved = res.data.saved;

      set((state) => ({
        isCheckingStatus: false,
        saveStatusMap: { ...state.saveStatusMap, [thesisId]: saved },
      }));

      return saved;
    } catch (error: any) {
      set({ isCheckingStatus: false });
      return false;
    }
  },

  reset: () => {
    set({
      savedThesis: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
      saveStatusMap: {},
      error: null,
    });
  },
}));