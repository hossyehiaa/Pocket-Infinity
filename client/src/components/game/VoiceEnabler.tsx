import { useState, useEffect } from "react";

let globalAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    (window as any).__audioContext = globalAudioContext;
  }
  return globalAudioContext;
}

export function VoiceEnabler() {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [statusText, setStatusText] = useState("🔇 Voice Disabled. Tap to Join");

  useEffect(() => {
    const ctx = getAudioContext();
    if (ctx.state === "running") {
      setIsVoiceActive(true);
      setShowButton(false);
    }
  }, []);

  const handleJoinVoice = async () => {
    console.log("🔊 User clicked Join Voice");
    
    try {
      const ctx = getAudioContext();
      
      if (ctx.state === "suspended") {
        await ctx.resume();
        console.log("🔊 AudioContext resumed");
      }

      const audioElements = document.querySelectorAll("audio");
      console.log(`🔊 Found ${audioElements.length} audio elements`);
      
      audioElements.forEach((audio, index) => {
        audio.muted = false;
        audio.play().then(() => {
          console.log(`🔊 Audio element ${index} playing`);
        }).catch((err) => {
          console.log(`🔊 Audio element ${index} play failed:`, err.message);
        });
      });

      setIsVoiceActive(true);
      setStatusText("🔊 Voice Active");

      setTimeout(() => {
        setShowButton(false);
      }, 2000);

    } catch (err) {
      console.error("🔊 Failed to enable voice:", err);
      setStatusText("❌ Voice Failed - Tap Again");
    }
  };

  if (!showButton) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
      <button
        onClick={handleJoinVoice}
        className={`px-6 py-3 rounded-xl font-bold text-lg shadow-xl transition-all ${
          isVoiceActive
            ? "bg-green-600 text-white shadow-green-500/30"
            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-red-500/30 animate-pulse hover:scale-105"
        }`}
      >
        {statusText}
      </button>
    </div>
  );
}
