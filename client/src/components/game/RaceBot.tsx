import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CyberbotModel } from "./SoldierModel";
import { useRaceStore, RaceBot as RaceBotType } from "@/lib/stores/useRaceStore";

interface RaceBotProps {
    bot: RaceBotType;
}

const FINISH_LINE_Z = 195;
const FALL_THRESHOLD = -5;
const CHECKPOINT_INTERVAL = 40;

export function RaceBot({ bot }: RaceBotProps) {
    const meshRef = useRef<THREE.Group>(null);
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const { updateBot, finishBot } = useRaceStore();
    const lastCheckpointRef = useRef(bot.lastCheckpoint);
    const respawnCooldownRef = useRef(0);

    useFrame((_, delta) => {
        if (!meshRef.current || bot.hasFinished) return;

        // Respawn cooldown
        if (respawnCooldownRef.current > 0) {
            respawnCooldownRef.current -= delta;
            return;
        }

        const position = meshRef.current.position;

        // Apply gravity
        velocityRef.current.y -= 20 * delta;
        position.y += velocityRef.current.y * delta;

        // Ground collision (platform at y = 0.5)
        if (position.y <= 1) {
            position.y = 1;
            velocityRef.current.y = 0;

            // Random jump
            if (Math.random() < 0.02) {
                velocityRef.current.y = 6;
            }
        }

        // Forward movement with speed variation
        const speedVariation = 1 + (Math.random() - 0.5) * 0.4;
        const moveSpeed = bot.baseSpeed * speedVariation * delta;
        position.z += moveSpeed;

        // Slight random lateral movement
        position.x += (Math.random() - 0.5) * 0.5 * delta;
        position.x = Math.max(-9, Math.min(9, position.x)); // Keep on platform

        // Update checkpoint
        if (Math.floor(position.z / CHECKPOINT_INTERVAL) > Math.floor(lastCheckpointRef.current[2] / CHECKPOINT_INTERVAL)) {
            lastCheckpointRef.current = [position.x, position.y, position.z];
        }

        // Fall detection
        if (position.y < FALL_THRESHOLD) {
            position.set(...lastCheckpointRef.current);
            velocityRef.current.set(0, 0, 0);
            respawnCooldownRef.current = 2; // 2 second penalty
        }

        // Finish line detection
        if (position.z >= FINISH_LINE_Z && !bot.hasFinished) {
            finishBot(bot.id);
        }

        // Update store
        updateBot(bot.id, [position.x, position.y, position.z]);
    });

    return (
        <group ref={meshRef} position={bot.position}>
            <CyberbotModel isMoving={!bot.hasFinished} color={bot.color} />
            {/* Bot name tag */}
            <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial color={bot.color} />
            </mesh>
        </group>
    );
}
