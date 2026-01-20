import { useRef, useEffect, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface SoldierModelProps {
  isMoving?: boolean;
  color?: string;
}

const SOLDIER_MODEL_URL = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934e6.glb";

function FallbackHumanoid({ color = "#f59e0b", isMoving = false }: SoldierModelProps) {
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  
  useFrame((_, delta) => {
    time.current += delta * 10;
    
    if (isMoving) {
      const armSwing = Math.sin(time.current) * 0.5;
      const legSwing = Math.sin(time.current) * 0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = legSwing;
    } else {
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
    }
  });
  
  return (
    <group>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#f5d0c5" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.2]} />
        <meshStandardMaterial color={color || "#3b82f6"} />
      </mesh>
      <group position={[-0.25, 0.55, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.35, 0.1]} />
          <meshStandardMaterial color={color || "#3b82f6"} />
        </mesh>
      </group>
      <group position={[0.25, 0.55, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.35, 0.1]} />
          <meshStandardMaterial color={color || "#3b82f6"} />
        </mesh>
      </group>
      <group position={[-0.08, 0.15, 0]}>
        <mesh ref={leftLegRef} position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      <group position={[0.08, 0.15, 0]}>
        <mesh ref={rightLegRef} position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
    </group>
  );
}

function SoldierGLTF({ isMoving = false, color }: SoldierModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(SOLDIER_MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const currentAction = useRef<string>("Idle");
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (color && child.material) {
          const mat = (child.material as THREE.MeshStandardMaterial).clone();
          mat.color = new THREE.Color(color);
          child.material = mat;
        }
      }
    });
    return clone;
  }, [scene, color]);
  
  useEffect(() => {
    if (!actions) return;
    const idleAction = actions["Idle"];
    if (idleAction) {
      idleAction.play();
      currentAction.current = "Idle";
    }
  }, [actions]);
  
  useEffect(() => {
    if (!actions) return;
    
    const targetAction = isMoving ? "Run" : "Idle";
    if (currentAction.current === targetAction) return;
    
    const prevAction = actions[currentAction.current];
    const nextAction = actions[targetAction] || actions["Walk"];
    
    if (nextAction) {
      prevAction?.fadeOut(0.2);
      nextAction.reset().fadeIn(0.2).play();
      currentAction.current = targetAction;
    }
  }, [isMoving, actions]);
  
  return (
    <group ref={group} scale={[0.5, 0.5, 0.5]} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function SoldierModel({ isMoving = false, color }: SoldierModelProps) {
  return (
    <Suspense fallback={<FallbackHumanoid isMoving={isMoving} color={color} />}>
      <FallbackHumanoid isMoving={isMoving} color={color} />
    </Suspense>
  );
}

export function DroneModel({ isMoving = false }: { isMoving?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(Math.random() * Math.PI * 2);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta * 3;
    groupRef.current.position.y = Math.sin(time.current) * 0.15;
    groupRef.current.rotation.y += delta * 0.5;
  });
  
  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial 
          color="#1f2937" 
          metalness={0.9} 
          roughness={0.2}
          emissive="#ef4444"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444" 
          emissiveIntensity={0.8} 
        />
      </mesh>
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 16]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff" 
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight color="#ef4444" intensity={0.5} distance={4} />
    </group>
  );
}
