import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useRaceStore } from "@/lib/stores/useRaceStore";
import { RaceBot } from "./RaceBot";
import { RacePlayer } from "./RacePlayer";

// Rotating hammer obstacle
function RotatingHammer({ position }: { position: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 1.5;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Center pole */}
            <mesh>
                <cylinderGeometry args={[0.3, 0.3, 6, 8]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Hammer arms */}
            <mesh position={[3, 0, 0]} castShadow>
                <boxGeometry args={[6, 1, 1]} />
                <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[-3, 0, 0]} castShadow>
                <boxGeometry args={[6, 1, 1]} />
                <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Hammer heads */}
            <mesh position={[6, 0, 0]} castShadow>
                <boxGeometry args={[1.5, 2, 2]} />
                <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <mesh position={[-6, 0, 0]} castShadow>
                <boxGeometry args={[1.5, 2, 2]} />
                <meshStandardMaterial color="#7f1d1d" />
            </mesh>
        </group>
    );
}

// Static wall obstacle
function WallObstacle({ position, width }: { position: [number, number, number]; width: number }) {
    return (
        <mesh position={position} castShadow receiveShadow>
            <boxGeometry args={[width, 3, 1]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
    );
}

// Race platform
function RacePlatform() {
    const PLATFORM_LENGTH = 200;
    const PLATFORM_WIDTH = 20;

    return (
        <group>
            {/* Main platform */}
            <mesh position={[0, 0, PLATFORM_LENGTH / 2]} receiveShadow>
                <boxGeometry args={[PLATFORM_WIDTH, 1, PLATFORM_LENGTH]} />
                <meshStandardMaterial color="#4a5568" roughness={0.7} />
            </mesh>

            {/* Start zone - Green */}
            <mesh position={[0, 0.51, 5]}>
                <boxGeometry args={[PLATFORM_WIDTH, 0.1, 10]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Finish zone - Green with glow */}
            <mesh position={[0, 0.51, 195]}>
                <boxGeometry args={[PLATFORM_WIDTH, 0.1, 10]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={0.8}
                />
            </mesh>

            {/* Finish line marker */}
            <group position={[0, 3, 195]}>
                <mesh position={[-7, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 6, 8]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[7, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 6, 8]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[14, 0.5, 0.2]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
                </mesh>
            </group>

            {/* Platform edges */}
            <mesh position={[-10.5, 0.5, PLATFORM_LENGTH / 2]} castShadow>
                <boxGeometry args={[1, 2, PLATFORM_LENGTH]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[10.5, 0.5, PLATFORM_LENGTH / 2]} castShadow>
                <boxGeometry args={[1, 2, PLATFORM_LENGTH]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
        </group>
    );
}

// Obstacles
function RaceObstacles() {
    const obstacles = useMemo(() => {
        const obs: Array<{ type: 'wall' | 'hammer'; position: [number, number, number]; width?: number }> = [];

        // Generate obstacles from z=20 to z=180
        for (let z = 25; z < 180; z += Math.random() * 25 + 15) {
            const type = Math.random() > 0.65 ? 'hammer' : 'wall';
            const xPos = (Math.random() - 0.5) * 8; // Random x position

            if (type === 'hammer') {
                obs.push({
                    type: 'hammer',
                    position: [xPos, 3, z]
                });
            } else {
                const width = Math.random() * 6 + 5; // 5-11 units wide
                obs.push({
                    type: 'wall',
                    position: [xPos, 2, z],
                    width
                });
            }
        }

        return obs;
    }, []);

    return (
        <group>
            {obstacles.map((obs, i) => (
                obs.type === 'hammer' ? (
                    <RotatingHammer key={`hammer-${i}`} position={obs.position} />
                ) : (
                    <WallObstacle key={`wall-${i}`} position={obs.position} width={obs.width!} />
                )
            ))}
        </group>
    );
}

export function RaceLevel() {
    const { bots } = useRaceStore();

    return (
        <group>
            {/* Sky and environment */}
            <Sky
                distance={450000}
                sunPosition={[100, 50, 100]}
                inclination={0.6}
                azimuth={0.25}
            />
            <Environment preset="sunset" />

            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[50, 50, 50]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={300}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />

            {/* Race course */}
            <RacePlatform />
            <RaceObstacles />

            {/* Player */}
            <RacePlayer />

            {/* Bots */}
            {bots.map((bot) => (
                <RaceBot key={bot.id} bot={bot} />
            ))}
        </group>
    );
}
