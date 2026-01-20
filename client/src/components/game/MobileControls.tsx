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
      <div
        ref={joystickRef}
        className="absolute left-4 bottom-4 w-32 h-32 pointer-events-auto"
        style={{ touchAction: "none" }}
      />

      <div
        ref={lookZoneRef}
        className="absolute right-0 top-0 w-1/2 h-2/3 pointer-events-auto"
        style={{ touchAction: "none" }}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
      />

      <div className="absolute right-4 bottom-4 flex flex-col gap-3 pointer-events-auto">
        <button
          className="w-16 h-16 rounded-full bg-blue-600/80 text-white font-bold text-sm shadow-lg active:bg-blue-700 border-2 border-blue-400"
          onPointerDown={handleJump}
          style={{ touchAction: "manipulation" }}
        >
          JUMP
        </button>

        {scene === "planet" && (
          <button
            className="w-16 h-16 rounded-full bg-red-600/80 text-white font-bold text-sm shadow-lg active:bg-red-700 border-2 border-red-400"
            onPointerDown={handleShoot}
            style={{ touchAction: "manipulation" }}
          >
            SHOOT
          </button>
        )}

        {scene === "bridge" && nearCrew && (
          <button
            className="w-16 h-16 rounded-full bg-green-600/80 text-white font-bold text-sm shadow-lg active:bg-green-700 border-2 border-green-400"
            onPointerDown={handleTalk}
            style={{ touchAction: "manipulation" }}
          >
            TALK
          </button>
        )}
      </div>

      <div className="absolute left-4 top-4 text-white text-xs bg-black/50 px-2 py-1 rounded pointer-events-none">
        {scene === "bridge" ? "USS Callister Bridge" : planetName}
      </div>
    </div>
  );
}
