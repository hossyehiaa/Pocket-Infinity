import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PlayerState } from "playroomkit";
import { SoldierModel } from "./SoldierModel";

interface NetworkPlayerProps {
  player: PlayerState;
  color?: string;
}

function SpeakingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 8) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 2.2, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.25, 0, 0]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.25, 0, 0]}>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.4, 0, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function NetworkPlayer({ player, color = "#e74c3c" }: NetworkPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 1, 5));
  const previousPosition = useRef(new THREE.Vector3(0, 1, 5));
  const targetRotation = useRef(0);
  const hasInitialized = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useFrame(() => {
    if (!groupRef.current) return;

    const pos = player.getState("pos");
    const rot = player.getState("rot");
    const micMuted = player.getState("micMuted");

    setIsSpeaking(!micMuted);

    if (pos) {
      targetPosition.current.set(pos.x, pos.y, pos.z);
      if (!hasInitialized.current) {
        groupRef.current.position.copy(targetPosition.current);
        previousPosition.current.copy(targetPosition.current);
        hasInitialized.current = true;
      } else {
        // Detect movement based on position change
        const movementDistance = targetPosition.current.distanceTo(previousPosition.current);
        setIsMoving(movementDistance > 0.01);

        groupRef.current.position.lerp(targetPosition.current, 0.15);
        previousPosition.current.copy(groupRef.current.position);
      }
    }

    if (rot !== undefined) {
      targetRotation.current = rot;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current,
        0.15
      );
    }
  });

  const playerColor = player.getState("color") || color;

  return (
    <group ref={groupRef} position={[0, 1, 5]}>
      <SoldierModel isMoving={isMoving} color={playerColor} />
      {isSpeaking && <SpeakingIndicator />}
    </group>
  );
}
