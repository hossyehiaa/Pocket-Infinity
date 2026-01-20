import { create } from "zustand";

interface ControlsState {
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  shoot: boolean;
  talk: boolean;
  
  setMove: (x: number, z: number) => void;
  setLook: (x: number, y: number) => void;
  setJump: (jump: boolean) => void;
  setShoot: (shoot: boolean) => void;
  setTalk: (talk: boolean) => void;
  resetControls: () => void;
}

export const useControls = create<ControlsState>((set) => ({
  moveX: 0,
  moveZ: 0,
  lookX: 0,
  lookY: 0,
  jump: false,
  shoot: false,
  talk: false,

  setMove: (x, z) => set({ moveX: x, moveZ: z }),
  setLook: (x, y) => set({ lookX: x, lookY: y }),
  setJump: (jump) => set({ jump }),
  setShoot: (shoot) => set({ shoot }),
  setTalk: (talk) => set({ talk }),
  resetControls: () =>
    set({
      moveX: 0,
      moveZ: 0,
      lookX: 0,
      lookY: 0,
      jump: false,
      shoot: false,
      talk: false,
    }),
}));
