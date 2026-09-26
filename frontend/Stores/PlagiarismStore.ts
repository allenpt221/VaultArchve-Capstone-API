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

interface PlagiarismStateProps {
  text: string;
  result: PlagiarismResult | null;
  loading: boolean;
  error: string | null;

  setText: (text: string) => void;
  checkPlagiarism: () => Promise<MutationResult>;
  reset: () => void;
}

export const plagiarismStore = create<PlagiarismStateProps>((set, get) => ({
  text: '',
  result: null,
  loading: false,
  error: null,

  setText: (text: string): void => {
    set({ text });
  },

  checkPlagiarism: async (): Promise<MutationResult> => {
    const { text } = get();

    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;

    if (wordCount < MIN_WORDS) {
      const message = `Enter at least ${MIN_WORDS} words for a reliable check (currently ${wordCount}).`;

      set({
        error: message,
        result: null,
      });

      return {
        success: false,
        message,
      };
    }

    try {
      set({
        loading: true,
        error: null,
      });

      const res = await axios.post<PlagiarismResult>(
        '/plagiarism/check',
        { text }
      );

      set({
        result: res.data,
        loading: false,
      });

      return {
        success: true,
      };
    } catch (error: unknown) {
      set({
        loading: false,
      });

      let message = 'Failed to check plagiarism.';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const response = (
          error as {
            response?: {
              data?: {
                error?: string;
                message?: string;
              };
            };
          }
        ).response;

        const data = response?.data;

        message =
          data?.error ||
          data?.message ||
          'Failed to check plagiarism.';
      }

      set({
        error: message,
        result: null,
      });

      return {
        success: false,
        message,
      };
    }
  },

  reset: (): void => {
    set({
      text: '',
      result: null,
      loading: false,
      error: null,
    });
  },
}));
