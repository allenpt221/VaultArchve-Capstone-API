import { create } from 'zustand';


interface useState{
    user: null;
    loading: boolean;
}


export const authUserStore = create<useState>((set, get) => ({
    user: null,
    loading: false

    


}));