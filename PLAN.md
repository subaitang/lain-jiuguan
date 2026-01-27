# Optimization Plan  
  
## 1. Missing Implementations  
- **Global State Store (`services/store.ts`)**: Missing file referenced in tabs. Will implement using `zustand` to manage app state efficiently.  
- **Map Generation**: Currently random noise. Will implement `worldEngine.ts` with AI-driven map generation.  
- **Modular Engines**: Splitting `geminiService.ts` into specialized engines (`worldEngine`, etc.) to improve maintainability.  
  
## 2. Action Plan  
1. Install `zustand`.  
2. Create `services/store.ts`.  
3. Create `services/worldEngine.ts` and move/improve Map/News logic.  
4. Update `App.tsx` to use the new World Engine. 
