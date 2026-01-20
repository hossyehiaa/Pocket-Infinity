import { useState, useRef, useEffect } from "react";
import { useGameState, PlanetParams } from "@/lib/stores/useGameState";
import { chatWithCrew, generatePlanetParams, isApiKeyConfigured } from "@/lib/gemini";
import { playWarpDrive, playTalk } from "@/lib/sounds";
import { isHost, setState as setRoomState } from "playroomkit";

export function ChatDialog() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    chatOpen,
    setChatOpen,
    nearCrew,
    chatMessages,
    addChatMessage,
    clearChat,
    setWarping,
    setPlanetParams,
    setScene,
  } = useGameState();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleClose = () => {
    setChatOpen(false);
    clearChat();
  };

  const handleSend = async () => {
    if (!input.trim() || !nearCrew || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addChatMessage("user", userMessage);
    setIsLoading(true);

    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("warp") || lowerMessage.includes("go to") || lowerMessage.includes("take me to")) {
      addChatMessage("assistant", `*${nearCrew.name} nervously operates the console* "Y-yes Captain... initiating warp sequence..."`);
      
      setWarping(true);
      playWarpDrive();
      
      try {
        const params = await generatePlanetParams(userMessage);
        
        setTimeout(() => {
          setPlanetParams(params);
          setScene("planet");
          setWarping(false);
          setChatOpen(false);
          clearChat();
          
          if (isHost()) {
            setRoomState("gameScene", "planet", true);
            setRoomState("worldTheme", params, true);
          }
        }, 2000);
      } catch (error) {
        console.error("Warp error:", error);
        setWarping(false);
        addChatMessage("assistant", `*${nearCrew.name} looks panicked* "I-I'm sorry Captain, the warp drive malfunctioned!"`);
      }
      
      setIsLoading(false);
      return;
    }

    try {
      const response = await chatWithCrew(
        nearCrew.name,
        nearCrew.personality,
        userMessage,
        chatMessages
      );
      addChatMessage("assistant", response);
      playTalk();
    } catch (error) {
      console.error("Chat error:", error);
      addChatMessage("assistant", `*${nearCrew.name} looks down nervously* "I... I'm sorry, Captain."`);
    }

    setIsLoading(false);
  };

  if (!chatOpen || !nearCrew) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      
      <div className="relative bg-gray-900/95 border border-cyan-500/50 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: nearCrew.name === "Walton" ? "#22c55e" : "#ec4899" }}
            />
            <span className="text-cyan-400 font-bold">{nearCrew.name}</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {!isApiKeyConfigured() && (
            <div className="text-yellow-500 text-sm bg-yellow-500/10 p-2 rounded">
              Note: AI responses are limited. Add VITE_GOOGLE_API_KEY for full AI chat.
            </div>
          )}
          
          {chatMessages.length === 0 && (
            <div className="text-gray-500 text-sm italic">
              *{nearCrew.name} stands nervously, awaiting your command, Captain.*
              <br /><br />
              <span className="text-cyan-400">Tip: Say "Warp to [planet name]" to explore!</span>
            </div>
          )}
          
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                msg.role === "user"
                  ? "bg-cyan-900/50 text-cyan-100 ml-8"
                  : "bg-gray-800/50 text-gray-200 mr-8"
              }`}
            >
              <span className="text-xs text-gray-500 block mb-1">
                {msg.role === "user" ? "Captain" : nearCrew.name}
              </span>
              {msg.content}
            </div>
          ))}
          
          {isLoading && (
            <div className="text-gray-400 italic">
              *{nearCrew.name} is thinking...*
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-cyan-500/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Command your crew..."
              className="flex-1 bg-gray-800 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 px-4 py-2 rounded text-white font-bold transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
