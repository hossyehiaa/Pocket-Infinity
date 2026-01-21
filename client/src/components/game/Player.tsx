import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { myPlayer } from "playroomkit";
import { useControls } from "@/lib/stores/useControls";
import { useGameState, WEAPONS, WeaponType } from "@/lib/stores/useGameState";
import { getGroundHeight } from "./Planet";
import { CyberbotModel } from "./SoldierModel";
import { WeaponModel } from "./WeaponModel";
import { playJump, playGunshot } from "@/lib/sounds";

interface PlayerProps {
  onPositionChange?: (position: THREE.Vector3) => void;
}

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  shoot = "shoot",
  weapon1 = "weapon1",
  weapon2 = "weapon2",
  weapon3 = "weapon3",
  hoverboard = "hoverboard",
  interact = "interact",
}

function Hoverboard() {
  const meshRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    time.current += delta;
    meshRef.current.position.y = -0.3 + Math.sin(time.current * 3) * 0.1;
  });

  return (
    <group ref={meshRef} position={[0, -0.3, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.08, 1.5]} />
        <meshStandardMaterial color="#1e90ff" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.05, 0.5]}>
        <cylinderGeometry args={[0.15, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.05, -0.5]}>
        <cylinderGeometry args={[0.15, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
      </mesh>
      <pointLight color="#00ffff" intensity={0.5} distance={3} position={[0, -0.1, 0]} />
    </group>
  );
}

export function Player({ onPositionChange }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const isGroundedRef = useRef(true);
  const cameraRotationRef = useRef({ x: 0, y: 0 });

  const mobileControls = useControls();
  const {
    scene, planetParams, crew, setNearCrew, addBullet, isMobile, setPlayerPosition,
    isGameOver, knockbackDirection, currentWeapon, setWeapon, isOnHoverboard, toggleHoverboard,
    nearVehicle, isInVehicle, setInVehicle
  } = useGameState();
  const [isMoving, setIsMoving] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [, getKeyboard] = useKeyboardControls<Controls>();
  const knockbackVelocity = useRef(new THREE.Vector3());

  const lastShootTime = useRef(0);
  const lastNetworkUpdate = useRef(0);
  const lastNetworkPos = useRef({ x: 0, y: 0, z: 0 });
  const lastWeaponSwitch = useRef(0);
  const lastHoverboardToggle = useRef(0);
  const lastVehicleToggle = useRef(0);
  const gravity = scene === "planet" ? planetParams.gravity : -9.8;
  const playerHeight = 1.0;

  useEffect(() => {
    if (groupRef.current) {
      if (scene === "bridge") {
        groupRef.current.position.set(0, 1, 5);
      } else {
        const groundY = getGroundHeight(0, 0);
        groupRef.current.position.set(0, groundY + playerHeight, 0);
      }
      velocityRef.current.set(0, 0, 0);
      cameraRotationRef.current = { x: 0, y: 0 };
    }
  }, [scene]);

  const fireWeapon = (position: THREE.Vector3, cameraYRotation: number) => {
    const now = Date.now();
    const weaponInfo = WEAPONS[currentWeapon];

    if (now - lastShootTime.current < weaponInfo.cooldown) return;
    lastShootTime.current = now;

    playGunshot();
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 100);

    if (currentWeapon === "sniper") {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYRotation);
      direction.normalize();

      addBullet({
        id: `bullet-${now}`,
        position: [position.x, position.y, position.z],
        direction: [direction.x, direction.y, direction.z],
        createdAt: now,
        weaponType: "sniper",
        damage: weaponInfo.damage,
      });

    } else if (currentWeapon === "shotgun") {
      const baseDirection = new THREE.Vector3(0, 0, -1);
      baseDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYRotation);

      for (let i = 0; i < (weaponInfo.projectileCount || 5); i++) {
        const spreadX = (Math.random() - 0.5) * (weaponInfo.spread || 0.3);
        const spreadY = (Math.random() - 0.5) * (weaponInfo.spread || 0.3) * 0.5;

        const direction = baseDirection.clone();
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadX);
        direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadY);
        direction.normalize();

        addBullet({
          id: `bullet-${now}-${i}`,
          position: [position.x, position.y, position.z],
          direction: [direction.x, direction.y, direction.z],
          createdAt: now,
          weaponType: "shotgun",
          damage: weaponInfo.damage,
        });
      }
    } else {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYRotation);
      direction.normalize();

      addBullet({
        id: `bullet-${now}`,
        position: [position.x, position.y, position.z],
        direction: [direction.x, direction.y, direction.z],
        createdAt: now,
        weaponType: "blaster",
        damage: weaponInfo.damage,
      });
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (isGameOver) return;

    const keyboard = getKeyboard();
    const baseSpeed = 5;
    const vehicleSpeed = isInVehicle ? baseSpeed * 4 : (isOnHoverboard ? baseSpeed * 3 : baseSpeed);
    const moveSpeed = vehicleSpeed;
    const jumpForce = 8;

    const now = Date.now();
    if (keyboard.weapon1 && now - lastWeaponSwitch.current > 200) {
      lastWeaponSwitch.current = now;
      setWeapon("blaster");
    }
    if (keyboard.weapon2 && now - lastWeaponSwitch.current > 200) {
      lastWeaponSwitch.current = now;
      setWeapon("shotgun");
    }
    if (keyboard.weapon3 && now - lastWeaponSwitch.current > 200) {
      lastWeaponSwitch.current = now;
      setWeapon("sniper");
    }

    if (keyboard.hoverboard && now - lastHoverboardToggle.current > 500 && scene === "planet" && !isInVehicle) {
      lastHoverboardToggle.current = now;
      toggleHoverboard();
    }

    if (keyboard.interact && now - lastVehicleToggle.current > 500 && scene === "planet") {
      lastVehicleToggle.current = now;
      if (nearVehicle && !isInVehicle) {
        setInVehicle(true);
      } else if (isInVehicle) {
        setInVehicle(false);
      }
    }

    if (knockbackDirection) {
      knockbackVelocity.current.set(...knockbackDirection).multiplyScalar(3);
    }
    if (knockbackVelocity.current.length() > 0.01) {
      groupRef.current.position.add(knockbackVelocity.current.clone().multiplyScalar(delta));
      knockbackVelocity.current.multiplyScalar(0.9);
    }

    let moveX = 0;
    let moveZ = 0;
    let shouldJump = false;
    let shouldShoot = false;

    if (isMobile) {
      moveX = mobileControls.moveX;
      moveZ = mobileControls.moveZ;
      shouldJump = mobileControls.jump;
      shouldShoot = mobileControls.shoot;

      cameraRotationRef.current.y -= mobileControls.lookX;
      cameraRotationRef.current.x -= mobileControls.lookY;
      cameraRotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraRotationRef.current.x));
    } else {
      if (keyboard.forward) moveZ = -1;
      if (keyboard.back) moveZ = 1;
      if (keyboard.left) moveX = -1;
      if (keyboard.right) moveX = 1;
      shouldJump = keyboard.jump;
      shouldShoot = keyboard.shoot;
    }

    const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationRef.current.y);

    const newX = groupRef.current.position.x + moveDir.x * moveSpeed * delta;
    const newZ = groupRef.current.position.z + moveDir.z * moveSpeed * delta;

    groupRef.current.position.x = newX;
    groupRef.current.position.z = newZ;

    const moving = moveDir.length() > 0.1;
    if (moving !== isMoving) {
      setIsMoving(moving);
    }

    if (moving) {
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }

    let groundLevel: number;
    if (scene === "planet") {
      groundLevel = getGroundHeight(groupRef.current.position.x, groupRef.current.position.z) + playerHeight;
      if (isOnHoverboard) {
        groundLevel += 0.5;
      }
    } else {
      groundLevel = 1;
    }

    if (shouldJump && isGroundedRef.current && !isOnHoverboard) {
      velocityRef.current.y = jumpForce;
      isGroundedRef.current = false;
      playJump();
    }

    velocityRef.current.y += gravity * delta;
    groupRef.current.position.y += velocityRef.current.y * delta;

    if (groupRef.current.position.y <= groundLevel) {
      groupRef.current.position.y = groundLevel;
      velocityRef.current.y = 0;
      isGroundedRef.current = true;
    }

    if (scene === "bridge") {
      groupRef.current.position.x = Math.max(-8, Math.min(8, groupRef.current.position.x));
      groupRef.current.position.z = Math.max(-8, Math.min(8, groupRef.current.position.z));
    }

    if (scene === "planet" && shouldShoot) {
      fireWeapon(groupRef.current.position.clone(), cameraRotationRef.current.y);
    }

    if (scene === "bridge") {
      let closest: typeof crew[0] | null = null;
      let closestDist = Infinity;

      for (const member of crew) {
        const dist = groupRef.current.position.distanceTo(
          new THREE.Vector3(...member.position)
        );
        if (dist < 3 && dist < closestDist) {
          closest = member;
          closestDist = dist;
        }
      }
      setNearCrew(closest);
    }

    const cameraOffset = new THREE.Vector3(0, 2, 5);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationRef.current.y);

    state.camera.position.lerp(
      new THREE.Vector3(
        groupRef.current.position.x + cameraOffset.x,
        groupRef.current.position.y + cameraOffset.y + Math.sin(cameraRotationRef.current.x) * 2,
        groupRef.current.position.z + cameraOffset.z
      ),
      0.1
    );

    const lookTarget = groupRef.current.position.clone();
    lookTarget.y += 1;
    state.camera.lookAt(lookTarget);

    setPlayerPosition([
      groupRef.current.position.x,
      groupRef.current.position.y,
      groupRef.current.position.z
    ]);
    onPositionChange?.(groupRef.current.position.clone());

    const me = myPlayer();
    if (me) {
      const pos = groupRef.current.position;
      const movedEnough =
        Math.abs(pos.x - lastNetworkPos.current.x) > 0.05 ||
        Math.abs(pos.y - lastNetworkPos.current.y) > 0.05 ||
        Math.abs(pos.z - lastNetworkPos.current.z) > 0.05;

      if (now - lastNetworkUpdate.current > 50 && movedEnough) {
        lastNetworkUpdate.current = now;
        lastNetworkPos.current = { x: pos.x, y: pos.y, z: pos.z };
        me.setState("pos", { x: pos.x, y: pos.y, z: pos.z });
        me.setState("rot", groupRef.current.rotation.y);
      }
    }
  });

  const me = myPlayer();
  const playerColor = me?.getState("color") || "#4a90d9";

  return (
    <group ref={groupRef} position={[0, 1, 5]}>
      {!isInVehicle && <CyberbotModel isMoving={isMoving} color={playerColor} />}
      {isOnHoverboard && !isInVehicle && <Hoverboard />}
      {/* Weapon held by player */}
      {!isInVehicle && scene === "planet" && (
        <group position={[0.3, 0.8, 0.5]} rotation={[0, Math.PI / 2, 0]}>
          <WeaponModel type={currentWeapon} isShooting={isShooting} />
        </group>
      )}
    </group>
  );
}
