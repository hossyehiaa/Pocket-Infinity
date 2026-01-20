import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GameScene = "bridge" | "planet";

export interface PlanetParams {
  groundColor: string;
  fogDensity: number;
  gravity: number;
  planetName: string;
}

export interface CrewMember {
  id: string;
  name: string;
  position: [number, number, number];
  personality: string;
}

export interface Enemy {
  id: string;
  position: [number, number, number];
  health: number;
}

export interface Bullet {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  createdAt: number;
  weaponType?: WeaponType;
  damage?: number;
}

export type WeaponType = "blaster" | "shotgun" | "sniper";

export interface WeaponInfo {
  name: string;
  damage: number;
  cooldown: number;
  range: number;
  spread?: number;
  projectileCount?: number;
}

export interface ZoneState {
  radius: number;
  targetRadius: number;
  centerX: number;
  centerZ: number;
  startTime: number;
  shrinkDuration: number;
  isActive: boolean;
}

interface GameState {
  scene: GameScene;
  planetParams: PlanetParams;
  crew: CrewMember[];
  enemies: Enemy[];
  bullets: Bullet[];
  playerHealth: number;
  score: number;
  nearCrew: CrewMember | null;
  chatOpen: boolean;
  chatMessages: { role: "user" | "assistant"; content: string }[];
  isWarping: boolean;
  isMobile: boolean;
  playerPosition: [number, number, number];
  isGameOver: boolean;
  showDamageFlash: boolean;
  knockbackDirection: [number, number, number] | null;
  isMicMuted: boolean;
  currentWeapon: WeaponType;
  isOnHoverboard: boolean;
  zone: ZoneState;
  isInVehicle: boolean;
  nearVehicle: boolean;
  
  setScene: (scene: GameScene) => void;
  setWeapon: (weapon: WeaponType) => void;
  toggleHoverboard: () => void;
  setPlayerPosition: (position: [number, number, number]) => void;
  setGameOver: (gameOver: boolean) => void;
  triggerDamageFlash: () => void;
  applyKnockback: (direction: [number, number, number]) => void;
  setPlanetParams: (params: PlanetParams) => void;
  setNearCrew: (crew: CrewMember | null) => void;
  setChatOpen: (open: boolean) => void;
  addChatMessage: (role: "user" | "assistant", content: string) => void;
  clearChat: () => void;
  setWarping: (warping: boolean) => void;
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  clearEnemies: () => void;
  damageEnemy: (id: string, damage: number) => void;
  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  clearBullets: () => void;
  addScore: (points: number) => void;
  damagePlayer: (damage: number) => void;
  resetGame: () => void;
  setIsMobile: (mobile: boolean) => void;
  setMicMuted: (muted: boolean) => void;
  updateEnemyPosition: (id: string, position: [number, number, number]) => void;
  updateZone: (zone: Partial<ZoneState>) => void;
  startZone: () => void;
  setInVehicle: (inVehicle: boolean) => void;
  setNearVehicle: (near: boolean) => void;
}

const initialCrew: CrewMember[] = [
  {
    id: "walton",
    name: "Walton",
    position: [-3, 0, 2],
    personality: "A nervous engineer who fears the captain. Speaks hesitantly and often apologizes.",
  },
  {
    id: "nanette",
    name: "Nanette",
    position: [3, 0, 2],
    personality: "A brave but frightened crew member. She secretly plots escape but dares not speak openly.",
  },
];

const defaultPlanetParams: PlanetParams = {
  groundColor: "#8B4513",
  fogDensity: 0.02,
  gravity: -9.8,
  planetName: "Unknown Planet",
};

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    scene: "bridge",
    planetParams: defaultPlanetParams,
    crew: initialCrew,
    enemies: [],
    bullets: [],
    playerHealth: 100,
    score: 0,
    nearCrew: null,
    chatOpen: false,
    chatMessages: [],
    isWarping: false,
    isMobile: false,
    playerPosition: [0, 1, 0],
    isGameOver: false,
    showDamageFlash: false,
    knockbackDirection: null,
    isMicMuted: false,
    currentWeapon: "blaster",
    isOnHoverboard: false,
    zone: {
      radius: 100,
      targetRadius: 5,
      centerX: 0,
      centerZ: 0,
      startTime: 0,
      shrinkDuration: 120000,
      isActive: false,
    },
    isInVehicle: false,
    nearVehicle: false,

    setScene: (scene) => {
      if (scene === "bridge") {
        set({ scene, enemies: [], bullets: [], isOnHoverboard: false });
      } else {
        set({ scene });
      }
    },
    setPlanetParams: (params) => set({ planetParams: params }),
    setNearCrew: (crew) => set({ nearCrew: crew }),
    setChatOpen: (open) => set({ chatOpen: open }),
    addChatMessage: (role, content) =>
      set((state) => ({
        chatMessages: [...state.chatMessages, { role, content }],
      })),
    clearChat: () => set({ chatMessages: [] }),
    setWarping: (warping) => set({ isWarping: warping }),
    addEnemy: (enemy) =>
      set((state) => ({ enemies: [...state.enemies, enemy] })),
    removeEnemy: (id) =>
      set((state) => ({ enemies: state.enemies.filter((e) => e.id !== id) })),
    clearEnemies: () => set({ enemies: [] }),
    damageEnemy: (id, damage) =>
      set((state) => ({
        enemies: state.enemies.map((e) =>
          e.id === id ? { ...e, health: e.health - damage } : e
        ),
      })),
    addBullet: (bullet) =>
      set((state) => ({ bullets: [...state.bullets, bullet] })),
    removeBullet: (id) =>
      set((state) => ({ bullets: state.bullets.filter((b) => b.id !== id) })),
    clearBullets: () => set({ bullets: [] }),
    addScore: (points) =>
      set((state) => ({ score: state.score + points })),
    damagePlayer: (damage) =>
      set((state) => {
        const newHealth = Math.max(0, state.playerHealth - damage);
        return { 
          playerHealth: newHealth,
          isGameOver: newHealth <= 0
        };
      }),
    setPlayerPosition: (position) => set({ playerPosition: position }),
    setGameOver: (gameOver) => set({ isGameOver: gameOver }),
    triggerDamageFlash: () => {
      set({ showDamageFlash: true });
      setTimeout(() => set({ showDamageFlash: false }), 200);
    },
    applyKnockback: (direction) => {
      set({ knockbackDirection: direction });
      setTimeout(() => set({ knockbackDirection: null }), 300);
    },
    resetGame: () =>
      set({
        scene: "bridge",
        planetParams: defaultPlanetParams,
        enemies: [],
        bullets: [],
        playerHealth: 100,
        score: 0,
        nearCrew: null,
        chatOpen: false,
        chatMessages: [],
        isWarping: false,
        isGameOver: false,
        showDamageFlash: false,
        knockbackDirection: null,
        currentWeapon: "blaster",
        isOnHoverboard: false,
        zone: {
          radius: 100,
          targetRadius: 5,
          centerX: 0,
          centerZ: 0,
          startTime: 0,
          shrinkDuration: 120000,
          isActive: false,
        },
        isInVehicle: false,
        nearVehicle: false,
      }),
    setIsMobile: (mobile) => set({ isMobile: mobile }),
    setMicMuted: (muted) => set({ isMicMuted: muted }),
    updateEnemyPosition: (id, position) =>
      set((state) => ({
        enemies: state.enemies.map((e) =>
          e.id === id ? { ...e, position } : e
        ),
      })),
    setWeapon: (weapon) => set({ currentWeapon: weapon }),
    toggleHoverboard: () => set((state) => ({ isOnHoverboard: !state.isOnHoverboard })),
    updateZone: (zoneUpdate) => set((state) => ({ zone: { ...state.zone, ...zoneUpdate } })),
    startZone: () => set((state) => ({
      zone: {
        ...state.zone,
        startTime: Date.now(),
        isActive: true,
        radius: 100,
      }
    })),
    setInVehicle: (inVehicle) => set({ isInVehicle: inVehicle }),
    setNearVehicle: (near) => set({ nearVehicle: near }),
  }))
);

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  blaster: {
    name: "Blaster",
    damage: 25,
    cooldown: 300,
    range: 100,
  },
  shotgun: {
    name: "Shotgun",
    damage: 15,
    cooldown: 800,
    range: 20,
    spread: 0.3,
    projectileCount: 5,
  },
  sniper: {
    name: "Sniper",
    damage: 100,
    cooldown: 1500,
    range: 200,
  },
};
