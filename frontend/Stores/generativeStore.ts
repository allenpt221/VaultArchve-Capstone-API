import axios from '@/lib/axios';
import { create } from 'zustand';



interface RecommendedProps{
    topic: string;
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

    RecommendedAI: async({topic, course, chatPrompt} : RecommendedProps ): Promise<void> => {
        try {
            set({ loading: true, message: "" });

            const res = await axios.post('/ai/recommendation', {
                topic,
                course,
                chatPrompt
            });

            set({result: res.data.recommendations, loading:false,  message: "AI recommendations generated successfully!" })
            
        } catch (error: any) {
            set({ loading: false });

            if (error.response?.status === 401) {
            set({ message: "Unauthorized Access. Please log in" });
            return;
            }


            // General error
            console.error("AI Recommendation Error:", error);
            set({ message: error });

        }
    }

    
     
}))