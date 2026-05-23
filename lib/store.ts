import { create } from "zustand";

export type Phase =
  | "upload"
  | "suggesting"
  | "picking"
  | "editing"
  | "exporting"
  | "shared";

export type Suggestion = {
  templateId: string;
  texts: string[];
  tone: string;
};

export type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type RemixPreset = {
  templateId: string;
  texts: string[];
};

type Store = {
  phase: Phase;
  imageDataUrl: string | null;
  suggestions: Suggestion[];
  usedFallbackSuggestions: boolean;
  selectedIndex: number;
  layers: TextLayer[];
  creatorToken: string | null;
  sharedMemeId: string | null;
  remixPreset: RemixPreset | null;
  promptContext: string | null;
  error: string | null;

  setPhase: (phase: Phase) => void;
  setImage: (dataUrl: string) => void;
  setSuggestions: (
    suggestions: Suggestion[],
    usedFallbackSuggestions?: boolean,
  ) => void;
  selectSuggestion: (index: number) => void;
  setLayers: (layers: TextLayer[]) => void;
  updateLayer: (id: string, updates: Partial<TextLayer>) => void;
  setShared: (memeId: string, creatorToken: string) => void;
  setRemixPreset: (preset: RemixPreset | null) => void;
  setPromptContext: (context: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState = {
  phase: "upload" as Phase,
  imageDataUrl: null,
  suggestions: [],
  usedFallbackSuggestions: false,
  selectedIndex: 0,
  layers: [],
  creatorToken: null,
  sharedMemeId: null,
  remixPreset: null,
  promptContext: null,
  error: null,
};

export const useStore = create<Store>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setImage: (dataUrl) =>
    set((state) => {
      if (state.remixPreset) {
        const { templateId, texts } = state.remixPreset;
        return {
          imageDataUrl: dataUrl,
          remixPreset: null,
          suggestions: [{ templateId, texts, tone: "Remix" }],
          selectedIndex: 0,
          phase: "editing",
        };
      }
      return { imageDataUrl: dataUrl, phase: "suggesting" };
    }),

  setSuggestions: (suggestions, usedFallbackSuggestions = false) =>
    set({
      suggestions,
      usedFallbackSuggestions,
      phase: "picking",
      promptContext: null,
    }),

  selectSuggestion: (index) => set({ selectedIndex: index, phase: "editing" }),

  setLayers: (layers) => set({ layers }),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  setShared: (sharedMemeId, creatorToken) =>
    set({ sharedMemeId, creatorToken, phase: "shared" }),

  setRemixPreset: (remixPreset) => set({ remixPreset }),

  setPromptContext: (promptContext) => set({ promptContext }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
