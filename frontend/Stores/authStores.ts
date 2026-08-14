import axios from '@/lib/axios';
import { create } from 'zustand';


interface userProps{
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    status: string;
    familybackground?: string;
    familycontact?: string;
}

interface LoginProps{
    email:string;
    password: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  retryAfter?: string;
}

interface ForgotPasswordResult {
  success: boolean;
  message?: string;

}

interface ResetPasswordResult {
  success: boolean;
  message?: string;
}

interface UpdateProfileProps {
  firstname: string;
  lastname: string;
  familybackground: string;
  familycontact: string;
}

interface UpdateProfileResult {
  success: boolean;
  message?: string;
}

interface UpdatePasswordProps {
  currentPassword: string;
  newPassword: string;
}

interface UpdatePasswordResult {
  success: boolean;
  message?: string;
}



interface authProps{
    user: userProps | null;
    loading: boolean;
    checkingAuth: boolean;
    justLoggedIn: boolean;
    forgotPasswordLoading: boolean,
    resetPasswordLoading: boolean;
    updateProfileLoading: boolean;
    updatePasswordLoading: boolean;
    logIn: (data: LoginProps) => Promise<LoginResult>;
    logOut: () => void;
    forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
    checkAuth: () => void;
    resetPassword: (data: {
      id: string;
      token: string;
      password: string;
      confirmPassword: string;
    }) => Promise<ResetPasswordResult>;
    updateProfile: (data: UpdateProfileProps) => Promise<UpdateProfileResult>;
    updatePassword: (data: UpdatePasswordProps) => Promise<UpdatePasswordResult>;
}


export const authUserStore = create<authProps>((set, get) => ({
    user: null,
    loading: false,
    justLoggedIn: false,
    checkingAuth: true,
    forgotPasswordLoading: false,
    resetPasswordLoading: false,
    updateProfileLoading: false,
    updatePasswordLoading: false,

  logIn: async ({ email, password }: LoginProps): Promise<LoginResult> => {
    try {
      set({ loading: true });

      const res = await axios.post('/auth/login', { email, password });

      set({
        user: res.data.user,
        loading: false,
        justLoggedIn: true,
      });

      return { success: true };

    } catch (error: any) {
      set({ loading: false });

      const data = error.response?.data;

      return {
        success: false,
        message: data?.message || 'Something went wrong.',
        retryAfter: data?.retryAfter,
      };
    }
  },  

  checkAuth: async (): Promise<void> => {
    set({ checkingAuth: true });
    try {
      const res = await axios.get('auth/profile');
      set({ user: res.data, checkingAuth: false });
    } catch (error: any) {
      set({ checkingAuth: false, user: null });
    }
  },

  logOut: async (): Promise<void> => {
      try {
        await axios.post('auth/logout');
        set({user: null})
    } catch (error) {
      console.error('logout failed:', error);    
    }
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResult> => {
    try {
      set({ forgotPasswordLoading: true });

      const res = await axios.post('/auth/forgot-password', { email });

      set({ forgotPasswordLoading: false });

      return {
        success: true,
        message: res.data.message,
      };

    } catch (error: any) {
      set({ forgotPasswordLoading: false });

      const data = error.response?.data;

      return {
        success: false,
        message: data?.message || 'Something went wrong.',
      };
    }
  },

  resetPassword: async ({ id, token, password, confirmPassword }) => {
  try {
    set({ resetPasswordLoading: true });

    const res = await axios.post('/auth/reset-password', {
      id,
      token,
      password,
      confirmPassword,
    });

    set({ resetPasswordLoading: false });

    return { success: true, message: res.data.message };
  } catch (error: any) {
    set({ resetPasswordLoading: false });

    const data = error.response?.data;

    return {
      success: false,
      message: data?.message || 'Something went wrong.',
    };
  }
},

  updateProfile: async ({ firstname, lastname, familybackground, familycontact }: UpdateProfileProps): Promise<UpdateProfileResult> => {
    try {
      set({ updateProfileLoading: true });

      const res = await axios.put('/auth/updateprofile', {
        firstname,
        lastname,
        familybackground,
        familycontact,
      });

      set({
        user: res.data.user,
        updateProfileLoading: false,
      });

      return { success: true, message: res.data.message };

    } catch (error: any) {
      set({ updateProfileLoading: false });

      const data = error.response?.data;

      return {
        success: false,
        message: data?.message || 'Something went wrong.',
      };
    }
  },

  updatePassword: async ({ currentPassword, newPassword }: UpdatePasswordProps): Promise<UpdatePasswordResult> => {
    try {
      set({ updatePasswordLoading: true });

      const res = await axios.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      set({ updatePasswordLoading: false });

      return { success: true, message: res.data.message };

    } catch (error: any) {
      set({ updatePasswordLoading: false });

      const data = error.response?.data;

      return {
        success: false,
        message: data?.message || 'Something went wrong.',
      };
    }
  },

}));