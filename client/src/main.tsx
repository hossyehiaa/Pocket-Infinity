import { createRoot } from "react-dom/client";
import { insertCoin } from "playroomkit";
import App from "./App";
import { AudioManager } from "./components/game/AudioManager";
import "./index.css";
import { initAudio } from "./lib/sounds";
import VConsole from "vconsole";

console.log("🔊 AUDIO SYSTEM STARTING IN PROD");

// Initialize vConsole for mobile debugging
const vConsole = new VConsole();
console.log("📱 vConsole initialized - Green button available for debugging");

insertCoin({
  streamMode: true,
  skipLobby: false,
  matchmaking: true,
}).then(() => {
  console.log("🔊 AUDIO SYSTEM STARTED IN PROD - Playroom initialized");
  initAudio();
  createRoot(document.getElementById("root")!).render(
    <>
      <App />
      <AudioManager />
    </>
  );
});
