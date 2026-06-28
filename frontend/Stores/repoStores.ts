import axios from '@/lib/axios';
import { create } from 'zustand';

type BasePayload = {
  course: string;
  title: string;
  author: string;
  issueDate: string;
};

type StandardFields = {
  type: "standard";
  thesis_abstract: string;
  thesis_introduction: string;
  thesis_discussion: string;
  thesis_conclusion: string;
  thesis_references: string;
};

type EntrepFields = {
  type: "entrepreneurship";
  entrep_intro: string;
  entrep_action_plan: string;
  entrep_market_product_description: string;
  entrep_survey_result: string;
  entrep_target_market: string;
  entrep_product: string;
  entrep_production: string;
};

// Create: file is always required
export type ThesisPayload = BasePayload & { file: File } & (StandardFields | EntrepFields);

// Update: file is optional — editing a thesis doesn't require re-uploading the PDF
export type UpdateThesisPayload = BasePayload & { id: string; file?: File } & (StandardFields | EntrepFields);

type Thesis = any;

interface productState {
  repository: Thesis[];
  randomRepository: Thesis[];
  thesisData: Thesis | null;
  loading: boolean;
  notFound: boolean;
  dataAnalytics: any[];

  totalCount: number;
  currentPage: number;
  totalPages: number;

  getRandomRepository: () => void;
  viewsDownloads: () => void;
  getPageRepository: (page: number, limit: number) => void;
  FilteredThesis: (
    search: string,
    year: string,
    department: string,
    sort: string,
    order: string
  ) => void;

  ThesisById: (id: string) => void;

  submitThesis: (data: ThesisPayload) => Promise<any>;
  updateThesis: (data: UpdateThesisPayload) => Promise<any>;
  deleteThesis: (id: string) => void;

  incrementDownloads: () => void;
  incrementViews: (id: string) => void;
}

export const repoStores = create<productState>((set, get) => ({
  randomRepository: [],
  repository: [],
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

  submitThesis: async (payload: ThesisPayload) => {
    try {
      set({ loading: true });

      const formData = new FormData();

      formData.append("title", payload.title);
      formData.append("author", payload.author);
      formData.append("course", payload.course);
      formData.append("issueDate", payload.issueDate);
      formData.append("thesis_file", payload.file);

      if (payload.type === "entrepreneurship") {
        formData.append("entrep_intro", payload.entrep_intro);
        formData.append("entrep_action_plan", payload.entrep_action_plan);
        formData.append("entrep_market_product_description", payload.entrep_market_product_description);
        formData.append("entrep_survey_result", payload.entrep_survey_result);
        formData.append("entrep_target_market", payload.entrep_target_market);
        formData.append("entrep_product", payload.entrep_product);
        formData.append("entrep_production", payload.entrep_production);
      }

      if (payload.type === "standard") {
        formData.append("thesis_abstract", payload.thesis_abstract);
        formData.append("thesis_introduction", payload.thesis_introduction);
        formData.append("thesis_discussion", payload.thesis_discussion);
        formData.append("thesis_conclusion", payload.thesis_conclusion);
        formData.append("thesis_references", payload.thesis_references);
      }

      const res = await axios.post("/repository/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newThesis = res.data?.data;

      if (newThesis) {
        set((state) => ({
          repository: [newThesis, ...state.repository],
          randomRepository: [newThesis, ...state.randomRepository],
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

      if (payload.file) {
        formData.append("thesis_file", payload.file);
      }

      if (payload.type === "entrepreneurship") {
        formData.append("entrep_intro", payload.entrep_intro);
        formData.append("entrep_action_plan", payload.entrep_action_plan);
        formData.append("entrep_market_product_description", payload.entrep_market_product_description);
        formData.append("entrep_survey_result", payload.entrep_survey_result);
        formData.append("entrep_target_market", payload.entrep_target_market);
        formData.append("entrep_product", payload.entrep_product);
        formData.append("entrep_production", payload.entrep_production);
      }

      if (payload.type === "standard") {
        formData.append("thesis_abstract", payload.thesis_abstract);
        formData.append("thesis_introduction", payload.thesis_introduction);
        formData.append("thesis_discussion", payload.thesis_discussion);
        formData.append("thesis_conclusion", payload.thesis_conclusion);
        formData.append("thesis_references", payload.thesis_references);
      }

      const res = await axios.put(
        `/repository/thesis/update/${payload.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedFromServer = res.data?.data;

      // Build the merge from what we know we just sent, so the UI reflects the
      // edit immediately regardless of the backend's response shape. Server
      // response (if present) is spread last so it can still win — e.g. a
      // fresh file URL after replacing the PDF.
      const localUpdate: Record<string, any> = {
        title: payload.title,
        author: payload.author,
        course: payload.course,
        issue_date: payload.issueDate,
        ...(payload.type === "standard" && {
          thesis_abstract: payload.thesis_abstract,
          thesis_introduction: payload.thesis_introduction,
          thesis_discussion: payload.thesis_discussion,
          thesis_conclusion: payload.thesis_conclusion,
          thesis_references: payload.thesis_references,
        }),
        ...(payload.type === "entrepreneurship" && {
          entrep_intro: payload.entrep_intro,
          entrep_action_plan: payload.entrep_action_plan,
          entrep_market_product_description: payload.entrep_market_product_description,
          entrep_survey_result: payload.entrep_survey_result,
          entrep_target_market: payload.entrep_target_market,
          entrep_product: payload.entrep_product,
          entrep_production: payload.entrep_production,
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

      dataAnalytics: state.dataAnalytics.map((a) =>
        a.thesis_id === state.thesisData?.id
          ? { ...a, downloads: (Number(a.downloads) || 0) + 1 }
          : a
      ),
    })),
}));