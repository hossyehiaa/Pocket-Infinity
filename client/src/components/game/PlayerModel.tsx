import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, AnimationAction, SkinnedMesh, MeshStandardMaterial } from "three";
import { RapierRigidBody } from "@react-three/rapier";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

interface PlayerModelProps {
    rigidBodyRef?: React.RefObject<RapierRigidBody>;
    [key: string]: any;
}

// Fallback capsule when model fails
function FallbackCapsule() {
    return (
        <group>
            {/* Body capsule */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
                <meshStandardMaterial color="#4a90d9" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#4a90d9" metalness={0.6} roughness={0.3} />
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
            {/* Light for visibility */}
            <pointLight position={[0, 2, 1]} intensity={1.5} distance={8} />
        </group>
    );
}

function RobotModel({ rigidBodyRef, ...props }: PlayerModelProps) {
    const group = useRef<Group>(null);
    const { scene, animations } = useGLTF('/models/player.glb');

    // Clone scene properly using SkeletonUtils to preserve skeleton/animations
    const clonedScene = useMemo(() => {
        const clone = SkeletonUtils.clone(scene);
        clone.traverse((child) => {
            if (child instanceof SkinnedMesh) {
                child.frustumCulled = false;
                // Ensure material is visible
                if (child.material) {
                    const mat = child.material as MeshStandardMaterial;
                    mat.needsUpdate = true;
                }
            }
        });
        return clone;
    }, [scene]);

    const { actions } = useAnimations(animations, group);
    const [currentAction, setCurrentAction] = useState<string>('idle');
    const prevActionRef = useRef<AnimationAction | null>(null);

    // Debug: Log available animations
    useEffect(() => {
        console.log('=== PLAYERMODEL DEBUG ===');
        console.log('Available actions:', Object.keys(actions));
        console.log('Animations count:', animations.length);
        console.log('Scene children:', scene.children.length);

        // Log each animation's details
        animations.forEach((clip, i) => {
            console.log(`Animation ${i}: "${clip.name}" duration=${clip.duration}s`);
        });
    }, [actions, animations, scene]);

    // Get action by name with fallback variations
    const getAction = (type: string): AnimationAction | null => {
        const variations = [
            type,
            type.charAt(0).toUpperCase() + type.slice(1),
            type.toUpperCase(),
            `Armature|${type}`,
            `mixamo.com|${type}`,
            `Armature|${type.charAt(0).toUpperCase() + type.slice(1)}`
        ];

        for (const name of variations) {
            if (actions[name]) return actions[name];
        }

        // Try partial match
        const partialMatch = Object.entries(actions).find(
            ([name]) => name.toLowerCase().includes(type.toLowerCase())
        );
        return partialMatch ? partialMatch[1] : null;
    };

    // Play initial idle animation
    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const idleAction = getAction('idle') || Object.values(actions)[0];

            if (idleAction) {
                idleAction.reset().fadeIn(0.2).play();
                prevActionRef.current = idleAction;
                console.log('✅ Playing initial animation:', idleAction.getClip()?.name);
            } else {
                console.error('❌ No idle animation found!');
            }
        }
    }, [actions]);

    // Handle animation switching based on velocity
    useFrame(() => {
        if (!rigidBodyRef?.current) return;

        const velocity = rigidBodyRef.current.linvel();
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

        // Determine target animation based on speed
        let targetAction = 'idle';
        if (speed > 5) {
            targetAction = 'run';
        } else if (speed > 0.5) {
            targetAction = 'walk';
        }

        // Switch animation if needed
        if (targetAction !== currentAction) {
            const newAction = getAction(targetAction);

            if (newAction && prevActionRef.current && newAction !== prevActionRef.current) {
                prevActionRef.current.fadeOut(0.2);
                newAction.reset().fadeIn(0.2).play();
                prevActionRef.current = newAction;
                setCurrentAction(targetAction);
            } else if (newAction && !prevActionRef.current) {
                newAction.reset().fadeIn(0.2).play();
                prevActionRef.current = newAction;
                setCurrentAction(targetAction);
            }
        }
    });

    return (
        <group ref={group} {...props}>
            <primitive object={clonedScene} scale={1.5} position={[0, -1, 0]} />
            {/* Light attached to player for visibility */}
            <pointLight position={[0, 2, 1]} intensity={1.5} distance={8} />
        </group>
    );
}

export function PlayerModel({ rigidBodyRef, ...props }: PlayerModelProps) {
    return (
        <Suspense fallback={<FallbackCapsule />}>
            <RobotModel rigidBodyRef={rigidBodyRef} {...props} />
        </Suspense>
    );
}

// Preload the model
useGLTF.preload('/models/player.glb');
