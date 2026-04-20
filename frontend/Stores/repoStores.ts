import axios from '@/lib/axios';
import { create } from 'zustand';


interface Thesis {
  id: string;
  created_at: string;
  title: string;
  author: string;
  course: string;
  abstract: string;
  introduction: string;
  discussion: string;
  conclusion: string;
  references: string;
  issue_date: string;
  admin_id: string;
  thesis_file_name: string;
  thesis_file_url: string;
  views: number;
  downloads: number;
}


interface productState{
    repository: any[];
    thesisData: Thesis | null;
    randomRepository: any[];
    loading: boolean;
    notFound: boolean;

    totalCount: number;
    currentPage: number;
    totalPages: number;

    getRandomRepository: () => void;
    getPageRepository: (page: number, limit: number) => void;
    FilteredThesis:(year: string, department: string, sort: string, order: string) => void;
    ThesisById:(id: string) => void;
    incrementDownloads: () => void;
}



export const repoStores = create<productState>((set, get) => ({
    randomRepository: [],
    thesisData: null,
    repository: [],
    loading: false,
    notFound: false,

    totalCount: 0,
    currentPage: 1,
    totalPages: 1,


    
    getRandomRepository: async(): Promise<void> => {
    try {

        set({ loading: true });
        const res = await axios.get('/repository/features');

        set({ randomRepository: res.data.data, loading: false });
    } catch (error: any) {
        console.error('Failed fetching data:', error);  
        set({ loading: false });  
    }
    },
    
    getPageRepository: async(page: number, limit: number): Promise<void> => {
    try {

        set({ loading: true });
        const res = await axios.get(`/repository/getthesis?page=${page}&limit=${limit}`);
        
        const { thesis, totalCount, currentPage, totalPages } = res.data.thesis; // ✅ match backend shape

        set({
        repository: thesis,
        totalCount,
        currentPage,
        totalPages,
        loading: false
        });
    } catch (error: any) {
        console.error('Failed fetching data:', error);  
        set({ loading: false });  
    }
    },

    FilteredThesis: async (year: string, department: string, sort: string, order: string): Promise<void> => {
    try {
        set({ loading: true });

        const params = new URLSearchParams();
        params.append("year", year);
        params.append("department", department);
        params.append("sort", sort);
        params.append("order", order);

        const res = await axios.get(`/repository/sort?${params.toString()}`);

        set({ repository: res.data, loading: false }); // ✅ also set loading false on success

    } catch (error) {
        console.error("Failed to filter thesis:", error);
        set({ loading: false });
    }
    },

    ThesisById: async(id: string): Promise<void> => {
        set({ loading: true, notFound: false });
        try {
            const res = await axios.get(`repository/getbyId/${id}`);

            set({thesisData: res.data, loading: false});
            console.log(res.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                set({ notFound: true, loading: false });
            }
        }
    },

    incrementDownloads: () => set((state) => ({
        thesisData: state.thesisData 
            ? { ...state.thesisData, downloads: (state.thesisData.downloads ?? 0) + 1 }
            : null
    }))

}))