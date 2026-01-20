import { useState, useEffect, useMemo } from "react";
import { useGameState, WEAPONS, WeaponType } from "@/lib/stores/useGameState";
import { useRaceStore } from "@/lib/stores/useRaceStore";
import { setMuted, getMuted, initAudio } from "@/lib/sounds";
import { isHost, setState as setRoomState, usePlayersList, getRoomCode, myPlayer } from "playroomkit";
import { Minimap } from "./Minimap";

const FEEDBACK_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdCXljRXq6JHMK9chpNYQOArznD6s836dNp_Y93uIGra8EJoA/viewform";
const ZONE_SHRINK_DURATION = 120000;

const WeaponIcon = ({ type, isActive }: { type: WeaponType; isActive: boolean }) => {
  const icons: Record<WeaponType, JSX.Element> = {
    blaster: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="2" y="10" width="16" height="4" rx="1" />
        <rect x="14" y="8" width="8" height="8" rx="1" />
      </svg>
    ),
    shotgun: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="2" y="10" width="20" height="4" rx="1" />
        <rect x="2" y="8" width="6" height="2" rx="1" />
        <rect x="2" y="14" width="6" height="2" rx="1" />
      </svg>
    ),
    sniper: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="2" y="11" width="22" height="2" rx="1" />
        <circle cx="18" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="18" y1="8" x2="18" y2="16" stroke="currentColor" strokeWidth="1" />
        <line x1="14" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  };

  return (
    <div className={`p-2 rounded-lg border-2 transition-all ${isActive ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-600 bg-gray-800/50'}`}>
      {icons[type]}
    </div>
  );
};

export function GameUI() {
  const {
    scene, score, playerHealth, planetParams, isWarping, nearCrew, isMobile,
    setScene, setChatOpen, isGameOver, showDamageFlash, resetGame,
    isMicMuted, setMicMuted, currentWeapon, setWeapon, isOnHoverboard,
    zone, nearVehicle, isInVehicle
  } = useGameState();
  const [zoneTimeLeft, setZoneTimeLeft] = useState(120);
  const [isMutedState, setIsMutedState] = useState(getMuted());
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const players = usePlayersList();
  const playerCount = players?.length || 1;

  useEffect(() => {
    const updateRoomCode = () => {
      const code = getRoomCode();
      setRoomCode(code || null);
    };

    updateRoomCode();
    const interval = setInterval(updateRoomCode, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleMic = () => {
    const newMicMuted = !isMicMuted;
    setMicMuted(newMicMuted);

    const me = myPlayer();
    if (me) {
      me.setState("micMuted", newMicMuted);
    }
  };

  const openFeedback = () => {
    window.open(FEEDBACK_URL, '_blank');
  };

  const toggleMute = () => {
    initAudio();
    const newMuted = !isMutedState;
    setMuted(newMuted);
    setIsMutedState(newMuted);
  };

  const handleRespawn = () => {
    resetGame();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {showDamageFlash && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(255, 0, 0, 0.6) 100%)',
              animation: 'damageFlash 0.2s ease-out'
            }}
          />
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-500 mb-4 animate-pulse">GAME OVER</h1>
            <div className="text-2xl text-gray-300 mb-2">FINAL SCORE</div>
            <div className="text-5xl font-bold text-green-400 mb-8">{score}</div>
            <button
              onClick={handleRespawn}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-lg font-bold text-xl transition-all hover:scale-105 shadow-lg shadow-cyan-500/30"
            >
              RESPAWN
            </button>
          </div>
        </div>
      )}

      {/* Race Mode: QUALIFIED Screen */}
      {scene === "race" && useRaceStore.getState().playerQualified && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-emerald-500/90 flex items-center justify-center pointer-events-auto z-50 animate-fade-in">
          <div className="text-center">
            <div className="text-9xl font-black text-white mb-8 animate-bounce drop-shadow-2xl">
              QUALIFIED!
            </div>
            <div className="text-4xl text-white/90 mb-4">
              Position: {useRaceStore.getState().playerFinishPosition} / 10
            </div>
            <div className="text-2xl text-white/80 mb-8">
              You made it to the next round!
            </div>
            <button
              onClick={() => {
                useRaceStore.getState().resetRace();
                setScene("bridge");
              }}
              className="bg-white hover:bg-gray-100 text-green-600 px-12 py-5 rounded-full font-bold text-2xl transition-all hover:scale-105 shadow-2xl"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Race Mode: ELIMINATED Screen */}
      {scene === "race" && useRaceStore.getState().playerEliminated && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-rose-500/90 flex items-center justify-center pointer-events-auto z-50 animate-fade-in">
          <div className="text-center">
            <div className="text-9xl font-black text-white mb-8 drop-shadow-2xl">
              ELIMINATED!
            </div>
            <div className="text-4xl text-white/90 mb-4">
              Position: {useRaceStore.getState().playerFinishPosition} / 10
            </div>
            <div className="text-2xl text-white/80 mb-8">
              Better luck next time!
            </div>
            <button
              onClick={() => {
                useRaceStore.getState().resetRace();
                setScene("bridge");
              }}
              className="bg-white hover:bg-gray-100 text-red-600 px-12 py-5 rounded-full font-bold text-2xl transition-all hover:scale-105 shadow-2xl"
            >
              RETURN TO LOBBY
            </button>
          </div>
        </div>
      )}

      {scene === "planet" && !isGameOver && (
        <>
          {isHost() && (
            <button
              className="absolute top-4 left-4 bg-cyan-600/80 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold pointer-events-auto z-50"
              onClick={() => {
                setScene("bridge");
                setRoomState("gameScene", "bridge");
              }}
            >
              ← Return to Bridge
            </button>
          )}

          <Minimap />

          {zone.isActive && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-blue-900/80 border-2 border-blue-400 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-blue-300 mb-1">ZONE SHRINKING</div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.floor((ZONE_SHRINK_DURATION - (Date.now() - zone.startTime)) / 1000)}s
                </div>
                <div className="text-xs text-gray-400 mt-1">Radius: {Math.round(zone.radius)}m</div>
              </div>
            </div>
          )}

          <div className="absolute top-[180px] left-4 pointer-events-none">
            <div className="text-xs text-gray-400 mb-1">HEALTH</div>
            <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${playerHealth}%`,
                  background: playerHealth > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' :
                    playerHealth > 25 ? 'linear-gradient(90deg, #eab308, #facc15)' :
                      'linear-gradient(90deg, #dc2626, #ef4444)'
                }}
              />
            </div>
            <div className="text-white font-bold text-sm mt-1">{playerHealth} / 100</div>
          </div>

          <div className="absolute top-4 right-4 pointer-events-none text-right">
            <div className="text-xs text-gray-400 mb-1">{planetParams.planetName}</div>
            <div className="text-xs text-gray-400">SCORE</div>
            <div className="text-3xl font-bold text-green-400">{score}</div>
          </div>

          <div className="absolute bottom-24 right-4 pointer-events-auto">
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-400 text-center mb-1">WEAPONS (1-3)</div>
              <div className="flex gap-2">
                {(["blaster", "shotgun", "sniper"] as WeaponType[]).map((weapon, i) => (
                  <button
                    key={weapon}
                    onClick={() => setWeapon(weapon)}
                    className="relative"
                    title={`${WEAPONS[weapon].name} (${i + 1})`}
                  >
                    <WeaponIcon type={weapon} isActive={currentWeapon === weapon} />
                    <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
              <div className="text-center text-xs text-cyan-400 font-bold mt-1">
                {WEAPONS[currentWeapon].name}
              </div>
            </div>
          </div>

          {isOnHoverboard && (
            <div className="absolute bottom-24 left-4 bg-cyan-600/80 text-white px-3 py-2 rounded-lg pointer-events-none">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <ellipse cx="12" cy="18" rx="10" ry="3" />
                  <ellipse cx="12" cy="17" rx="8" ry="2" fill="#00ffff" />
                </svg>
                <span className="text-sm font-bold">HOVERBOARD (V to dismount)</span>
              </div>
            </div>
          )}

          {isInVehicle && (
            <div className="absolute bottom-24 left-4 bg-blue-700/80 text-white px-3 py-2 rounded-lg pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏍️</span>
                <span className="text-sm font-bold">SPACE BIKE (F to exit)</span>
              </div>
            </div>
          )}

          {nearVehicle && !isInVehicle && (
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-8 pointer-events-none">
              <div className="bg-blue-600/90 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
                Press F to Drive
              </div>
            </div>
          )}

          {/* Crosshair - exact center of screen */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative w-8 h-8">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 bg-white opacity-80">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 w-3 h-0.5 bg-transparent" />
              </div>
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full w-0.5 bg-white opacity-80">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-0.5 bg-transparent" />
              </div>
            </div>
          </div>

          {/* Mobile Shoot Button */}
          {isMobile && (
            <div className="absolute bottom-24 right-24 pointer-events-auto">
              <button
                className="w-20 h-20 rounded-full bg-red-600/80 hover:bg-red-500 active:bg-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 border-4 border-white/30 transition-all"
                onPointerDown={() => {
                  // Trigger shoot via controls
                  const shootEvent = new KeyboardEvent('keydown', { key: ' ' });
                  window.dispatchEvent(shootEvent);
                }}
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2L12 8M12 16L12 22M2 12L8 12M16 12L22 12" stroke="white" strokeWidth="2" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {scene === "bridge" && nearCrew && !isMobile && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            className="bg-green-600/80 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg animate-pulse"
            onClick={() => setChatOpen(true)}
          >
            Talk to {nearCrew.name}
          </button>
        </div>
      )}

      {isWarping && (
        <div className="absolute inset-0 bg-black flex items-center justify-center pointer-events-auto">
          <div className="text-center">
            <div className="text-4xl text-cyan-400 font-bold animate-pulse">
              WARPING...
            </div>
            <div className="mt-4 w-48 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-cyan-400 animate-[warp_2s_ease-in-out]" />
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs p-2 rounded pointer-events-none">
          <div className="text-gray-400 mb-1">CONTROLS</div>
          <div>WASD - Move</div>
          <div>SPACE - Jump</div>
          {scene === "planet" && (
            <>
              <div>K - Shoot</div>
              <div>1/2/3 - Switch Weapon</div>
              <div>V - Hoverboard</div>
            </>
          )}
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-900/80 text-white px-4 py-2 rounded-lg pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-bold">{playerCount} Player{playerCount !== 1 ? 's' : ''}</span>
          </div>
          {roomCode && (
            <div className="text-xs text-purple-300">
              Room: {roomCode}
            </div>
          )}
          <button
            onClick={openFeedback}
            className="text-xs bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded transition-colors"
          >
            📝 Feedback
          </button>
        </div>
      </div>

      <button
        onClick={toggleMic}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto transition-all z-50 ${isMicMuted
          ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/30'
          : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/30'
          }`}
        title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMicMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto transition-colors z-50"
        title={isMutedState ? "Unmute Sound" : "Mute Sound"}
      >
        {isMutedState ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes warp {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes damageFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
