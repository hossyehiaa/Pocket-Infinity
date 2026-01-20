import { useRef, useEffect, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface WeaponModelProps {
    type: "blaster" | "shotgun" | "sniper";
    isShooting?: boolean;
}

export function WeaponModel({ type, isShooting = false }: WeaponModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const flashRef = useRef<THREE.PointLight>(null);
    const flashTimer = useRef<number>(0);

    // Using a sci-fi gun model URL - you can replace with any GLTF gun model
    const gunUrl = "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/low-poly-spaceship/model.gltf";

    useEffect(() => {
        if (isShooting && flashRef.current) {
            flashRef.current.intensity = 8;
            flashTimer.current = Date.now();

            const fadeOut = setInterval(() => {
                if (flashRef.current) {
                    const elapsed = Date.now() - flashTimer.current;
                    if (elapsed > 100) {
                        flashRef.current.intensity = 0;
                        clearInterval(fadeOut);
                    } else {
                        flashRef.current.intensity = 8 * (1 - elapsed / 100);
                    }
                }
            }, 10);

            return () => clearInterval(fadeOut);
        }
    }, [isShooting]);

    // Fallback weapon mesh
    const FallbackWeapon = () => {
        const weaponConfig = {
            blaster: { color: "#4ade80", length: 1, width: 0.1 },
            shotgun: { color: "#ef4444", length: 1.2, width: 0.15 },
            sniper: { color: "#3b82f6", length: 1.5, width: 0.08 },
        };

        const config = weaponConfig[type];

        return (
            <group ref={groupRef}>
                {/* Gun barrel */}
                <mesh position={[0.15, 0, 0]}>
                    <boxGeometry args={[config.length, config.width, config.width * 0.8]} />
                    <meshStandardMaterial color={config.color} metalness={0.9} roughness={0.2} />
                </mesh>

                {/* Gun handle */}
                <mesh position={[-0.15, -0.15, 0]} rotation={[0, 0, -0.3]}>
                    <boxGeometry args={[0.15, 0.3, 0.1]} />
                    <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
                </mesh>

                {/* Gun scope (sniper only) */}
                {type === "sniper" && (
                    <mesh position={[0.3, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
                        <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.2} transparent opacity={0.6} />
                    </mesh>
                )}

                {/* Muzzle flash point */}
                <pointLight
                    ref={flashRef}
                    position={[config.length / 2 + 0.3, 0, 0]}
                    color="#ffaa00"
                    intensity={0}
                    distance={5}
                />

                {/* Muzzle glow when shooting */}
                {isShooting && (
                    <mesh position={[config.length / 2 + 0.25, 0, 0]}>
                        <sphereGeometry args={[0.15, 8, 8]} />
                        <meshBasicMaterial color="#ffaa00" />
                    </mesh>
                )}
            </group>
        );
    };

    return <FallbackWeapon />;
}
