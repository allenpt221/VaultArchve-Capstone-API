import axios from '@/lib/axios';
import { create } from 'zustand';


interface userProps{
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
}

interface CreateUserProps{
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    role: string;
}

interface MutationResult {
  success: boolean;
  message?: string;
}


interface usersStateProps{
    users: userProps[];
    selectedUser: userProps | null;
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;

    fetchUsers: (page: number, limit: number) => Promise<MutationResult>;
    addUser: (data: CreateUserProps) => Promise<MutationResult>;
    disableUser: (id: string) => Promise<MutationResult>;
    deleteUser: (id: string) => Promise<MutationResult>;
    setSelectedUser: (user: userProps | null) => void;
}


export const userStore = create<usersStateProps>((set, get) => ({
    users: [],
    selectedUser: null,
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,

  fetchUsers: async (page: number, limit: number): Promise<MutationResult> => {
    try {
      set({ loading: true, error: null });

      const res = await axios.get('/auth/getuser', { params: { page, limit } });

      const { users, totalCount, currentPage, totalPages } = res.data.users;

      set({
        users,
        totalCount,
        currentPage,
        totalPages,
        loading: false,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;
      const message = data?.error || data?.message || 'Failed to fetch users.';

      set({ error: message });

      return { success: false, message };
    }
  },

  addUser: async (newUser: CreateUserProps): Promise<MutationResult> => {
    try {
      set({ loading: true, error: null });

      const res = await axios.post('/auth/signup', newUser);

      set({
        users: [...get().users, res.data.user],
        loading: false,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;
      const message = data?.error || data?.message || 'Failed to add user.';

      set({ error: message });

      return { success: false, message };
    }
  },

  disableUser: async (id: string): Promise<MutationResult> => {
    try {
      set({ loading: true, error: null });

      const res = await axios.put(`/auth/disable/${id}`);

      set({
        users: get().users.map((u) => (u.id === id ? res.data.user : u)),
        selectedUser: get().selectedUser?.id === id ? res.data.user : get().selectedUser,
        loading: false,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;
      const message = data?.error || data?.message || 'Failed to disable user.';

      set({ error: message });

      return { success: false, message };
    }
  },

  deleteUser: async (id: string): Promise<MutationResult> => {
    try {
      set({ loading: true, error: null });

      await axios.delete(`/auth/delete/${id}`);

      set({
        users: get().users.filter((u) => u.id !== id),
        selectedUser: get().selectedUser?.id === id ? null : get().selectedUser,
        loading: false,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;
      const message = data?.error || data?.message || 'Failed to delete user.';

      set({ error: message });

      return { success: false, message };
    }
  },

  setSelectedUser: (user: userProps | null): void => {
    set({ selectedUser: user });
  },

}));