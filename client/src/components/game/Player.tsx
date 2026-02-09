import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody, type RapierRigidBody, CapsuleCollider } from "@react-three/rapier";
import * as THREE from "three";
import { myPlayer } from "playroomkit";
import { useControls } from "@/lib/stores/useControls";
import { useGameState, WEAPONS, WeaponType, PlanetParams } from "@/lib/stores/useGameState";
import { getGroundHeight } from "./Planet";
import { CapsulePlayer } from "./PlayerModel";
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
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isGroundedRef = useRef(true);

  // Camera rotation is controlled ONLY by mouse, not physics
  const cameraYaw = useRef(0); // Horizontal rotation (mouse X)
  const cameraPitch = useRef(0); // Vertical rotation (mouse Y)

  const mobileControls = useControls();
  const {
    scene, planetParams, crew, setNearCrew, addBullet, isMobile, setPlayerPosition,
    isGameOver, knockbackDirection, currentWeapon, setWeapon, isOnHoverboard, toggleHoverboard,
    nearVehicle, isInVehicle, setInVehicle, setPlanetParams, setScene
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
  const playerHeight = 1.0;

  // Smooth camera target position
  const smoothCameraTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (rigidBodyRef.current) {
      if (scene === "bridge") {
        rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 5 }, true);
      } else {
        const groundY = getGroundHeight(0, 0);
        rigidBodyRef.current.setTranslation({ x: 0, y: groundY + playerHeight, z: 0 }, true);
      }
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      cameraYaw.current = 0;
      cameraPitch.current = 0;
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
    if (!rigidBodyRef.current || !groupRef.current) return;
    if (isGameOver) return;

    const keyboard = getKeyboard();

    // REALISTIC MOVEMENT SPEEDS
    const baseSpeed = 5; // Reduced from 20 to 5 for realistic walking
    const runSpeed = 8; // Running speed
    const vehicleSpeed = isInVehicle ? baseSpeed * 3 : (isOnHoverboard ? baseSpeed * 2.5 : baseSpeed);
    const moveSpeed = vehicleSpeed;
    const jumpForce = 6; // Reduced for more grounded feel

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

    // Handle knockback with physics
    if (knockbackDirection) {
      knockbackVelocity.current.set(...knockbackDirection).multiplyScalar(3);
    }
    if (knockbackVelocity.current.length() > 0.01) {
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({
        x: currentVel.x + knockbackVelocity.current.x * delta,
        y: currentVel.y,
        z: currentVel.z + knockbackVelocity.current.z * delta
      }, true);
      knockbackVelocity.current.multiplyScalar(0.9);
    }

    // Get movement input
    let moveX = 0;
    let moveZ = 0;
    let shouldJump = false;
    let shouldShoot = false;
    let lookDeltaX = 0;
    let lookDeltaY = 0;

    moveX = mobileControls.moveX;
    moveZ = mobileControls.moveZ;
    shouldJump = mobileControls.jump;
    shouldShoot = mobileControls.shoot;
    lookDeltaX = mobileControls.lookX;
    lookDeltaY = mobileControls.lookY;

    // CAMERA ROTATION - controlled ONLY by mouse input
    // Apply mouse delta to camera rotation (sensitivity adjusted)
    const mouseSensitivity = 0.003;
    cameraYaw.current -= lookDeltaX * mouseSensitivity;
    cameraPitch.current -= lookDeltaY * mouseSensitivity;

    // Clamp pitch to prevent camera flipping
    cameraPitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraPitch.current));

    // MOVEMENT - Camera Relative (Fix: Use Camera Vectors)
    const cameraForward = new THREE.Vector3();
    state.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(cameraForward, moveZ); // Forward/Back
    moveDir.addScaledVector(cameraRight, moveX);   // Left/Right

    const hasMovementInput = Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01;

    if (hasMovementInput && moveDir.length() > 0.1) {
      moveDir.normalize();
    }

    // PHYSICS MOVEMENT - Only apply velocity when keys are pressed
    const currentVel = rigidBodyRef.current.linvel();

    if (hasMovementInput) {
      // Apply movement velocity
      rigidBodyRef.current.setLinvel({
        x: moveDir.x * moveSpeed,
        y: currentVel.y, // Preserve vertical velocity for jumping/falling
        z: moveDir.z * moveSpeed
      }, true);
    } else {
      // When no input, let damping handle the stopping (don't force velocity to 0)
      // Just preserve gravity/vertical velocity
      rigidBodyRef.current.setLinvel({
        x: currentVel.x * 0.85, // Apply additional friction for quick stop
        y: currentVel.y,
        z: currentVel.z * 0.85
      }, true);
    }

    const moving = hasMovementInput;
    if (moving !== isMoving) {
      setIsMoving(moving);
    }

    // Update player MODEL rotation to face movement direction
    if (moving && moveDir.length() > 0.1) {
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.2 // Slightly faster rotation
      );
    }

    // Get current position from physics body
    const position = rigidBodyRef.current.translation();
    groupRef.current.position.set(position.x, position.y, position.z);

    // Jump with impulse
    if (shouldJump && isGroundedRef.current && !isOnHoverboard) {
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

    // Boundary enforcement for bridge scene
    if (scene === "bridge") {
      const pos = rigidBodyRef.current.translation();
      const clampedX = Math.max(-8, Math.min(8, pos.x));
      const clampedZ = Math.max(-8, Math.min(8, pos.z));
      if (clampedX !== pos.x || clampedZ !== pos.z) {
        rigidBodyRef.current.setTranslation({ x: clampedX, y: pos.y, z: clampedZ }, true);
      }
    }

    if (scene === "planet" && shouldShoot) {
      fireWeapon(groupRef.current.position.clone(), cameraYaw.current);
    }

    // Bridge Scene: Check for NPC interaction
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

      // Press F to interact with NPCs
      if (keyboard.interact && now - lastVehicleToggle.current > 500 && closest) {
        lastVehicleToggle.current = now;

        if (closest.id === "walton") {
          const marsParams: PlanetParams = {
            groundColor: "#CD5C5C",
            fogDensity: 0.015,
            gravity: -3.7,
            planetName: "Mars"
          };
          setPlanetParams(marsParams);
          setScene("planet");
        } else if (closest.id === "nanette") {
          const venusParams: PlanetParams = {
            groundColor: "#F4A460",
            fogDensity: 0.03,
            gravity: -8.9,
            planetName: "Venus"
          };
          setPlanetParams(venusParams);
          setScene("planet");
        }
      }
    }

    // CAMERA FOLLOW - STRICT TPS
    // Goal: Camera strictly follows player position with fixed offset rotated by Control Yaw

    // 1. Direct target tracking (Instant, no lerp on target itself)
    const targetPosition = groupRef.current.position.clone();

    // 2. Calculate ideal offset rotated by Camera Yaw (Mouse Loop)
    // Offset: Right +0.8, Up +1.8, Back +2.5
    const idealOffset = new THREE.Vector3(0.8, 1.8, 2.5);
    idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw.current);

    // 3. Calculate final camera position
    const targetCameraPos = targetPosition.clone().add(idealOffset);

    // 4. Tight Lerp (High value = "linked" feel). 
    state.camera.position.lerp(targetCameraPos, 0.1);

    // 5. Look at upper spine/head area
    const lookTarget = targetPosition.clone();
    lookTarget.y += 1.4;
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
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      enabledRotations={[false, false, false]} // Lock ALL rotations - we control model rotation manually
      lockTranslations={false}
      mass={2} // Heavier robot
      linearDamping={4} // Higher damping for quick stops
      angularDamping={10}
      friction={1}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      <group ref={groupRef}>
        {!isInVehicle && <CapsulePlayer />}
        {isOnHoverboard && !isInVehicle && <Hoverboard />}
        {/* Weapon held by player */}
        {!isInVehicle && scene === "planet" && (
          <group position={[0.3, 0.8, 0.5]} rotation={[0, Math.PI / 2, 0]}>
            <WeaponModel type={currentWeapon} isShooting={isShooting} />
          </group>
        )}
      </group>
    </RigidBody>
  );
}
