import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
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
    const groupRef = useRef<THREE.Group>(null);
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
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
        if (groupRef.current) {
            groupRef.current.position.set(0, 1, 0);
            velocityRef.current.set(0, 0, 0);
            lastCheckpointRef.current = [0, 1, 0];
            hasFinishedRef.current = false;
        }
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current || playerQualified || playerEliminated) return;

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

        // Movement
        const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
        groupRef.current.position.x += moveDir.x * moveSpeed * delta;
        groupRef.current.position.z += moveDir.z * moveSpeed * delta;

        // Keep on platform
        groupRef.current.position.x = Math.max(-9, Math.min(9, groupRef.current.position.x));

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

        // Jump
        if (shouldJump && isGroundedRef.current) {
            velocityRef.current.y = jumpForce;
            isGroundedRef.current = false;
            playJump();
        }

        // Gravity
        velocityRef.current.y -= 20 * delta;
        groupRef.current.position.y += velocityRef.current.y * delta;

        // Ground collision
        if (groupRef.current.position.y <= 1) {
            groupRef.current.position.y = 1;
            velocityRef.current.y = 0;
            isGroundedRef.current = true;
        }

        // Update checkpoint
        const currentZ = groupRef.current.position.z;
        if (Math.floor(currentZ / CHECKPOINT_INTERVAL) > Math.floor(lastCheckpointRef.current[2] / CHECKPOINT_INTERVAL)) {
            lastCheckpointRef.current = [
                groupRef.current.position.x,
                groupRef.current.position.y,
                groupRef.current.position.z
            ];
        }

        // Fall detection - respawn at checkpoint
        if (groupRef.current.position.y < FALL_THRESHOLD) {
            groupRef.current.position.set(...lastCheckpointRef.current);
            velocityRef.current.set(0, 0, 0);
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
        <group ref={groupRef} position={[0, 1, 0]}>
            <CyberbotModel isMoving={isMoving} color="#f59e0b" />
        </group>
    );
}
