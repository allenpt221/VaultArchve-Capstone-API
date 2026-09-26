import axios from '@/lib/axios';
import { create } from 'zustand';

interface PlagiarismMatch {
  url: string;
  matchedWords: number;
  percentage: number;
}

interface PlagiarismResult {
  percentUnique: number;
  percentDuplicated: number;
  flagged: boolean;
  matches: PlagiarismMatch[];
  creditsUsed: number;
}

interface MutationResult {
  success: boolean;
  message?: string;
}

const MIN_WORDS = 50;

interface plagiarismStateProps {
  text: string;
  result: PlagiarismResult | null;
  loading: boolean;
  error: string | null;

  setText: (text: string) => void;
  checkPlagiarism: () => Promise<MutationResult>;
  reset: () => void;
}

export const plagiarismStore = create<plagiarismStateProps>((set, get) => ({
  text: '',
  result: null,
  loading: false,
  error: null,

  setText: (text: string): void => {
    set({ text });
  },

  checkPlagiarism: async (): Promise<MutationResult> => {
    const { text } = get();
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < MIN_WORDS) {
      const message = `Enter at least ${MIN_WORDS} words for a reliable check (currently ${wordCount}).`;
      set({ error: message, result: null });
      return { success: false, message };
    }

    try {
      set({ loading: true, error: null });

      const res = await axios.post('/plagiarism/check', { text });

      set({
        result: res.data,
        loading: false,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;
      const message = data?.error || data?.message || 'Failed to check plagiarism.';

      set({ error: message, result: null });

      return { success: false, message };
    }
  },

  reset: (): void => {
    set({ text: '', result: null, loading: false, error: null });
  },

}));