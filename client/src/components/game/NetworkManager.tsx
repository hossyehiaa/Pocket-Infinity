import { useEffect, useRef } from "react";
import { usePlayersList, myPlayer, isHost, onPlayerJoin, PlayerState, useMultiplayerState } from "playroomkit";
import { NetworkPlayer } from "./NetworkPlayer";
import { useGameState, PlanetParams } from "@/lib/stores/useGameState";

const PLAYER_COLORS = [
  "#4a90d9",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e91e63",
  "#00bcd4",
];

export function NetworkManager() {
  const players = usePlayersList();
  const { scene, setScene, planetParams, setPlanetParams } = useGameState();
  const lastSyncedScene = useRef<string | null>(null);
  const lastSyncedParams = useRef<string | null>(null);

  const [networkScene] = useMultiplayerState("gameScene", "bridge");
  const [networkWorldTheme] = useMultiplayerState("worldTheme", null);

  useEffect(() => {
    if (isHost()) return;
    
    if (networkScene && networkScene !== lastSyncedScene.current) {
      lastSyncedScene.current = networkScene;
      if (networkScene !== scene) {
        setScene(networkScene as "bridge" | "planet");
      }
    }
  }, [networkScene, scene, setScene]);

  useEffect(() => {
    if (isHost()) return;
    
    if (networkWorldTheme) {
      const themeStr = JSON.stringify(networkWorldTheme);
      if (themeStr !== lastSyncedParams.current) {
        lastSyncedParams.current = themeStr;
        setPlanetParams(networkWorldTheme as PlanetParams);
      }
    }
  }, [networkWorldTheme, setPlanetParams]);

  useEffect(() => {
    let playerCount = 0;
    
    const cleanup = onPlayerJoin((player) => {
      const color = PLAYER_COLORS[playerCount % PLAYER_COLORS.length];
      player.setState("color", color);
      playerCount++;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const me = myPlayer();

  return (
    <>
      {players
        .filter((p: PlayerState) => p.id !== me?.id)
        .map((player: PlayerState) => (
          <NetworkPlayer key={player.id} player={player} />
        ))}
    </>
  );
}
