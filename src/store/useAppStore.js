import { create } from 'zustand';

const defaultSettings = Object.freeze({
  threshold: 128,
  turdSize: 2,
  optTolerance: 0.2,
  turnPolicy: 'minority',
  color: true,
  optimizePrecision: 3,
});

export const useAppStore = create((set) => ({
  raster: null,
  vector: null,
  status: 'idle',
  settings: defaultSettings,
  setRaster: (file) =>
    set(() => ({
      raster: file,
      vector: null,
      status: 'ready',
    })),
  setVector: (svg) =>
    set(() => ({
      vector: svg,
    })),
  updateSettings: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...partial,
      },
    })),
  setStatus: (status) => set(() => ({ status })),
  reset: () =>
    set(() => ({
      raster: null,
      vector: null,
      status: 'idle',
      settings: defaultSettings,
    })),
}));
