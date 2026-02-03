import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameState, PlanetParams } from "@/lib/stores/useGameState";
import { CyberbotModel } from "./SoldierModel";
import { SpaceSkybox } from "./Skybox";

function CrewMember({
  name,
  position,
  isNear,
  onClick
}: {
  name: string;
  position: [number, number, number];
  isNear: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  // Use distinct colors for identifying bots
  const color = name === "Walton" ? "#3b82f6" : "#ec4899"; // Blue for Walton, Pink for Nanette
  const destination = name === "Walton" ? "Travel to Mars" : "Travel to Venus";

  return (
    <group position={position}>
      {/* Bot Model */}
      <CyberbotModel color={color} isMoving={false} />

      {/* Clickable zone */}
      <mesh
        position={[0, 1, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[1.5, 2.5, 1.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight position={[0, 1, 0]} intensity={1} color={color} distance={3} />
      )}

      <Text
        position={[0, 2.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {name}
      </Text>

      <Text
        position={[0, 1.8, 0]}
        fontSize={0.15}
        color={hovered ? "#4ade80" : "#888888"}
        anchorX="center"
        anchorY="middle"
      >
        {hovered ? `[Click] ${destination}` : destination}
      </Text>
    </group>
  );
}

function CaptainsChair() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 1.2, -0.6]} castShadow>
        <boxGeometry args={[1.5, 1.4, 0.3]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[-0.9, 0.8, 0]} castShadow>
        <boxGeometry args={[0.3, 0.2, 1]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.9, 0.8, 0]} castShadow>
        <boxGeometry args={[0.3, 0.2, 1]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      <pointLight position={[0, 2, 0]} intensity={0.5} color="#4fc3f7" distance={5} />
    </group>
  );
}

function SpaceWindow({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#000011" transparent opacity={0.3} />
      </mesh>

      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[6.4, 4.4, 0.2]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function HolographicGlobe() {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.y += delta * 0.5;
    if (ringRef2.current) ringRef2.current.rotation.x += delta * 0.3;
    if (ringRef3.current) ringRef3.current.rotation.z += delta * 0.4;
  });

  return (
    <group position={[0, 3, -5]}>
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh ref={ringRef1}>
        <torusGeometry args={[1.2, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh ref={ringRef2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh ref={ringRef3} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <torusGeometry args={[1.6, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.6}
        />
      </mesh>

      <pointLight color="#22d3ee" intensity={2} distance={15} />
      <pointLight color="#60a5fa" intensity={1} distance={10} position={[0, 1, 0]} />
    </group>
  );
}

function ConsolePanel({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow>
        <boxGeometry args={[2, 0.8, 0.3]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.1, 0.16]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      <mesh position={[-0.5, 0.1, 0.17]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-0.3, 0.1, 0.17]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0.3, 0.1, 0.17]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

export function Bridge() {
  const { crew, nearCrew, setScene, setPlanetParams } = useGameState();

  // Planet configurations for NPCs
  const handleWaltonClick = () => {
    const marsParams: PlanetParams = {
      groundColor: "#CD5C5C",
      fogDensity: 0.015,
      gravity: -3.7,
      planetName: "Mars"
    };
    setPlanetParams(marsParams);
    setScene("planet");
  };

  const handleNanetteClick = () => {
    const venusParams: PlanetParams = {
      groundColor: "#F4A460",
      fogDensity: 0.03,
      gravity: -8.9,
      planetName: "Venus"
    };
    setPlanetParams(venusParams);
    setScene("planet");
  };

  return (
    <group>
      <SpaceSkybox />

      {/* Solid Bridge Floor with Physics - FIXED COLLISION */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        {/* Main floor surface */}
        <mesh receiveShadow>
          <boxGeometry args={[25, 1, 25]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Explicit collider to prevent falling */}
        <CuboidCollider args={[12.5, 0.5, 12.5]} position={[0, 0, 0]} />
      </RigidBody>

      {/* Grid lines for sci-fi floor effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0a15" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 4, -10]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 4, 10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>

      <SpaceWindow position={[0, 4, -9.9]} />
      <SpaceWindow position={[-9.9, 4, 0]} rotation={[0, Math.PI / 2, 0]} />
      <SpaceWindow position={[9.9, 4, 0]} rotation={[0, -Math.PI / 2, 0]} />

      <CaptainsChair />
      <HolographicGlobe />

      <ConsolePanel position={[-3, 1, -7]} rotation={[-0.3, 0, 0]} />
      <ConsolePanel position={[3, 1, -7]} rotation={[-0.3, 0, 0]} />
      <ConsolePanel position={[-7, 1, -3]} rotation={[-0.3, Math.PI / 4, 0]} />
      <ConsolePanel position={[7, 1, -3]} rotation={[-0.3, -Math.PI / 4, 0]} />

      {/* RESTORED NPCs - Essential for planet selection */}
      <CrewMember
        name="Walton"
        position={[-2, 0, 2]}
        isNear={nearCrew?.id === "walton"}
        onClick={handleWaltonClick}
      />
      <CrewMember
        name="Nanette"
        position={[2, 0, 2]}
        isNear={nearCrew?.id === "nanette"}
        onClick={handleNanetteClick}
      />

      {/* Player Character - Static in Bridge */}
      <group position={[0, 0, 5]}>
        <CyberbotModel color="#f59e0b" isMoving={false} />
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.2}
          color="#4ade80"
          anchorX="center"
          anchorY="middle"
        >
          You
        </Text>
      </group>

      <ambientLight intensity={0.2} />
      {/* Main overhead cyan lighting */}
      <pointLight position={[0, 7, 0]} intensity={2} color="#00ffff" castShadow />
      <pointLight position={[-5, 4, -5]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[5, 4, -5]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[0, 5, 5]} intensity={1} color="#60a5fa" />
      {/* Accent floor lighting */}
      <pointLight position={[-8, 1, 8]} intensity={0.8} color="#3b82f6" />
      <pointLight position={[8, 1, 8]} intensity={0.8} color="#3b82f6" />
      <spotLight
        position={[0, 8, 0]}
        angle={0.8}
        penumbra={0.3}
        intensity={1.5}
        color="#4fc3f7"
        castShadow
      />
    </group>
  );
}
