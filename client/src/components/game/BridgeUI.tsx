import { useGameState, PlanetParams } from "@/lib/stores/useGameState";

export function BridgeUI() {
    const nearCrew = useGameState((state) => state.nearCrew);
    const setPlanetParams = useGameState((state) => state.setPlanetParams);
    const setScene = useGameState((state) => state.setScene);

    if (!nearCrew) return null;

    const destination = nearCrew.id === "walton" ? "Mars" : "Venus";
    const npcName = nearCrew.name;

    const handleInteract = () => {
        if (nearCrew.id === "walton") {
            // Travel to Mars
            const marsParams: PlanetParams = {
                groundColor: "#CD5C5C",
                fogDensity: 0.015,
                gravity: -3.7,
                planetName: "Mars"
            };
            setPlanetParams(marsParams);
            setScene("planet");
        } else if (nearCrew.id === "nanette") {
            // Travel to Venus
            const venusParams: PlanetParams = {
                groundColor: "#F4A460",
                fogDensity: 0.03,
                gravity: -8.9,
                planetName: "Venus"
            };
            setPlanetParams(venusParams);
            setScene("planet");
        }
    };

    return (
        <div
            style={{
                zIndex: 9999,
                position: 'fixed',
                bottom: '20%',
                left: '50%',
                transform: 'translate(-50%, 0)',
                pointerEvents: 'auto'
            }}
        >
            <div className="bg-gradient-to-r from-cyan-500/95 to-purple-600/95 backdrop-blur-md px-10 py-6 rounded-3xl shadow-2xl border-2 border-white/30">
                <div className="text-center">
                    <div className="text-white font-bold text-2xl mb-2">
                        🗣️ {npcName}
                    </div>
                    <div className="text-cyan-100 text-md mb-4">
                        Travel to <span className="font-bold text-white">{destination}</span>
                    </div>

                    {/* Large clickable button */}
                    <button
                        onClick={handleInteract}
                        className="group relative px-8 py-4 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 border-2 border-white/40"
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="flex items-center gap-3 justify-center">
                            <span>🚀 TALK</span>
                            <kbd className="px-2 py-1 bg-black/30 rounded text-sm font-mono">F</kbd>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl blur-lg bg-white opacity-20 group-hover:opacity-40 transition-opacity -z-10" />
                    </button>
                </div>
            </div>
        </div>
    );
}
