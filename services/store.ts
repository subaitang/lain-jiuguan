import { create } from 'zustand';  
  
interface AppState {  
  activeTargetId: string;  
  setActiveTargetId: (id: string) => void;  
}  
  
export const useStore = create<AppState>((set) => ({  
  activeTargetId: 'default-lain',  
  setActiveTargetId: (id) => set({ activeTargetId: id }),  
})); 
