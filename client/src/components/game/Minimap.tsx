import { useGameState } from "@/lib/stores/useGameState";

const MAP_SIZE = 120;
const WORLD_RADIUS = 100;

function worldToMap(worldX: number, worldZ: number, playerX: number, playerZ: number): { x: number; y: number; isOutside: boolean } {
  const relX = worldX - playerX;
  const relZ = worldZ - playerZ;
  
  const distance = Math.sqrt(relX * relX + relZ * relZ);
  const isOutside = distance > WORLD_RADIUS;
  
  const clampedX = isOutside ? (relX / distance) * WORLD_RADIUS : relX;
  const clampedZ = isOutside ? (relZ / distance) * WORLD_RADIUS : relZ;
  
  const mapX = MAP_SIZE / 2 + (clampedX / WORLD_RADIUS) * (MAP_SIZE / 2);
  const mapY = MAP_SIZE / 2 + (clampedZ / WORLD_RADIUS) * (MAP_SIZE / 2);
  
  return { x: mapX, y: mapY, isOutside };
}

export function Minimap() {
  const { playerPosition, enemies, planetParams } = useGameState();
  const [px, , pz] = playerPosition;
  
  const shipPosition = worldToMap(0, 0, px, pz);
  
  return (
    <div 
      className="absolute top-20 left-4 pointer-events-none z-50"
      style={{
        width: MAP_SIZE,
        height: MAP_SIZE,
      }}
    >
      <div
        className="relative rounded-full overflow-hidden border-2 border-cyan-400/50"
        style={{
          width: MAP_SIZE,
          height: MAP_SIZE,
          background: `radial-gradient(circle, ${planetParams.groundColor}40 0%, ${planetParams.groundColor}20 50%, #00000080 100%)`,
          boxShadow: `0 0 20px ${planetParams.groundColor}40, inset 0 0 30px rgba(0,0,0,0.5)`,
        }}
      >
        <div 
          className="absolute rounded-full border border-cyan-400/20"
          style={{
            width: MAP_SIZE / 2,
            height: MAP_SIZE / 2,
            top: MAP_SIZE / 4,
            left: MAP_SIZE / 4,
          }}
        />
        
        <div 
          className="absolute rounded-full border border-cyan-400/10"
          style={{
            width: MAP_SIZE * 0.75,
            height: MAP_SIZE * 0.75,
            top: MAP_SIZE * 0.125,
            left: MAP_SIZE * 0.125,
          }}
        />

        {shipPosition && (
          <div
            className="absolute"
            style={{
              left: shipPosition.x - 6,
              top: shipPosition.y - 6,
              width: 12,
              height: 12,
            }}
          >
            <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-full h-full drop-shadow-lg">
              <path d="M12 2L4 12l8 3 8-3-8-10z" />
              <path d="M12 15l-8 3 8 4 8-4-8-3z" opacity="0.7" />
            </svg>
          </div>
        )}

        {enemies.map((enemy) => {
          const pos = worldToMap(enemy.position[0], enemy.position[2], px, pz);
          
          return (
            <div
              key={enemy.id}
              className={`absolute rounded-full ${pos.isOutside ? 'opacity-50' : 'animate-pulse'}`}
              style={{
                left: pos.x - 4,
                top: pos.y - 4,
                width: pos.isOutside ? 6 : 8,
                height: pos.isOutside ? 6 : 8,
                backgroundColor: '#ef4444',
                boxShadow: pos.isOutside ? 'none' : '0 0 6px #ef4444, 0 0 12px #ef444480',
              }}
            />
          );
        })}

        <div
          className="absolute rounded-full"
          style={{
            left: MAP_SIZE / 2 - 5,
            top: MAP_SIZE / 2 - 5,
            width: 10,
            height: 10,
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e, 0 0 16px #22c55e80',
            border: '2px solid #ffffff',
          }}
        />

        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="mt-1 flex justify-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-400">You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400">Enemy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-yellow-400">Ship</span>
        </div>
      </div>
    </div>
  );
}
