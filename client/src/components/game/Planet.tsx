import { useRef, useMemo, useEffect, useCallback, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { Stars, Text, useTexture, Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useGameState } from "@/lib/stores/useGameState";
import { playExplosion } from "@/lib/sounds";
import { getNoiseHeight, SeededRandom } from "@/lib/noise";

const ZONE_INITIAL_RADIUS = 100;
const ZONE_FINAL_RADIUS = 8;
const ZONE_SHRINK_DURATION = 120000;

const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 100;

function getTerrainHeight(x: number, z: number): number {
  const base = getNoiseHeight(x, z, 0.015, 8, 4);
  const detail = getNoiseHeight(x + 100, z + 100, 0.05, 2, 2);
  const hills = getNoiseHeight(x - 50, z - 50, 0.008, 12, 3);
  return base + detail + hills * 0.5;
}

export function getGroundHeight(x: number, z: number): number {
  return getTerrainHeight(x, z);
}

function getPlanetType(groundColor: string): "volcanic" | "forest" | "ice" | "desert" {
  const color = groundColor.toLowerCase();
  if (color.includes("f") && color.includes("4") || color.includes("red") || color.includes("8b") || color.includes("dc")) {
    return "volcanic";
  }
  if (color.includes("22") || color.includes("16") || color.includes("green") || color.includes("4a") || color.includes("2d")) {
    return "forest";
  }
  if (color.includes("87") || color.includes("00") && color.includes("ff") || color.includes("cyan") || color.includes("e0") || color.includes("b0")) {
    return "ice";
  }
  return "desert";
}

function getTextureForPlanetType(planetType: "volcanic" | "forest" | "ice" | "desert"): string {
  switch (planetType) {
    case "forest": return "/textures/grass.png";
    case "desert": return "/textures/sand.jpg";
    case "volcanic": return "/textures/asphalt.png";
    case "ice": return "/textures/sand.jpg";
    default: return "/textures/grass.png";
  }
}

function Terrain({ color }: { color: string }) {
  // Use realistic pmndrs dust/sand textures for all terrain types
  const diffuseMap = useTexture("https://raw.githubusercontent.com/pmndrs/drei-assets/master/prototypes/dust/diffuse.jpg");
  const normalMap = useTexture("https://raw.githubusercontent.com/pmndrs/drei-assets/master/prototypes/dust/normal.jpg");

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const positions = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] = getTerrainHeight(x, y);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Configure textures for realistic tiling across the infinite map
  useMemo(() => {
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.repeat.set(20, 20);

    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(20, 20);
  }, [diffuseMap, normalMap]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        map={diffuseMap}
        normalMap={normalMap}
        color={color}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  );
}

function VolcanicProps() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 600;

  const { matrices, scales } = useMemo(() => {
    const rng = new SeededRandom(11111);
    const matrices: THREE.Matrix4[] = [];
    const scales: number[] = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.3 + rng.next() * 1.2;

      tempPosition.set(x, groundY, z);
      tempQuaternion.setFromEuler(new THREE.Euler(
        (rng.next() - 0.5) * 0.3,
        rng.next() * Math.PI * 2,
        (rng.next() - 0.5) * 0.3
      ));
      tempScale.set(scale, scale * (0.8 + rng.next() * 0.8), scale);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      matrices.push(tempMatrix.clone());
      scales.push(scale);
    }

    return { matrices, scales };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.3} flatShading />
    </instancedMesh>
  );
}

function ForestProps() {
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const treeCount = 200;
  const grassCount = 500;

  const { treeMatrices, grassMatrices } = useMemo(() => {
    const rng = new SeededRandom(22222);
    const treeMatrices: THREE.Matrix4[] = [];
    const grassMatrices: THREE.Matrix4[] = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    for (let i = 0; i < treeCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 30);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 30);
      const groundY = getTerrainHeight(x, z);
      const scale = 1 + rng.next() * 2;

      tempPosition.set(x, groundY + scale * 1.5, z);
      tempQuaternion.setFromEuler(new THREE.Euler(0, rng.next() * Math.PI * 2, 0));
      tempScale.set(scale * 0.6, scale * 2, scale * 0.6);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      treeMatrices.push(tempMatrix.clone());
    }

    for (let i = 0; i < grassCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.2 + rng.next() * 0.4;

      tempPosition.set(x, groundY + scale * 0.5, z);
      tempQuaternion.setFromEuler(new THREE.Euler(0, rng.next() * Math.PI * 2, 0));
      tempScale.set(scale, scale * 2, scale);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      grassMatrices.push(tempMatrix.clone());
    }

    return { treeMatrices, grassMatrices };
  }, []);

  useEffect(() => {
    if (treeRef.current) {
      treeMatrices.forEach((matrix, i) => {
        treeRef.current!.setMatrixAt(i, matrix);
      });
      treeRef.current.instanceMatrix.needsUpdate = true;
    }
    if (grassRef.current) {
      grassMatrices.forEach((matrix, i) => {
        grassRef.current!.setMatrixAt(i, matrix);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [treeMatrices, grassMatrices]);

  return (
    <>
      <instancedMesh ref={treeRef} args={[undefined, undefined, treeCount]} castShadow>
        <coneGeometry args={[1, 2, 6]} />
        <meshStandardMaterial color="#0d4f1c" roughness={0.9} metalness={0.1} flatShading />
      </instancedMesh>
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassCount]}>
        <coneGeometry args={[0.3, 1, 4]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
    </>
  );
}

function IceProps() {
  const crystalRef = useRef<THREE.InstancedMesh>(null);
  const smallCrystalRef = useRef<THREE.InstancedMesh>(null);
  const crystalCount = 300;
  const smallCount = 400;

  const { crystalMatrices, smallMatrices } = useMemo(() => {
    const rng = new SeededRandom(33333);
    const crystalMatrices: THREE.Matrix4[] = [];
    const smallMatrices: THREE.Matrix4[] = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    for (let i = 0; i < crystalCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.5 + rng.next() * 1.5;

      tempPosition.set(x, groundY + scale, z);
      tempQuaternion.setFromEuler(new THREE.Euler(
        (rng.next() - 0.5) * 0.2,
        rng.next() * Math.PI * 2,
        (rng.next() - 0.5) * 0.2
      ));
      tempScale.set(scale * 0.3, scale * 2, scale * 0.3);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      crystalMatrices.push(tempMatrix.clone());
    }

    for (let i = 0; i < smallCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.1 + rng.next() * 0.3;

      tempPosition.set(x, groundY + scale * 0.5, z);
      tempQuaternion.setFromEuler(new THREE.Euler(0, rng.next() * Math.PI * 2, 0));
      tempScale.set(scale, scale, scale);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      smallMatrices.push(tempMatrix.clone());
    }

    return { crystalMatrices, smallMatrices };
  }, []);

  useEffect(() => {
    if (crystalRef.current) {
      crystalMatrices.forEach((matrix, i) => {
        crystalRef.current!.setMatrixAt(i, matrix);
      });
      crystalRef.current.instanceMatrix.needsUpdate = true;
    }
    if (smallCrystalRef.current) {
      smallMatrices.forEach((matrix, i) => {
        smallCrystalRef.current!.setMatrixAt(i, matrix);
      });
      smallCrystalRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [crystalMatrices, smallMatrices]);

  return (
    <>
      <instancedMesh ref={crystalRef} args={[undefined, undefined, crystalCount]} castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#87ceeb"
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.8}
          flatShading
        />
      </instancedMesh>
      <instancedMesh ref={smallCrystalRef} args={[undefined, undefined, smallCount]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#e0ffff"
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.6}
          flatShading
        />
      </instancedMesh>
    </>
  );
}

function DesertProps() {
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const rockCount = 250;
  const debrisCount = 500;

  const { rockMatrices, debrisMatrices } = useMemo(() => {
    const rng = new SeededRandom(44444);
    const rockMatrices: THREE.Matrix4[] = [];
    const debrisMatrices: THREE.Matrix4[] = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    for (let i = 0; i < rockCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 20);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.5 + rng.next() * 2;

      tempPosition.set(x, groundY + scale * 0.3, z);
      tempQuaternion.setFromEuler(new THREE.Euler(
        (rng.next() - 0.5) * 0.4,
        rng.next() * Math.PI * 2,
        (rng.next() - 0.5) * 0.4
      ));
      tempScale.set(scale, scale * 0.6, scale * 0.8);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      rockMatrices.push(tempMatrix.clone());
    }

    for (let i = 0; i < debrisCount; i++) {
      const x = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const z = (rng.next() - 0.5) * (TERRAIN_SIZE - 10);
      const groundY = getTerrainHeight(x, z);
      const scale = 0.1 + rng.next() * 0.3;

      tempPosition.set(x, groundY + scale * 0.2, z);
      tempQuaternion.setFromEuler(new THREE.Euler(
        rng.next() * Math.PI,
        rng.next() * Math.PI * 2,
        rng.next() * Math.PI
      ));
      tempScale.set(scale, scale * 0.5, scale);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      debrisMatrices.push(tempMatrix.clone());
    }

    return { rockMatrices, debrisMatrices };
  }, []);

  useEffect(() => {
    if (rockRef.current) {
      rockMatrices.forEach((matrix, i) => {
        rockRef.current!.setMatrixAt(i, matrix);
      });
      rockRef.current.instanceMatrix.needsUpdate = true;
    }
    if (debrisRef.current) {
      debrisMatrices.forEach((matrix, i) => {
        debrisRef.current!.setMatrixAt(i, matrix);
      });
      debrisRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [rockMatrices, debrisMatrices]);

  return (
    <>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rockCount]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#8b7355" roughness={0.95} metalness={0.1} flatShading />
      </instancedMesh>
      <instancedMesh ref={debrisRef} args={[undefined, undefined, debrisCount]}>
        <tetrahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#a0855c" roughness={0.9} metalness={0.05} flatShading />
      </instancedMesh>
    </>
  );
}

function ScatteredProps({ planetType }: { planetType: "volcanic" | "forest" | "ice" | "desert" }) {
  switch (planetType) {
    case "volcanic":
      return <VolcanicProps />;
    case "forest":
      return <ForestProps />;
    case "ice":
      return <IceProps />;
    default:
      return <DesertProps />;
  }
}

function AtmosphericFog({ color, density }: { color: string; density: number }) {
  const { scene } = useThree();

  useEffect(() => {
    const fogColor = new THREE.Color(color).multiplyScalar(0.3);
    const fogDensity = 0.008 + density * 0.02;
    scene.fog = new THREE.FogExp2(fogColor.getHex(), fogDensity);
    scene.background = fogColor;

    return () => {
      scene.fog = null;
      scene.background = new THREE.Color("#000011");
    };
  }, [color, density, scene]);

  return null;
}

function FloatingDrone({ enemy, onHit }: {
  enemy: { id: string; position: [number, number, number]; health: number };
  onHit: (id: string, damage: number) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Group>(null);
  const time = useRef(Math.random() * Math.PI * 2);
  const lastDamageTime = useRef(0);
  const { bullets, removeBullet, playerPosition, damagePlayer, triggerDamageFlash, applyKnockback, isGameOver, updateEnemyPosition } = useGameState();

  const chaseSpeed = 1.5;

  useFrame((_, delta) => {
    if (!meshRef.current || isGameOver) return;

    time.current += delta;

    const playerPos = new THREE.Vector3(...playerPosition);
    const dronePos = meshRef.current.position;
    const direction = playerPos.clone().sub(dronePos);
    direction.y = 0;
    const distance = direction.length();

    if (distance > 1.5) {
      direction.normalize();
      meshRef.current.position.x += direction.x * chaseSpeed * delta;
      meshRef.current.position.z += direction.z * chaseSpeed * delta;
    }

    meshRef.current.position.y += Math.sin(time.current * 2) * delta * 0.5;
    const groundY = getTerrainHeight(meshRef.current.position.x, meshRef.current.position.z);
    meshRef.current.position.y = Math.max(groundY + 3, meshRef.current.position.y);

    updateEnemyPosition(enemy.id, [
      meshRef.current.position.x,
      meshRef.current.position.y,
      meshRef.current.position.z
    ]);

    if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 3;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 2;
    if (antennaRef.current) antennaRef.current.rotation.y += delta * 1.5;

    const now = Date.now();
    if (distance < 1.5 && now - lastDamageTime.current > 1000) {
      lastDamageTime.current = now;
      damagePlayer(10);
      triggerDamageFlash();
      const knockback = playerPos.clone().sub(dronePos).normalize();
      applyKnockback([knockback.x, 0, knockback.z]);
    }

    for (const bullet of bullets) {
      const bulletPos = new THREE.Vector3(...bullet.position);
      if (bulletPos.distanceTo(dronePos) < 1.5) {
        removeBullet(bullet.id);
        onHit(enemy.id, bullet.damage || 25);
        break;
      }
    }
  });

  if (enemy.health <= 0) return null;

  const healthPercent = enemy.health / 100;
  const glowIntensity = 0.3 + (1 - healthPercent) * 0.5;

  return (
    <group ref={meshRef} position={enemy.position}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial
          color="#374151"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={glowIntensity}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.8, 0.05, 8, 24]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.03, 8, 24]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <group ref={antennaRef}>
        <mesh position={[0.6, 0.3, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.75, 0.45, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
          />
        </mesh>

        <mesh position={[-0.6, 0.3, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.75, 0.45, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      <pointLight color="#ef4444" intensity={0.8} distance={6} />
    </group>
  );
}

function Bullets() {
  const { bullets, removeBullet } = useGameState();

  const bulletLifetimes: Record<string, number> = {
    blaster: 3000,
    shotgun: 500,
    sniper: 2000,
  };

  useFrame(() => {
    const now = Date.now();
    for (const bullet of bullets) {
      const lifetime = bulletLifetimes[bullet.weaponType || 'blaster'] || 3000;
      if (now - bullet.createdAt > lifetime) {
        removeBullet(bullet.id);
      }
    }
  });

  return (
    <group>
      {bullets.map((bullet) => (
        <BulletMesh key={bullet.id} bullet={bullet} />
      ))}
    </group>
  );
}

function ShrinkingZone() {
  const { zone, updateZone, startZone, playerPosition, damagePlayer, triggerDamageFlash, isGameOver } = useGameState();
  const meshRef = useRef<THREE.Mesh>(null);
  const lastDamageTime = useRef(0);
  const zoneStarted = useRef(false);

  useEffect(() => {
    if (!zoneStarted.current) {
      zoneStarted.current = true;
      startZone();
    }
  }, [startZone]);

  useFrame(() => {
    if (!zone.isActive || isGameOver) return;

    const elapsed = Date.now() - zone.startTime;
    const progress = Math.min(elapsed / ZONE_SHRINK_DURATION, 1);
    const currentRadius = ZONE_INITIAL_RADIUS - (ZONE_INITIAL_RADIUS - ZONE_FINAL_RADIUS) * progress;

    if (Math.abs(currentRadius - zone.radius) > 0.5) {
      updateZone({ radius: currentRadius });
    }

    const playerDistFromCenter = Math.sqrt(
      Math.pow(playerPosition[0] - zone.centerX, 2) +
      Math.pow(playerPosition[2] - zone.centerZ, 2)
    );

    if (playerDistFromCenter > currentRadius) {
      const now = Date.now();
      if (now - lastDamageTime.current > 1000) {
        lastDamageTime.current = now;
        damagePlayer(5);
        triggerDamageFlash();
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[zone.centerX, 25, zone.centerZ]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[zone.radius, zone.radius, 50, 64, 1, true]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[zone.centerX, 0.5, zone.centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius - 0.5, zone.radius + 0.5, 64]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SciFiOutposts() {
  const outpostCount = 8;

  const outposts = useMemo(() => {
    const rng = new SeededRandom(77777);
    const positions: { x: number; z: number; rotation: number; scale: number; type: number }[] = [];

    for (let i = 0; i < outpostCount; i++) {
      const angle = (i / outpostCount) * Math.PI * 2 + rng.next() * 0.5;
      const dist = 25 + rng.next() * 40;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      positions.push({
        x,
        z,
        rotation: rng.next() * Math.PI * 2,
        scale: 0.8 + rng.next() * 0.4,
        type: Math.floor(rng.next() * 3),
      });
    }
    return positions;
  }, []);

  return (
    <group>
      {outposts.map((outpost, i) => (
        <Outpost key={i} position={[outpost.x, outpost.z]} rotation={outpost.rotation} scale={outpost.scale} type={outpost.type} />
      ))}
    </group>
  );
}

function Outpost({ position, rotation, scale, type }: { position: [number, number]; rotation: number; scale: number; type: number }) {
  const groundY = getTerrainHeight(position[0], position[1]);

  if (type === 0) {
    return (
      <group position={[position[0], groundY, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 4, 6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[7, 0.4, 7]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[3.1, 1.5, 0]} castShadow>
          <boxGeometry args={[0.2, 3, 2]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 3.1]}>
          <boxGeometry args={[2, 3.5, 0.1]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
        <pointLight position={[0, 3, 0]} color="#0ea5e9" intensity={0.5} distance={10} />
      </group>
    );
  }

  if (type === 1) {
    return (
      <group position={[position[0], groundY, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3.5, 3, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <coneGeometry args={[4, 2, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[2.8, 1.5, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.5, 2.5, 1.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
        <pointLight position={[0, 2, 0]} color="#f59e0b" intensity={0.4} distance={8} />
      </group>
    );
  }

  return (
    <group position={[position[0], groundY, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[-2, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 5]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[2, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 5, 5]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[2, 5.2, 0]} castShadow>
        <boxGeometry args={[4.5, 0.3, 5.5]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.2, 2.6]}>
        <boxGeometry args={[1.5, 2.8, 0.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>
      <mesh position={[4.1, 2, 0]} castShadow>
        <boxGeometry args={[0.15, 2, 1.5]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4} />
      </mesh>
      <pointLight position={[0, 3, 0]} color="#22d3ee" intensity={0.4} distance={12} />
    </group>
  );
}

function SpaceBike() {
  const { playerPosition, isInVehicle, setInVehicle, setNearVehicle, nearVehicle } = useGameState();
  const meshRef = useRef<THREE.Group>(null);
  const bikePosition = useMemo(() => {
    const groundY = getTerrainHeight(8, 5);
    return new THREE.Vector3(8, groundY + 0.5, 5);
  }, []);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    time.current += delta;

    if (!isInVehicle) {
      meshRef.current.position.y = bikePosition.y + Math.sin(time.current * 2) * 0.1;
    }

    const playerDist = Math.sqrt(
      Math.pow(playerPosition[0] - bikePosition.x, 2) +
      Math.pow(playerPosition[2] - bikePosition.z, 2)
    );

    const isNear = playerDist < 3 && !isInVehicle;
    if (isNear !== nearVehicle) {
      setNearVehicle(isNear);
    }
  });

  if (isInVehicle) return null;

  return (
    <group ref={meshRef} position={bikePosition}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.4, 3]} />
        <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.3, 0.8]} castShadow>
        <boxGeometry args={[0.6, 0.5, 1]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.3, 1.2]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.8]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.3, -1.2]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, -0.25, 0]}>
        <cylinderGeometry args={[0.15, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.5, -0.25, 0]}>
        <cylinderGeometry args={[0.15, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </mesh>
      <pointLight position={[0, 0, 1.5]} color="#ffffff" intensity={0.5} distance={5} />
      <pointLight position={[0, -0.3, 0]} color="#00ffff" intensity={0.8} distance={4} />
    </group>
  );
}

function BulletMesh({ bullet }: {
  bullet: { id: string; position: [number, number, number]; direction: [number, number, number]; createdAt: number; weaponType?: string; damage?: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const bulletConfig = {
    blaster: { speed: 50, size: 0.15, color: "#00ff00", lifetime: 3000 },
    shotgun: { speed: 40, size: 0.1, color: "#ff8800", lifetime: 500 },
    sniper: { speed: 150, size: 0.08, color: "#00ffff", lifetime: 2000 },
  };

  const config = bulletConfig[bullet.weaponType as keyof typeof bulletConfig] || bulletConfig.blaster;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x += bullet.direction[0] * config.speed * delta;
    meshRef.current.position.y += bullet.direction[1] * config.speed * delta;
    meshRef.current.position.z += bullet.direction[2] * config.speed * delta;

    bullet.position[0] = meshRef.current.position.x;
    bullet.position[1] = meshRef.current.position.y;
    bullet.position[2] = meshRef.current.position.z;
  });

  return (
    <mesh ref={meshRef} position={bullet.position}>
      <sphereGeometry args={[config.size, 8, 8]} />
      <meshBasicMaterial color={config.color} />
      <pointLight color={config.color} intensity={1} distance={3} />
    </mesh>
  );
}

export function Planet() {
  const { planetParams, enemies, addEnemy, damageEnemy, removeEnemy, clearBullets, addScore } = useGameState();
  const enemiesSpawned = useRef(false);

  const planetType = useMemo(() => getPlanetType(planetParams.groundColor), [planetParams.groundColor]);

  const spawnEnemies = useCallback(() => {
    if (enemiesSpawned.current) return;
    enemiesSpawned.current = true;

    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80 - 10;
      const groundY = getTerrainHeight(x, z);
      addEnemy({
        id: `drone-${Date.now()}-${i}`,
        position: [x, groundY + 4 + Math.random() * 2, z],
        health: 100,
      });
    }
  }, [addEnemy]);

  useEffect(() => {
    spawnEnemies();

    return () => {
      enemiesSpawned.current = false;
      clearBullets();
    };
  }, [spawnEnemies, clearBullets]);

  const handleDroneHit = useCallback((id: string, damage: number = 25) => {
    const enemy = enemies.find((e) => e.id === id);
    if (!enemy || enemy.health <= 0) return;

    const newHealth = enemy.health - damage;
    damageEnemy(id, damage);

    if (newHealth <= 0) {
      playExplosion();
      addScore(100);
      setTimeout(() => removeEnemy(id), 100);
    }
  }, [damageEnemy, enemies, removeEnemy, addScore]);

  return (
    <group>
      {/* Realistic sky with sun */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.6}
        azimuth={0.25}
      />

      {/* Realistic environment lighting for reflections */}
      <Environment preset="sunset" />

      <Stars
        radius={200}
        depth={80}
        count={8000}
        factor={5}
        saturation={0}
        fade
        speed={0.3}
      />

      <AtmosphericFog color={planetParams.groundColor} density={planetParams.fogDensity} />
      <Terrain color={planetParams.groundColor} />
      <ScatteredProps planetType={planetType} />
      <SciFiOutposts />
      <ShrinkingZone />
      <SpaceBike />

      {enemies.map((enemy) => (
        <FloatingDrone
          key={enemy.id}
          enemy={enemy}
          onHit={handleDroneHit}
        />
      ))}

      <Bullets />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={[planetParams.groundColor, "#000000", 0.4]} />

      <mesh position={[50, 40, -50]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" />
        <pointLight color="#fbbf24" intensity={2.5} distance={150} />
      </mesh>
    </group>
  );
}
