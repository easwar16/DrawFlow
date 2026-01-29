import { create } from "zustand";
import { Shape } from "../lib/utils";
import { ToolType } from "@/types/shape/shape";

const cloneShapes = (shapes: Shape[]) =>
  typeof structuredClone === "function"
    ? structuredClone(shapes)
    : JSON.parse(JSON.stringify(shapes));

type EditorState = {
  // domain
  shapes: Shape[];
  roomId: string | null;
  past: Shape[][];
  future: Shape[][];

  // interaction
  currentTool: ToolType;
  selectedShapeIds: string[];

  // actions
  setRoomId: (id: string | null) => void;
  setShapes: (shapes: Shape[]) => void;
  setTool: (tool: ToolType) => void;

  setSelectedShapeIds: (ids: string[]) => void;
  toggleSelectedShape: (id: string) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
  removeShape: (id: string) => void;
  undo: () => void;
  redo: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  // domain
  shapes: [],
  roomId: null,
  past: [],
  future: [],

  // interaction
  currentTool: "select",
  selectedShapeIds: [],

  // actions

  setSelectedShapeIds: (ids: string[]) => set({ selectedShapeIds: ids }),

  toggleSelectedShape: (id: string) =>
    set((state) => ({
      selectedShapeIds: state.selectedShapeIds.includes(id)
        ? state.selectedShapeIds.filter((sid) => sid !== id)
        : [...state.selectedShapeIds, id],
    })),
  setRoomId: (id) => set({ roomId: id }),

  setShapes: (shapes) =>
    set((state) => ({
      past: [...state.past, cloneShapes(state.shapes)],
      future: [],
      shapes: cloneShapes(shapes),
      selectedShapeIds: [],
    })),

  setTool: (tool) => set({ currentTool: tool }),
  removeShape: (id: string) =>
    set((state) => ({
      past: [...state.past, cloneShapes(state.shapes)],
      future: [],
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
    })),

  addShape: (shape) =>
    set((state) => ({
      past: [...state.past, cloneShapes(state.shapes)],
      future: [],
      shapes: [...state.shapes, shape],
    })),

  updateShape: (id, updater) =>
    set((state) => ({
      past: [...state.past, cloneShapes(state.shapes)],
      future: [],
      shapes: state.shapes.map((shape) =>
        shape.id === id ? updater(shape) : shape,
      ),
    })),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [cloneShapes(state.shapes), ...state.future],
        shapes: cloneShapes(previous),
        selectedShapeIds: [],
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      return {
        ...state,
        past: [...state.past, cloneShapes(state.shapes)],
        future: state.future.slice(1),
        shapes: cloneShapes(next),
        selectedShapeIds: [],
      };
    }),
}));
