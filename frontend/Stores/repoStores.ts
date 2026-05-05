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
  ThesisDataAnalytics: { views: number; downloads: number }[];
}


interface productState {
    repository: any[];
    thesisData: Thesis | null;
    randomRepository: any[];
    loading: boolean;
    notFound: boolean;
    dataAnalytics: any[];

    totalCount: number;
    currentPage: number;
    totalPages: number;

    getRandomRepository: () => void;
    viewsDownloads: () => void;
    getPageRepository: (page: number, limit: number) => void;
    FilteredThesis: (search: string, year: string, department: string, sort: string, order: string) => void;
    ThesisById: (id: string) => void;
    incrementDownloads: () => void;
    incrementViews: (id: string) => void;
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
    dataAnalytics: [],
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

    FilteredThesis: async (search: string, year: string, department: string, sort: string, order: string): Promise<void> => {
        try {
            set({ loading: true });

            const params = new URLSearchParams({
                ...(search && { search }),
                ...(year !== "all" && { year }),
                ...(department !== "all" && { department }),
                sort,
                order,
            });

            const res = await axios.get(`/repository/sort?${params.toString()}`);

            const data = Array.isArray(res.data) ? res.data : res.data.data ?? [];
            set({ repository: data, loading: false });

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


    viewsDownloads: async(): Promise<void> => {
            set({ loading: true});
        try {
            const res = await axios.get('repository/viewsdownloads');

            set({ dataAnalytics: res.data.data });;
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            set({ loading: false });
        }
    },


    incrementViews: (id: string) => set((state) => ({
        thesisData: state.thesisData?.id === id
            ? {
                ...state.thesisData,
                ThesisDataAnalytics: [{
                    ...state.thesisData.ThesisDataAnalytics?.[0],
                    views: (state.thesisData.ThesisDataAnalytics?.[0]?.views ?? 0) + 1
                }]
            }
            : state.thesisData,
        repository: state.repository.map((thesis) =>
            thesis.id === id
                ? {
                    ...thesis,
                    ThesisDataAnalytics: [{
                        ...thesis.ThesisDataAnalytics?.[0],
                        views: (thesis.ThesisDataAnalytics?.[0]?.views ?? 0) + 1
                    }]
                }
                : thesis
        ),
        
        randomRepository: state.randomRepository.map((thesis) =>
        thesis.id === id
            ? {
                ...thesis,
                ThesisDataAnalytics: [{
                    ...thesis.ThesisDataAnalytics?.[0],
                    views: (thesis.ThesisDataAnalytics?.[0]?.views ?? 0) + 1
                }]
            }
            : thesis
    ),

    dataAnalytics: state.dataAnalytics.map((analytic) =>
        analytic.thesis_id === id
            ? { ...analytic, views: (Number(analytic.views) || 0) + 1 }
            : analytic
    ),
    })),

    incrementDownloads: () => set((state) => ({
        thesisData: state.thesisData
            ? {
                ...state.thesisData,
                ThesisDataAnalytics: [{
                    ...state.thesisData.ThesisDataAnalytics?.[0],
                    downloads: (state.thesisData.ThesisDataAnalytics?.[0]?.downloads ?? 0) + 1
                }]
            }
            : null,
        repository: state.repository.map((thesis) =>
            thesis.id === state.thesisData?.id
                ? {
                    ...thesis,
                    ThesisDataAnalytics: [{
                        ...thesis.ThesisDataAnalytics?.[0],
                        downloads: (thesis.ThesisDataAnalytics?.[0]?.downloads ?? 0) + 1
                    }]
                }
                : thesis
        ),
        dataAnalytics: state.dataAnalytics.map((analytic) =>
            analytic.thesis_id === state.thesisData?.id
                ? { ...analytic, downloads: (Number(analytic.downloads) || 0) + 1 }
                : analytic
        ),
    })),
}))