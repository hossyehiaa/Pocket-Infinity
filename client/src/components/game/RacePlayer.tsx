import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody, type RapierRigidBody, CapsuleCollider } from "@react-three/rapier";
import * as THREE from "three";
import { CyberbotModel } from "./SoldierModel";
import { useControls } from "@/lib/stores/useControls";
import { useGameState } from "@/lib/stores/useGameState";
import { useRaceStore } from "@/lib/stores/useRaceStore";
import { playJump } from "@/lib/sounds";

enum Controls {
    forward = "forward",
    back = "back",
    left = "left",
    right = "right",
    jump = "jump",
}

const FINISH_LINE_Z = 195;
const FALL_THRESHOLD = -5;
const CHECKPOINT_INTERVAL = 40;

export function RacePlayer() {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const groupRef = useRef<THREE.Group>(null);
    const isGroundedRef = useRef(true);
    const [isMoving, setIsMoving] = useState(false);
    const [, getKeyboard] = useKeyboardControls<Controls>();
    const mobileControls = useControls();
    const { isMobile } = useGameState();
    const { qualifyPlayer, playerQualified, playerEliminated } = useRaceStore();
    const lastCheckpointRef = useRef<[number, number, number]>([0, 1, 0]);
    const hasFinishedRef = useRef(false);
    const respawnCooldownRef = useRef(0);

    // Reset on mount
    useEffect(() => {
        if (rigidBodyRef.current) {
            rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            lastCheckpointRef.current = [0, 1, 0];
            hasFinishedRef.current = false;
        }
    }, []);

    useFrame((state, delta) => {
        if (!rigidBodyRef.current || !groupRef.current || playerQualified || playerEliminated) return;

        // Respawn cooldown
        if (respawnCooldownRef.current > 0) {
            respawnCooldownRef.current -= delta;
            return;
        }

        const keyboard = getKeyboard();
        const moveSpeed = 8;
        const jumpForce = 7;

        let moveX = 0;
        let moveZ = 0;
        let shouldJump = false;

        if (isMobile) {
            moveX = mobileControls.moveX;
            moveZ = mobileControls.moveZ;
            shouldJump = mobileControls.jump;
        } else {
            if (keyboard.forward) moveZ = 1;
            if (keyboard.back) moveZ = -1;
            if (keyboard.left) moveX = -1;
            if (keyboard.right) moveX = 1;
            shouldJump = keyboard.jump;
        }

        // Movement with physics
        const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
        const currentVel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({
            x: moveDir.x * moveSpeed,
            y: currentVel.y,
            z: moveDir.z * moveSpeed
        }, true);

        // Update position for rendering
        const position = rigidBodyRef.current.translation();
        groupRef.current.position.set(position.x, position.y, position.z);

        // Keep on platform
        if (position.x < -9 || position.x > 9) {
            const clampedX = Math.max(-9, Math.min(9, position.x));
            rigidBodyRef.current.setTranslation({ x: clampedX, y: position.y, z: position.z }, true);
        }

        // Update moving state
        const moving = moveDir.length() > 0.1;
        if (moving !== isMoving) {
            setIsMoving(moving);
        }

        // Rotate to face movement direction
        if (moving) {
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y,
                targetRotation,
                0.1
            );
        }

        // Jump with impulse
        if (shouldJump && isGroundedRef.current) {
            rigidBodyRef.current.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
            isGroundedRef.current = false;
            playJump();
        }

        // Ground detection
        if (currentVel.y <= 0.1 && currentVel.y >= -0.1) {
            isGroundedRef.current = true;
        } else {
            isGroundedRef.current = false;
        }

        // Update checkpoint
        const currentZ = position.z;
        if (Math.floor(currentZ / CHECKPOINT_INTERVAL) > Math.floor(lastCheckpointRef.current[2] / CHECKPOINT_INTERVAL)) {
            lastCheckpointRef.current = [
                position.x,
                position.y,
                position.z
            ];
        }

        // Fall detection - respawn at checkpoint
        if (position.y < FALL_THRESHOLD) {
            rigidBodyRef.current.setTranslation({ x: lastCheckpointRef.current[0], y: lastCheckpointRef.current[1], z: lastCheckpointRef.current[2] }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            respawnCooldownRef.current = 1; // 1 second penalty
        }

        // Finish line detection
        if (currentZ >= FINISH_LINE_Z && !hasFinishedRef.current) {
            hasFinishedRef.current = true;
            qualifyPlayer('player', true);
        }

        // Camera follow
        const cameraOffset = new THREE.Vector3(0, 5, -10);
        state.camera.position.lerp(
            new THREE.Vector3(
                groupRef.current.position.x + cameraOffset.x,
                groupRef.current.position.y + cameraOffset.y,
                groupRef.current.position.z + cameraOffset.z
            ),
            0.1
        );

        const lookTarget = groupRef.current.position.clone();
        lookTarget.y += 1;
        lookTarget.z += 5; // Look slightly ahead
        state.camera.lookAt(lookTarget);
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="dynamic"
            enabledRotations={[false, true, false]}
            mass={1}
            linearDamping={0.5}
        >
            <CapsuleCollider args={[0.5, 0.3]} />
            <group ref={groupRef}>
                <CyberbotModel isMoving={isMoving} color="#f59e0b" />
            </group>
        </RigidBody>
    );
}
