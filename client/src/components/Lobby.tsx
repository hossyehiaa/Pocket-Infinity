import { useState, useEffect } from "react";
import { insertCoin } from "playroomkit";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stars } from "@react-three/drei";
import { usePlayerStore, SkinType } from "@/lib/stores/usePlayerStore";
import { useGameState } from "@/lib/stores/useGameState";

interface LobbyProps {
    onStart: () => void;
}

const SKINS: { id: SkinType; name: string; color: string; locked: boolean }[] = [
    { id: 'soldier', name: 'Desert Camo', color: '#f59e0b', locked: false },
    { id: 'cyberbot', name: 'Cyber Blue', color: '#3b82f6', locked: false },
    { id: 'alien', name: 'Alien Green', color: '#22c55e', locked: false },
];

function CapsulePreview({ color }: { color: string }) {
    return (
        <group>
            {/* Body capsule */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.1, 1.25, 0.2]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[-0.1, 1.25, 0.2]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
}

export function Lobby({ onStart }: LobbyProps) {
    const { currentSkin, setSkin } = usePlayerStore();
    const { setScene } = useGameState();
    const [launched, setLaunched] = useState(false);

    // Auto-launch Playroom lobby
    useEffect(() => {
        const startPlayroom = async () => {
            try {
                await insertCoin({
                    skipLobby: false,
                    gameId: "pocket-infinity-v2",
                    discord: true,
                });
                setLaunched(true);
            } catch (e) {
                console.error("Failed to start Playroom:", e);
            }
        };
        startPlayroom();
    }, []);

    const handleStart = () => {
        setScene("bridge");
        onStart();
    };

    const selectedSkin = SKINS.find(s => s.id === currentSkin) || SKINS[0];

    if (!launched) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
                <div className="text-2xl animate-pulse">Initializing Neural Link...</div>
            </div>
        );
    }

    // Once Playroom is ready, we show a "Ready" screen or just pass through
    // But typically insertCoin handles the lobby UI. 
    // If we want a CUSTOM lobby *after* insertCoin, we can do it here.
    // For now, let's provide a simple "Enter World" button after they join.

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black overflow-hidden flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg p-8 bg-black/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl z-10 text-center">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
                    SYSTEM READY
                </h1>

                <div className="h-64 mb-6 relative bg-white/5 rounded-xl overflow-hidden">
                    <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
                        <ambientLight intensity={1} />
                        <pointLight position={[5, 5, 5]} intensity={2} />
                        <Stars radius={50} count={1000} factor={3} />
                        <OrbitControls autoRotate enableZoom={false} />
                        <group position={[0, -1, 0]}>
                            <CapsulePreview color={selectedSkin.color} />
                        </group>
                    </Canvas>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        {SKINS.map(skin => (
                            <button
                                key={skin.id}
                                onClick={() => setSkin(skin.id)}
                                className={`w-8 h-8 rounded-full border-2 ${currentSkin === skin.id ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                style={{ backgroundColor: skin.color }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-xl text-white hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
                >
                    ENTER SIMULATION
                </button>
            </div>

            <div className="absolute inset-0 z-0">
                <Canvas>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                </Canvas>
            </div>
        </div>
    );
}
