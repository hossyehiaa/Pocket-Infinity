import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SciFiArmorProps {
  color: string;
  accentColor?: string;
  position?: [number, number, number];
  isHighlighted?: boolean;
  isPlayer?: boolean;
}

export function SciFiArmor({ 
  color, 
  accentColor = "#1a1a2e",
  position = [0, 0, 0], 
  isHighlighted = false,
  isPlayer = false 
}: SciFiArmorProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current && !isPlayer) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const emissiveColor = isHighlighted ? color : "#000000";
  const emissiveIntensity = isHighlighted ? 0.5 : 0;
  const visorColor = isPlayer ? "#60a5fa" : "#22d3ee";

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.7} 
          roughness={0.3}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          flatShading
        />
      </mesh>

      <mesh position={[0, 1.72, 0.18]}>
        <boxGeometry args={[0.22, 0.08, 0.08]} />
        <meshStandardMaterial 
          color={visorColor} 
          metalness={0.9} 
          roughness={0.1}
          emissive={visorColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.35]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.6} 
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          flatShading
        />
      </mesh>

      <mesh position={[0, 1.2, 0.12]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.15]} />
        <meshStandardMaterial 
          color={accentColor} 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 1.05, 0.15]}>
        <circleGeometry args={[0.08, 6]} />
        <meshStandardMaterial 
          color={visorColor}
          emissive={visorColor}
          emissiveIntensity={0.6}
        />
      </mesh>

      <mesh position={[-0.42, 1.25, 0]} castShadow>
        <boxGeometry args={[0.2, 0.25, 0.3]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.7} 
          roughness={0.3}
          flatShading
        />
      </mesh>
      <mesh position={[0.42, 1.25, 0]} castShadow>
        <boxGeometry args={[0.2, 0.25, 0.3]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.7} 
          roughness={0.3}
          flatShading
        />
      </mesh>

      <mesh position={[-0.42, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.15, 6]} />
        <meshStandardMaterial 
          color={accentColor} 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.42, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.15, 6]} />
        <meshStandardMaterial 
          color={accentColor} 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>

      <mesh position={[-0.38, 0.85, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[0.12, 0.55, 0.12]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.5}
          flatShading
        />
      </mesh>
      <mesh position={[0.38, 0.85, 0]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.12, 0.55, 0.12]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.5}
          flatShading
        />
      </mesh>

      <mesh position={[-0.14, 0.32, 0]} castShadow>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.5}
          flatShading
        />
      </mesh>
      <mesh position={[0.14, 0.32, 0]} castShadow>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.5}
          flatShading
        />
      </mesh>

      <mesh position={[-0.14, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.2, 0.08]} />
        <meshStandardMaterial 
          color={accentColor} 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.14, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.2, 0.08]} />
        <meshStandardMaterial 
          color={accentColor} 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>

      {isHighlighted && (
        <pointLight color={color} intensity={0.8} distance={3} />
      )}
    </group>
  );
}

export function Humanoid({ color, position = [0, 0, 0], isHighlighted = false }: {
  color: string;
  position?: [number, number, number];
  isHighlighted?: boolean;
}) {
  return <SciFiArmor color={color} position={position} isHighlighted={isHighlighted} />;
}

export function PlayerHumanoid({ color = "#f59e0b", isMoving = false }: { color?: string; isMoving?: boolean }) {
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
      <mesh position={[0, 0.65, 0]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
          flatShading
        />
      </mesh>

      <mesh position={[0, 0.67, 0.14]}>
        <boxGeometry args={[0.18, 0.06, 0.06]} />
        <meshStandardMaterial 
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.45, 0.6, 0.28]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.7} 
          roughness={0.3}
          flatShading
        />
      </mesh>

      <mesh position={[0, 0.28, 0.1]} castShadow>
        <boxGeometry args={[0.32, 0.25, 0.12]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>

      <mesh position={[0, 0.15, 0.12]}>
        <circleGeometry args={[0.06, 6]} />
        <meshStandardMaterial 
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.6}
        />
      </mesh>

      <mesh position={[-0.32, 0.35, 0]} castShadow>
        <boxGeometry args={[0.16, 0.2, 0.24]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
          flatShading
        />
      </mesh>
      <mesh position={[0.32, 0.35, 0]} castShadow>
        <boxGeometry args={[0.16, 0.2, 0.24]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
          flatShading
        />
      </mesh>

      <group position={[-0.3, 0.05, 0]}>
        <mesh ref={leftArmRef} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>
      <group position={[0.3, 0.05, 0]}>
        <mesh ref={rightArmRef} rotation={[0, 0, -0.12]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>

      <group position={[-0.1, -0.35, 0]}>
        <mesh ref={leftLegRef} castShadow>
          <boxGeometry args={[0.14, 0.5, 0.14]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>
      <group position={[0.1, -0.35, 0]}>
        <mesh ref={rightLegRef} castShadow>
          <boxGeometry args={[0.14, 0.5, 0.14]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.6} 
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>

      <pointLight color="#f59e0b" intensity={0.3} distance={2} position={[0, 0.5, 0.3]} />
    </group>
  );
}
