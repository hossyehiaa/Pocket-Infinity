import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ensureAudioReady } from "@/lib/sounds";
import "@fontsource/inter";

import { useGameState } from "@/lib/stores/useGameState";
import { Bridge } from "@/components/game/Bridge";
import { Planet } from "@/components/game/Planet";
import { Player } from "@/components/game/Player";
import { NetworkManager } from "@/components/game/NetworkManager";
import { MobileControls } from "@/components/game/MobileControls";
import { ChatDialog } from "@/components/game/ChatDialog";
import { GameUI } from "@/components/game/GameUI";
import { VoiceEnabler } from "@/components/game/VoiceEnabler";

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
    <>
      <ambientLight intensity={0.5} />
      <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />
      {scene === "bridge" && <Bridge />}
      {scene === "planet" && <Planet />}
      <Player />
      <NetworkManager />
    </>
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

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center z-50">
      <div className="text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          POCKET INFINITY
        </h1>
        <p className="text-gray-400 mb-2 text-sm md:text-base">
          Inspired by Black Mirror: USS Callister
        </p>
        <p className="text-gray-500 mb-8 text-xs md:text-sm max-w-md mx-auto">
          Command your fearful crew. Warp to alien worlds. Destroy enemy drones.
        </p>
        
        <button
          onClick={onStart}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-lg font-bold text-xl transition-all hover:scale-105 shadow-lg shadow-cyan-500/30"
        >
          START GAME
        </button>
        
        <div className="mt-8 text-gray-600 text-xs">
          <div>Mobile: Touch controls enabled</div>
          <div>Desktop: WASD + Mouse</div>
        </div>
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
    return <StartScreen onStart={() => {
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
      </KeyboardControls>
    </div>
  );
}

export default App;
