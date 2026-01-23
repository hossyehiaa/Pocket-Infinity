import { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { RapierRigidBody } from "@react-three/rapier";

interface PlayerModelProps {
    rigidBodyRef?: React.RefObject<RapierRigidBody>;
    [key: string]: any;
}

export function PlayerModel({ rigidBodyRef, ...props }: PlayerModelProps) {
    const group = useRef<Group>(null);
    const { scene, animations } = useGLTF('/models/player.glb');
    const { actions } = useAnimations(animations, group);
    const [currentAction, setCurrentAction] = useState<string>('Idle');

    // Debug: Log available animations
    useEffect(() => {
        console.log('=== PLAYERMODEL DEBUG ===');
        console.log('Available actions:', actions);
        console.log('Animation names:', Object.keys(actions));
        console.log('Number of animations:', Object.keys(actions).length);

        // Log each animation's details
        Object.entries(actions).forEach(([name, action]) => {
            console.log(`Animation "${name}":`, action);
        });
    }, [actions]);

    // Play initial idle animation
    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            // Try multiple name variations
            const idleAction = actions['Idle'] || actions['idle'] || actions['TPose'] || actions['T-Pose'] || Object.values(actions)[0];
            if (idleAction) {
                idleAction.reset().fadeIn(0.2).play();
                console.log('✅ Playing initial animation:', idleAction);
                console.log('Animation clip name:', idleAction.getClip()?.name);
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

        let targetAction = 'Idle';
        if (speed > 0.5) {
            targetAction = 'Run';
        }

        // Switch animation if needed
        if (targetAction !== currentAction) {
            const oldAction = actions[currentAction] || actions[currentAction.toLowerCase()];
            const newAction = actions[targetAction] || actions[targetAction.toLowerCase()];

            if (oldAction && newAction) {
                oldAction.fadeOut(0.2);
                newAction.reset().fadeIn(0.2).play();
                setCurrentAction(targetAction);
                console.log(`Switching from ${currentAction} to ${targetAction}`);
            }
        }
    });

    return (
        <group ref={group} {...props}>
            <primitive object={scene.clone()} scale={1.2} position={[0, -0.9, 0]} />
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/player.glb');
