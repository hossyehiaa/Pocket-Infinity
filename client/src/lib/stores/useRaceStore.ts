import { create } from 'zustand';

export interface RaceBot {
    id: string;
    position: [number, number, number];
    baseSpeed: number;
    currentSpeed: number;
    hasFinished: boolean;
    color: string;
    lastCheckpoint: [number, number, number];
}

interface RaceStore {
    // Race state
    isRaceActive: boolean;
    raceStartTime: number;
    qualifiedPlayers: string[];
    playerQualified: boolean;
    playerEliminated: boolean;
    playerFinishPosition: number;

    // Bot management
    bots: RaceBot[];

    // Actions
    startRace: () => void;
    qualifyPlayer: (playerId: string, isRealPlayer: boolean) => void;
    resetRace: () => void;
    updateBot: (id: string, position: [number, number, number]) => void;
    finishBot: (id: string) => void;
    spawnBots: () => void;
}

const BOT_COLORS = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

export const useRaceStore = create<RaceStore>((set, get) => ({
    isRaceActive: false,
    raceStartTime: 0,
    qualifiedPlayers: [],
    playerQualified: false,
    playerEliminated: false,
    playerFinishPosition: 0,
    bots: [],

    startRace: () => {
        set({
            isRaceActive: true,
            raceStartTime: Date.now(),
            qualifiedPlayers: [],
            playerQualified: false,
            playerEliminated: false,
            playerFinishPosition: 0,
        });
        get().spawnBots();
    },

    qualifyPlayer: (playerId: string, isRealPlayer: boolean) => {
        const state = get();

        // Don't qualify if already qualified
        if (state.qualifiedPlayers.includes(playerId)) return;

        const currentQualified = state.qualifiedPlayers.length;
        const position = currentQualified + 1;

        if (currentQualified < 5) {
            // Player qualifies
            set({
                qualifiedPlayers: [...state.qualifiedPlayers, playerId]
            });

            if (isRealPlayer) {
                set({
                    playerQualified: true,
                    playerFinishPosition: position
                });
            }
        } else {
            // Too late - eliminated
            if (isRealPlayer) {
                set({
                    playerEliminated: true,
                    playerFinishPosition: position
                });
            }
        }
    },

    resetRace: () => {
        set({
            isRaceActive: false,
            raceStartTime: 0,
            qualifiedPlayers: [],
            playerQualified: false,
            playerEliminated: false,
            playerFinishPosition: 0,
            bots: [],
        });
    },

    updateBot: (id: string, position: [number, number, number]) => {
        set((state) => ({
            bots: state.bots.map(bot =>
                bot.id === id ? { ...bot, position } : bot
            )
        }));
    },

    finishBot: (id: string) => {
        const state = get();
        state.qualifyPlayer(id, false);

        set((state) => ({
            bots: state.bots.map(bot =>
                bot.id === id ? { ...bot, hasFinished: true } : bot
            )
        }));
    },

    spawnBots: () => {
        const bots: RaceBot[] = [];
        for (let i = 0; i < 9; i++) {
            const xPos = (i % 3 - 1) * 3; // Spread across width
            const zPos = Math.floor(i / 3) * -2; // Rows

            bots.push({
                id: `bot-${i}`,
                position: [xPos, 1, zPos],
                baseSpeed: 3 + Math.random() * 4, // 3-7 units/sec
                currentSpeed: 1,
                hasFinished: false,
                color: BOT_COLORS[i],
                lastCheckpoint: [xPos, 1, zPos],
            });
        }
        set({ bots });
    },
}));
