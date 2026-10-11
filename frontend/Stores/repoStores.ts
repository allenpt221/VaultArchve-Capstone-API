import axios from '@/lib/axios';
import { create } from 'zustand';

type BasePayload = {
  course: string;
  title: string;
  author: string;
  issueDate: string;
  thesis_abstract: string;
  // Optional, comma-separated, e.g. "cost accounting, SMEs, inventory"
  keywords?: string;
};

// Create: file is always required
export type ThesisPayload = BasePayload & { file: File };

// Update: file is optional — editing a thesis doesn't require re-uploading the PDF
export type UpdateThesisPayload = BasePayload & { id: string; file?: File };

// What the server detects from an uploaded PDF
export type ExtractedThesisInfo = {
  title: string | null;
  author: string | null;
  course: string | null;
  issue_date: string | null;
  abstract: string | null;
  keywords: string | null;
  // "printed" = copied from the paper's own keywords list, "generated" = picked from its content
  keywords_source: "printed" | "generated" | null;
  source: "abstract" | "introduction" | null;
};

type Thesis = any;

interface productState {
  repository: Thesis[];
  randomRepository: Thesis[];
  masterRepository: Thesis[];
  thesisData: Thesis | null;
  loading: boolean;
  notFound: boolean;
  dataAnalytics: any[];

  totalCount: number;
  currentPage: number;
  totalPages: number;

  getRandomRepository: () => void;
  viewsDownloads: () => void;
  getMasterRepository: () => void;
  getPageRepository: (page: number, limit: number) => void;
  FilteredThesis: (
    search: string,
    year: string,
    department: string,
    sort: string,
    order: string
  ) => void;

  ThesisById: (id: string) => Promise<void>;

  extractThesisInfo: (file: File) => Promise<ExtractedThesisInfo>;
  submitThesis: (data: ThesisPayload) => Promise<any>;
  updateThesis: (data: UpdateThesisPayload) => Promise<any>;
  deleteThesis: (id: string) => void;

  incrementDownloads: () => void;
  incrementViews: (id: string) => void;
  incrementSaves: (id: string) => void;
  decrementSaves: (id: string) => void;
}

export const repoStores = create<productState>((set, get) => ({
  randomRepository: [],
  repository: [],
  masterRepository: [],
  thesisData: null,
  dataAnalytics: [],
  loading: false,
  notFound: false,

  totalCount: 0,
  currentPage: 1,
  totalPages: 1,

  getRandomRepository: async () => {
    try {
      set({ loading: true, randomRepository: [] });
      const res = await axios.get('/repository/features');
      set({ randomRepository: res.data.data, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },


  getMasterRepository: async () => {
    try {
      const res = await axios.get(
        `/repository/sort?sort=issue_date&order=desc`
      );
      const data = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      set({ masterRepository: data });
    } catch (error) {
      console.error(error);
    }
  },

  getPageRepository: async (page: number, limit: number) => {
    try {
      set({ loading: true, repository: [] });
      const res = await axios.get(`/repository/getthesis?page=${page}&limit=${limit}`);
      const { thesis, totalCount, currentPage, totalPages } = res.data.thesis;

      set({
        repository: thesis,
        totalCount,
        currentPage,
        totalPages,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  FilteredThesis: async (search, year, department, sort, order) => {
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
      console.error(error);
      set({ loading: false });
    }
  },

  ThesisById: async (id: string) => {
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

  // Reads title/author/course/date/abstract/keywords from a PDF. Nothing is saved here.
  // Doesn't touch the global `loading` flag; the caller shows its own spinner.
  // Errors are rethrown so the caller can show the server's message.
  extractThesisInfo: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<ExtractedThesisInfo>(
      "/repository/thesis/extract-abstract",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return res.data;
  },

  submitThesis: async (payload: ThesisPayload) => {
    try {
      set({ loading: true });

      const formData = new FormData();

      formData.append("title", payload.title);
      formData.append("author", payload.author);
      formData.append("course", payload.course);
      formData.append("issueDate", payload.issueDate);
      formData.append("thesis_abstract", payload.thesis_abstract);
      // Only sent when filled in; if empty, the server reads them from the PDF
      if (payload.keywords) {
        formData.append("keywords", payload.keywords);
      }
      formData.append("thesis_file", payload.file);

      const res = await axios.post("/repository/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newThesis = res.data?.data;

      if (newThesis) {
        set((state) => ({
          repository: [newThesis, ...state.repository],
          randomRepository: [newThesis, ...state.randomRepository],
          masterRepository: [newThesis, ...state.masterRepository],
        }));
      }
    } finally {
      set({ loading: false });
    }
  },

  updateThesis: async (payload: UpdateThesisPayload) => {
    try {
      set({ loading: true });

      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("author", payload.author);
      formData.append("course", payload.course);
      formData.append("issueDate", payload.issueDate);
      formData.append("thesis_abstract", payload.thesis_abstract);

      // Always sent when provided, so an empty value clears the keywords
      if (payload.keywords !== undefined) {
        formData.append("keywords", payload.keywords);
      }

      if (payload.file) {
        formData.append("thesis_file", payload.file);
      }

      const res = await axios.put(
        `/repository/thesis/update/${payload.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedFromServer = res.data?.data;
      const localUpdate: Record<string, any> = {
        title: payload.title,
        author: payload.author,
        course: payload.course,
        issue_date: payload.issueDate,
        thesis_abstract: payload.thesis_abstract,
        ...(payload.keywords !== undefined && {
          keywords: payload.keywords.trim() || null,
        }),
        ...updatedFromServer,
      };

      set((state) => ({
        repository: state.repository.map((t) =>
          t.id === payload.id ? { ...t, ...localUpdate } : t
        ),
        randomRepository: state.randomRepository.map((t) =>
          t.id === payload.id ? { ...t, ...localUpdate } : t
        ),
        masterRepository: state.masterRepository.map((t) =>
          t.id === payload.id ? { ...t, ...localUpdate } : t
        ),
        thesisData:
          state.thesisData?.id === payload.id
            ? { ...state.thesisData, ...localUpdate }
            : state.thesisData,
      }));
    } finally {
      set({ loading: false });
    }
  },

  deleteThesis: async (id: string) => {
    try {
      await axios.delete(`repository/thesis/delete/${id}`);

      set((state) => ({
        repository: state.repository.filter((t) => t.id !== id),
        randomRepository: state.randomRepository.filter((t) => t.id !== id),
        masterRepository: state.masterRepository.filter((t) => t.id !== id),
        dataAnalytics: state.dataAnalytics.filter((a) => a.thesis_id !== id),
        thesisData: state.thesisData?.id === id ? null : state.thesisData,
      }));
    } catch (error) {
      console.error(error);
    }
  },

  viewsDownloads: async () => {
    try {
      set({ loading: true });
      const res = await axios.get('repository/viewsdownloads');
      set({ dataAnalytics: res.data.data });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  incrementViews: (id: string) =>
    set((state) => ({
      thesisData:
        state.thesisData?.id === id
          ? {
              ...state.thesisData,
              ThesisDataAnalytics: [
                {
                  ...state.thesisData.ThesisDataAnalytics?.[0],
                  views:
                    (state.thesisData.ThesisDataAnalytics?.[0]?.views ?? 0) +
                    1,
                },
              ],
            }
          : state.thesisData,

      repository: state.repository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  views: (t.ThesisDataAnalytics?.[0]?.views ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      randomRepository: state.randomRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  views: (t.ThesisDataAnalytics?.[0]?.views ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      masterRepository: state.masterRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  views: (t.ThesisDataAnalytics?.[0]?.views ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      dataAnalytics: state.dataAnalytics.map((a) =>
        a.thesis_id === id
          ? { ...a, views: (Number(a.views) || 0) + 1 }
          : a
      ),
    })),

  incrementDownloads: () =>
    set((state) => ({
      thesisData: state.thesisData
        ? {
            ...state.thesisData,
            ThesisDataAnalytics: [
              {
                ...state.thesisData.ThesisDataAnalytics?.[0],
                downloads:
                  (state.thesisData.ThesisDataAnalytics?.[0]?.downloads ?? 0) +
                  1,
              },
            ],
          }
        : null,

      repository: state.repository.map((t) =>
        t.id === state.thesisData?.id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  downloads:
                    (t.ThesisDataAnalytics?.[0]?.downloads ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      masterRepository: state.masterRepository.map((t) =>
        t.id === state.thesisData?.id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  downloads:
                    (t.ThesisDataAnalytics?.[0]?.downloads ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      dataAnalytics: state.dataAnalytics.map((a) =>
        a.thesis_id === state.thesisData?.id
          ? { ...a, downloads: (Number(a.downloads) || 0) + 1 }
          : a
      ),
    })),

  incrementSaves: (id: string) =>
    set((state) => ({
      thesisData:
        state.thesisData?.id === id
          ? {
              ...state.thesisData,
              ThesisDataAnalytics: [
                {
                  ...state.thesisData.ThesisDataAnalytics?.[0],
                  saves:
                    (state.thesisData.ThesisDataAnalytics?.[0]?.saves ?? 0) +
                    1,
                },
              ],
            }
          : state.thesisData,

      repository: state.repository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: (t.ThesisDataAnalytics?.[0]?.saves ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      randomRepository: state.randomRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: (t.ThesisDataAnalytics?.[0]?.saves ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      masterRepository: state.masterRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: (t.ThesisDataAnalytics?.[0]?.saves ?? 0) + 1,
                },
              ],
            }
          : t
      ),

      dataAnalytics: state.dataAnalytics.map((a) =>
        a.thesis_id === id
          ? { ...a, saves: (Number(a.saves) || 0) + 1 }
          : a
      ),
    })),

  decrementSaves: (id: string) =>
    set((state) => ({
      thesisData:
        state.thesisData?.id === id
          ? {
              ...state.thesisData,
              ThesisDataAnalytics: [
                {
                  ...state.thesisData.ThesisDataAnalytics?.[0],
                  saves: Math.max(
                    (state.thesisData.ThesisDataAnalytics?.[0]?.saves ?? 0) - 1,
                    0
                  ),
                },
              ],
            }
          : state.thesisData,

      repository: state.repository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: Math.max((t.ThesisDataAnalytics?.[0]?.saves ?? 0) - 1, 0),
                },
              ],
            }
          : t
      ),

      randomRepository: state.randomRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: Math.max((t.ThesisDataAnalytics?.[0]?.saves ?? 0) - 1, 0),
                },
              ],
            }
          : t
      ),

      masterRepository: state.masterRepository.map((t) =>
        t.id === id
          ? {
              ...t,
              ThesisDataAnalytics: [
                {
                  ...t.ThesisDataAnalytics?.[0],
                  saves: Math.max((t.ThesisDataAnalytics?.[0]?.saves ?? 0) - 1, 0),
                },
              ],
            }
          : t
      ),

      dataAnalytics: state.dataAnalytics.map((a) =>
        a.thesis_id === id
          ? { ...a, saves: Math.max((Number(a.saves) || 0) - 1, 0) }
          : a
      ),
    })),
}));