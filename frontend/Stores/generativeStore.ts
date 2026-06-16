import axios from '@/lib/axios';
import { create } from 'zustand';



interface RecommendedProps{
    course: string;
    chatPrompt: string;
}

interface generativeAiProps {
  RecommendedAI: (data: RecommendedProps) => Promise<void>;
  result: any[],
  loading: boolean,
  message: string,

}



export const generativeStore = create<generativeAiProps>((set, get) => ({
    result: [],
    loading: false,
    message: "",

RecommendedAI: async ({ chatPrompt, course }: RecommendedProps): Promise<void> => {
  try {
    set({ loading: true, message: "" });

    const res = await axios.post('/ai/recommendation', {
      course,
      chatPrompt,
    });

    set({
      result: res.data.recommendations,
      loading: false,
      message: "AI recommendations generated successfully!",
    });

  } catch (error: any) {
    set({ loading: false });

    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      set({ message: data?.message || "Unauthorized Access. Please log in" });
      return;
    }

    if (status === 400) {
      set({ message: data?.message || "Invalid request. Please check your input." });
      return;
    }

    if (status === 500) {
      set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
      return;
    }

    console.error("AI Recommendation Error:", error);
    set({ message: error.message || "An unexpected error occurred." });
  }
},

    
     
}))