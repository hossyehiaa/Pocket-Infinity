import { useRef, useEffect, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";

export interface CyberbotModelProps {
  isMoving?: boolean;
  color?: string;
  name?: string; // Optional name tag support
}

// OFFICIAL Three.js RobotExpressive model - STABLE and TESTED
// This model has verified animations: "Idle", "Walking", "Running"
const BOT_MODEL_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb";

function CyberbotGLTF({ isMoving = false, color }: CyberbotModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(BOT_MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const currentAction = useRef<string | null>(null);

  // Clone scene and apply material colors
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Apply color to the main body
        if (color && child.material) {
          const mat = (child.material as THREE.MeshStandardMaterial).clone();
          const targetColor = new THREE.Color(color);

          // Make it look robotic/metallic
          mat.color.set(targetColor);
          mat.metalness = 0.8;
          mat.roughness = 0.2;
          mat.emissive = targetColor;
          mat.emissiveIntensity = 0.2;

          child.material = mat;
        }
      }
    });
    return clone;
  }, [scene, color]);

  // Handle Animations
  useEffect(() => {
    if (!actions) return;

    // RobotExpressive model has "Running", "Walking", "Idle"
    const runAction = actions["Running"];
    const idleAction = actions["Idle"];

    // Determine which animation to play
    const targetActionName = isMoving ? "Running" : "Idle";

    if (currentAction.current !== targetActionName) {
      const prev = currentAction.current ? actions[currentAction.current] : null;
      const next = actions[targetActionName];

      if (next) {
        prev?.fadeOut(0.2);
        next.reset().fadeIn(0.2).play();
        currentAction.current = targetActionName;
      }
    }
  }, [isMoving, actions]);

  // Just play Idle if nothing else is happening initially
  useEffect(() => {
    if (actions && !currentAction.current && actions["Idle"]) {
      actions["Idle"].play();
      currentAction.current = "Idle";
    }
  }, [actions]);

  return (
    <group ref={group} dispose={null} scale={0.5}>
      <primitive object={clonedScene} />
    </group>
  );
}

function FallbackBot({ color }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color={color || "gray"} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

// Export as CyberbotModel
export function CyberbotModel(props: CyberbotModelProps) {
  return (
    <Suspense fallback={<FallbackBot color={props.color} />}>
      <CyberbotGLTF {...props} />
    </Suspense>
  );
}

// Preload
useGLTF.preload(BOT_MODEL_URL);
