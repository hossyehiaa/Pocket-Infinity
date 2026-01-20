import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { usePlayerStore, SkinType } from "@/lib/stores/usePlayerStore";
import { useGameState } from "@/lib/stores/useGameState";
import { useRaceStore } from "@/lib/stores/useRaceStore";
import { SoldierModel } from "./game/SoldierModel";
import { SciFiArmor } from "./game/Humanoid";

interface LobbyProps {
    onStart: () => void;
}

const SKINS: { id: SkinType; name: string; color: string; locked: boolean; price?: number }[] = [
    { id: 'soldier', name: 'Soldier', color: '#f59e0b', locked: false },
    { id: 'cyberbot', name: 'Cyber-Bot', color: '#3b82f6', locked: false },
    { id: 'alien', name: 'Alien', color: '#22c55e', locked: false },
];

function SkinPreview({ skin, color }: { skin: SkinType; color: string }) {
    if (skin === 'soldier') {
        return <SoldierModel isMoving={false} color={color} />;
    }

    if (skin === 'cyberbot') {
        return <SciFiArmor color={color} accentColor="#00ffff" isHighlighted position={[0, -0.5, 0]} />;
    }

    // Alien skin
    return <SoldierModel isMoving={false} color={color} />;
}

export function Lobby({ onStart }: LobbyProps) {
    const { infinityCoins, gems, currentSkin, setSkin } = usePlayerStore();
    const { setScene } = useGameState();
    const { startRace } = useRaceStore();
    const [selectedIndex, setSelectedIndex] = useState(() =>
        SKINS.findIndex(s => s.id === currentSkin)
    );

    const selectedSkin = SKINS[selectedIndex];

    const nextSkin = () => {
        const newIndex = (selectedIndex + 1) % SKINS.length;
        setSelectedIndex(newIndex);
        setSkin(SKINS[newIndex].id);
    };

    const prevSkin = () => {
        const newIndex = (selectedIndex - 1 + SKINS.length) % SKINS.length;
        setSelectedIndex(newIndex);
        setSkin(SKINS[newIndex].id);
    };

    const handlePlayClick = () => {
        setScene("race");
        startRace();
        onStart();
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Currency Display - Top Right */}
            <div className="absolute top-6 right-6 flex gap-4 z-20">
                {/* Infinity Coins */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/90 to-yellow-500/90 px-5 py-3 rounded-full shadow-lg border-2 border-yellow-400/50 backdrop-blur-sm">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                            <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" />
                            <path d="M12 6l-6 3v6c0 3.3 2.3 6.4 6 7.2 3.7-.8 6-3.9 6-7.2V9l-6-3z" fill="#fbbf24" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-lg">{infinityCoins.toLocaleString()}</span>
                </div>

                {/* Gems */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/90 to-blue-600/90 px-5 py-3 rounded-full shadow-lg border-2 border-purple-400/50 backdrop-blur-sm">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                            <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" />
                            <path d="M12 7l-5 3 5 3 5-3-5-3z" fill="#a855f7" opacity="0.8" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-lg">{gems.toLocaleString()}</span>
                </div>
            </div>

            {/* Logo - Top Center */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-2xl animate-pulse">
                    POCKET INFINITY
                </h1>
                <p className="text-center text-gray-400 text-sm mt-2">Battle Royale in Space</p>
            </div>

            {/* Main Content - 3D Model Preview */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-4xl px-4">
                    {/* Skin Name Display */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-white mb-2">{selectedSkin.name}</h2>
                        <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                            <span className="text-cyan-400 font-semibold">{selectedIndex + 1} / {SKINS.length}</span>
                        </div>
                    </div>

                    {/* 3D Model Container */}
                    <div className="relative h-96 bg-gradient-to-b from-transparent via-white/5 to-transparent rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
                            <Suspense fallback={null}>
                                <ambientLight intensity={0.5} />
                                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                                <SkinPreview skin={selectedSkin.id} color={selectedSkin.color} />

                                <Environment preset="sunset" />
                                <OrbitControls
                                    enableZoom={false}
                                    enablePan={false}
                                    minPolarAngle={Math.PI / 3}
                                    maxPolarAngle={Math.PI / 2}
                                    autoRotate
                                    autoRotateSpeed={2}
                                />
                            </Suspense>
                        </Canvas>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSkin}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 border-2 border-white/20 shadow-lg z-10"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextSkin}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 border-2 border-white/20 shadow-lg z-10"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Play Button - Bottom */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                <button
                    onClick={handlePlayClick}
                    className="group relative px-16 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-bold text-3xl text-white shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3">
                        <span>PLAY NOW</span>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>

                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-cyan-400 to-purple-500 opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
                </button>

                {/* Quick Stats */}
                <div className="mt-6 flex gap-6 justify-center text-center">
                    <div className="text-gray-400">
                        <div className="text-2xl font-bold text-white">
                            {usePlayerStore.getState().gamesPlayed}
                        </div>
                        <div className="text-xs uppercase">Games</div>
                    </div>
                    <div className="text-gray-400">
                        <div className="text-2xl font-bold text-green-400">
                            {usePlayerStore.getState().wins}
                        </div>
                        <div className="text-xs uppercase">Wins</div>
                    </div>
                    <div className="text-gray-400">
                        <div className="text-2xl font-bold text-cyan-400">
                            {usePlayerStore.getState().totalKills}
                        </div>
                        <div className="text-xs uppercase">Kills</div>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs">
                <div>Mobile: Touch controls enabled</div>
                <div>Desktop: WASD + Mouse</div>
            </div>
        </div >
    );
}
