import axios from '@/lib/axios';
import { create } from 'zustand';


interface productState{
    repository: any[];
    randomRepository: any[];
    loading: boolean;
    getRandomRepository: () => void;
    getAllRepository: () => void;
    sortByYear:(year: string) => void;
}



export const repoStores = create<productState>((set, get) => ({
     randomRepository: [],
     repository: [],
     loading: false,

    
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
     
     getAllRepository: async(): Promise<void> => {
        try {

            set({ loading: true });
            const res = await axios.get('/repository/getthesis');
            console.log(res.data);

            set({ repository: res.data, loading: false });
        } catch (error: any) {
            console.error('Failed fetching data:', error);  
            set({ loading: false });  
        }
     },

     sortByYear: async(year: string): Promise<void> => {
        try {
            set({ loading: true });
            const res = await axios.get(`/repository/getyear?year=${year}`);
            console.log(res.data);

            set({ repository: res.data});
            
        } catch (error) {
            console.error('Failed sorting by year:', error);  
            set({ loading: false }); 
        }
     },
}))