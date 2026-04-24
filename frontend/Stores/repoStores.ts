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


interface productState {
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
    FilteredThesis: (year: string, department: string, sort: string, order: string) => void;
    ThesisById: (id: string) => void;
    incrementDownloads: () => void;
    incrementViews: () => void;
    submitThesis: (
        course: string,
        title: string,      // ✅ fixed order
        abstract: string,
        author: string,
        issueDate: string,  // ✅ fixed order
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


    getRandomRepository: async (): Promise<void> => {
        try {
            set({ loading: true, randomRepository: [] }); // ✅ fixed: was setting repository
            const res = await axios.get('/repository/features');
            set({ randomRepository: res.data.data, loading: false }); // ✅ fixed: was setting repository
        } catch (error: any) {
            console.error('Failed fetching data:', error);
            set({ loading: false });
        }
    },

    getPageRepository: async (page: number, limit: number): Promise<void> => {
        set({ loading: true, repository: [] });
        try {
            const res = await axios.get(`/repository/getthesis?page=${page}&limit=${limit}`);
            const { thesis, totalCount, currentPage, totalPages } = res.data.thesis;

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

    ThesisById: async (id: string): Promise<void> => {
        set({ loading: true, notFound: false, thesisData: null });
        try {
            const res = await axios.get(`repository/getbyId/${id}`);
            set({ thesisData: res.data, loading: false });
            console.log(res.data);
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
            formData.append('thesis_file', file);

            const res = await axios.post('/repository/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const newThesis = res.data?.data;

            if (newThesis) {
                set((state) => ({
                    repository: [{ ...newThesis, issue_date: issueDate }, ...state.repository],
                    randomRepository: [{ ...newThesis, issue_date: issueDate }, ...state.randomRepository], // ✅ fixed: now updates both
                }));
            }

            set({ loading: false });
        } catch (error: any) {
            console.error('Failed to submit thesis:', error.message);
            set({ loading: false });
        }
    },


    incrementViews: () => set((state) => ({
        thesisData: state.thesisData
            ? { ...state.thesisData, views: (state.thesisData.views ?? 0) + 1 }
            : null,
        randomRepository: state.randomRepository.map((thesis) =>
            thesis.id === state.thesisData?.id
                ? { ...thesis, views: (thesis.views ?? 0) + 1 }
                : thesis
        ),
        repository: state.repository.map((thesis) =>
            thesis.id === state.thesisData?.id
                ? { ...thesis, views: (thesis.views ?? 0) + 1 }
                : thesis
        ),
    })),

    incrementDownloads: () => set((state) => ({
        thesisData: state.thesisData
            ? { ...state.thesisData, downloads: (state.thesisData.downloads ?? 0) + 1 }
            : null,
        randomRepository: state.randomRepository.map((thesis) =>
            thesis.id === state.thesisData?.id
                ? { ...thesis, downloads: (thesis.downloads ?? 0) + 1 }
                : thesis
        ),
        repository: state.repository.map((thesis) =>
            thesis.id === state.thesisData?.id
                ? { ...thesis, downloads: (thesis.downloads ?? 0) + 1 }
                : thesis
        ),
    })),
}))