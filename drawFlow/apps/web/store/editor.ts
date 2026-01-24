import { create } from "zustand";
import { Shape } from "../lib/utils";
import { ToolType } from "@/types/shape/shape";

type EditorState = {
  // domain
  shapes: Shape[];
  roomId: number | null;

  // interaction
  currentTool: ToolType;
  selectedShapeIds: string[];

  // actions
  setRoomId: (id: number) => void;
  setShapes: (shapes: Shape[]) => void;
  setTool: (tool: ToolType) => void;

  setSelectedShapeIds: (ids: string[]) => void;
  toggleSelectedShape: (id: string) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  // domain
  shapes: [],
  roomId: null,

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

  setShapes: (shapes) => set({ shapes }),

  setTool: (tool) => set({ currentTool: tool }),

  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape],
    })),

  updateShape: (id, updater) =>
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? updater(shape) : shape,
      ),
    })),
}));
