import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SkinType = 'soldier' | 'cyberbot' | 'alien';

interface PlayerStore {
    // Economy
    infinityCoins: number;
    gems: number;
    addInfinityCoins: (amount: number) => void;
    addGems: (amount: number) => void;
    spendInfinityCoins: (amount: number) => boolean;
    spendGems: (amount: number) => boolean;

    // Skins
    currentSkin: SkinType;
    ownedSkins: SkinType[];
    setSkin: (skin: SkinType) => void;
    unlockSkin: (skin: SkinType) => void;

    // Player stats
    totalKills: number;
    totalDeaths: number;
    gamesPlayed: number;
    wins: number;
    addKill: () => void;
    addDeath: () => void;
    addGame: (won: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
    persist(
        (set, get) => ({
            // Initial economy values
            infinityCoins: 1000,
            gems: 50,

            addInfinityCoins: (amount) => set((state) => ({
                infinityCoins: state.infinityCoins + amount
            })),

            addGems: (amount) => set((state) => ({
                gems: state.gems + amount
            })),

            spendInfinityCoins: (amount) => {
                const state = get();
                if (state.infinityCoins >= amount) {
                    set({ infinityCoins: state.infinityCoins - amount });
                    return true;
                }
                return false;
            },

            spendGems: (amount) => {
                const state = get();
                if (state.gems >= amount) {
                    set({ gems: state.gems - amount });
                    return true;
                }
                return false;
            },

            // Skins
            currentSkin: 'soldier',
            ownedSkins: ['soldier'], // Soldier is unlocked by default

            setSkin: (skin) => {
                const state = get();
                if (state.ownedSkins.includes(skin)) {
                    set({ currentSkin: skin });
                }
            },

            unlockSkin: (skin) => set((state) => ({
                ownedSkins: state.ownedSkins.includes(skin)
                    ? state.ownedSkins
                    : [...state.ownedSkins, skin]
            })),

            // Stats
            totalKills: 0,
            totalDeaths: 0,
            gamesPlayed: 0,
            wins: 0,

            addKill: () => set((state) => ({ totalKills: state.totalKills + 1 })),
            addDeath: () => set((state) => ({ totalDeaths: state.totalDeaths + 1 })),
            addGame: (won) => set((state) => ({
                gamesPlayed: state.gamesPlayed + 1,
                wins: won ? state.wins + 1 : state.wins
            })),
        }),
        {
            name: 'pocket-infinity-player',
        }
    )
);
