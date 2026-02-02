import { createRoot } from "react-dom/client";
import { insertCoin } from "playroomkit";
import App from "./App";
import { AudioManager } from "./components/game/AudioManager";
import "./index.css";
import { initAudio } from "./lib/sounds";

console.log("🔊 AUDIO SYSTEM STARTING IN PROD");

insertCoin({
  skipLobby: true,
  defaultPlayerStates: {
    name: "Player1"
  }
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
