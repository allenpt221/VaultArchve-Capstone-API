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
    incrementViews: (id:string) => void;
    submitThesis:(
    course: string,
    issueDate: string,
    abstract: string,
    author: string,
    year: string,
    introduction: string,
    discussion: string,
    conclusion: string,
    references: string,
    file: File
    ) => void;
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

        set({ loading: true, repository: []  });
        const res = await axios.get('/repository/features');

        set({ randomRepository: res.data.data, loading: false });
    } catch (error: any) {
        console.error('Failed fetching data:', error);  
        set({ loading: false });  
    }
    },
    
    getPageRepository: async(page: number, limit: number): Promise<void> => {
        set({ loading: true, repository: [] });
        try {

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

        set({ repository: res.data, loading: false });

    } catch (error) {
        console.error("Failed to filter thesis:", error);
        set({ loading: false });
    }
    },

    ThesisById: async(id: string): Promise<void> => {
        set({ loading: true, notFound: false, thesisData: null });
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

    submitThesis: async (
    course: string,
    title: string,
    abstract: string,
    author: string,
    issueDate: string,
    introduction: string,
    discussion: string,
    conclusion: string,
    references: string,
    file: File
    ): Promise<void> => {
    try {
        set({ loading: true });

        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('course', course);
        formData.append('issueDate', issueDate);
        formData.append('abstract', abstract);
        formData.append('introduction', introduction);
        formData.append('discussion', discussion);
        formData.append('conclusion', conclusion);
        formData.append('references', references);
        formData.append('thesis_file', file); // key must match multer field name

        const res = await axios.post('/repository/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        });

        const newThesis = res.data?.data;

        if (newThesis) {
        set((state) => ({
            repository: [newThesis, ...state.repository],
        }));
        }

        set({ loading: false });
    } catch (error: any) {
        console.error('Failed to submit thesis:', error.message);
        set({ loading: false });
    }
    },


    incrementDownloads: () => set((state) => ({
        thesisData: state.thesisData 
            ? { ...state.thesisData, downloads: (state.thesisData.downloads ?? 0) + 1 }
            : null
    })),

    incrementViews: (id: string) => set((state) => ({
      thesisData: state.thesisData
    ? { ...state.thesisData, views: (state.thesisData.views ?? 0) + 1 }
    : null,

    repository: state.repository.map((item) =>
        item.id === id
        ? { ...item, views: (item.views ?? 0) + 1 }
        : item
    ),

    randomRepository: state.randomRepository.map((item) =>
        item.id === id
        ? { ...item, views: (item.views ?? 0) + 1 }
        : item
    ),
    })),

}))