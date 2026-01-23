import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { ensureAudioReady } from "@/lib/sounds";
import "@fontsource/inter";

import { useGameState } from "@/lib/stores/useGameState";
import { useRaceStore } from "@/lib/stores/useRaceStore";
import { Bridge } from "@/components/game/Bridge";
import { Planet } from "@/components/game/Planet";
import { RaceLevel } from "@/components/game/RaceLevel";
import { Player } from "@/components/game/Player";
import { NetworkManager } from "@/components/game/NetworkManager";
import { MobileControls } from "@/components/game/MobileControls";
import { KeyboardMouseControls } from "@/components/game/KeyboardMouseControls";
import { ChatDialog } from "@/components/game/ChatDialog";
import { GameUI } from "@/components/game/GameUI";
import { VoiceEnabler } from "@/components/game/VoiceEnabler";
import { Lobby } from "@/components/Lobby";

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

const keyMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.back, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.shoot, keys: ["KeyK"] },
  { name: Controls.weapon1, keys: ["Digit1"] },
  { name: Controls.weapon2, keys: ["Digit2"] },
  { name: Controls.weapon3, keys: ["Digit3"] },
  { name: Controls.hoverboard, keys: ["KeyV"] },
  { name: Controls.interact, keys: ["KeyF"] },
];

function Scene() {
  const { scene } = useGameState();

  return (
    <Physics gravity={[0, -9.81, 0]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />
      {scene === "bridge" && <Bridge />}
      {scene === "planet" && <Planet />}
      {scene === "race" && <RaceLevel />}
      {scene !== "race" && <Player />}
      <NetworkManager />
    </Physics>
  );
}

function PostProcessing() {
  const { isMobile } = useGameState();

  return (
    <EffectComposer enabled={!isMobile}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">POCKET INFINITY</h1>
        <div className="text-gray-400 animate-pulse">Loading USS Callister...</div>
      </div>
    </div>
  );
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isMobile, setIsMobile } = useGameState();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const timer = setTimeout(() => setIsLoading(false), 1500);

    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(timer);
    };
  }, [setIsMobile]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!gameStarted) {
    return <Lobby onStart={() => {
      ensureAudioReady();
      setGameStarted(true);
    }} />;
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{
            position: [0, 3, 8],
            fov: 60,
            near: 0.1,
            far: 1000,
          }}
          gl={{
            antialias: !isMobile,
            powerPreference: isMobile ? "low-power" : "high-performance",
          }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
        >
          <color attach="background" args={["#000011"]} />

          <Suspense fallback={null}>
            <Scene />
            {!isMobile && <PostProcessing />}
          </Suspense>
        </Canvas>

        <GameUI />
        <ChatDialog />
        <VoiceEnabler />

        {isMobile && <MobileControls />}
        {!isMobile && <KeyboardMouseControls />}
      </KeyboardControls>
    </div>
  );
}

export default App;
