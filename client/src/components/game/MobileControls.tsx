import { useEffect, useRef, useCallback } from "react";
import nipplejs from "nipplejs";
import { useControls } from "@/lib/stores/useControls";
import { useGameState } from "@/lib/stores/useGameState";

interface MobileControlsProps {
  onTalkPress?: () => void;
}

export function MobileControls({ onTalkPress }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const joystickInstance = useRef<nipplejs.JoystickManager | null>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const { setMove, setLook, setJump, setShoot, setTalk } = useControls();
  const { scene, nearCrew, setChatOpen } = useGameState();

  useEffect(() => {
    if (!joystickRef.current) return;

    if (joystickInstance.current) {
      joystickInstance.current.destroy();
    }

    joystickInstance.current = nipplejs.create({
      zone: joystickRef.current,
      mode: "static",
      color: "rgba(255, 255, 255, 0.5)",
      size: 120,
      position: { left: "50%", top: "50%" },
    });

    joystickInstance.current.on("move", (_evt, data) => {
      if (data.vector) {
        // Negate Y to fix inversion: UP = forward, DOWN = backward
        setMove(data.vector.x, -data.vector.y);
      }
    });

    joystickInstance.current.on("end", () => {
      setMove(0, 0);
    });

    return () => {
      if (joystickInstance.current) {
        joystickInstance.current.destroy();
        joystickInstance.current = null;
      }
    };
  }, [setMove]);

  const handleLookStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    const touch = e.touches[0];
    const deltaX = (touch.clientX - lastTouch.current.x) * 0.01;
    const deltaY = (touch.clientY - lastTouch.current.y) * 0.01;
    setLook(deltaX, deltaY);
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  }, [setLook]);

  const handleLookEnd = useCallback(() => {
    lastTouch.current = null;
    setLook(0, 0);
  }, [setLook]);

  const handleJump = useCallback(() => {
    setJump(true);
    setTimeout(() => setJump(false), 100);
  }, [setJump]);

  const handleShoot = useCallback(() => {
    setShoot(true);
    setTimeout(() => setShoot(false), 100);
  }, [setShoot]);

  const handleTalk = useCallback(() => {
    if (nearCrew) {
      setChatOpen(true);
      onTalkPress?.();
    }
    setTalk(true);
    setTimeout(() => setTalk(false), 100);
  }, [setTalk, nearCrew, setChatOpen, onTalkPress]);

  const planetName = useGameState.getState().planetParams.planetName;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* JOYSTICK - Bottom Left (PUBG Style) */}
      <div
        ref={joystickRef}
        className="absolute left-8 bottom-24 w-32 h-32 pointer-events-auto"
        style={{ touchAction: "none" }}
      />

      {/* LOOK ZONE - Right side majority */}
      <div
        ref={lookZoneRef}
        className="absolute right-0 top-0 w-3/5 h-full pointer-events-auto"
        style={{ touchAction: "none" }}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
      />

      {/* ACTION BUTTONS - Bottom Right (PUBG Arc Layout) */}
      <div className="absolute right-4 bottom-16 pointer-events-auto">
        <div className="relative w-48 h-48">
          {/* JUMP Button - Top Right of Arc */}
          <button
            className="absolute right-4 top-8 w-20 h-20 rounded-full bg-blue-500/40 backdrop-blur-md text-white font-bold text-sm shadow-2xl active:bg-blue-600/60 border-2 border-white/30"
            onPointerDown={handleJump}
            style={{ touchAction: "manipulation" }}
          >
            <div className="text-2xl">⬆️</div>
            <div className="text-xs mt-1">JUMP</div>
          </button>

          {/* SHOOT Button - Right side of arc */}
          {scene === "planet" && (
            <button
              className="absolute right-0 bottom-12 w-24 h-24 rounded-full bg-red-500/40 backdrop-blur-md text-white font-bold shadow-2xl active:bg-red-600/60 border-2 border-white/30"
              onPointerDown={handleShoot}
              style={{ touchAction: "manipulation" }}
            >
              <div className="text-3xl">🎯</div>
              <div className="text-sm mt-1">FIRE</div>
            </button>
          )}

          {/* TALK Button - Bottom of arc */}
          {scene === "bridge" && nearCrew && (
            <button
              className="absolute right-12 bottom-0 w-20 h-20 rounded-full bg-green-500/40 backdrop-blur-md text-white font-bold text-sm shadow-2xl active:bg-green-600/60 border-2 border-white/30"
              onPointerDown={handleTalk}
              style={{ touchAction: "manipulation" }}
            >
              <div className="text-2xl">💬</div>
              <div className="text-xs mt-1">TALK</div>
            </button>
          )}
        </div>
      </div>

      {/* HUD INFO - Top Left (PUBG Style) */}
      <div className="absolute left-4 top-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="text-white text-sm font-bold">
            {scene === "bridge" ? "🚀 USS Callister" : `🌍 ${planetName}`}
          </div>
        </div>
      </div>

      {/* SETTINGS ICON - Top Right (Minimalist) */}
      <div className="absolute right-4 top-4 pointer-events-auto">
        <button className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xl hover:bg-black/70">
          ⚙️
        </button>
      </div>
    </div>
  );
}
