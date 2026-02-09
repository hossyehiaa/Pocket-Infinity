import { useState, useEffect, useRef } from "react";
import { useGameState, PlanetParams } from "@/lib/stores/useGameState";

export function AIChat() {
    const { scene, crew, setPlanetParams, setScene } = useGameState();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState<{ sender: "user" | "natelle"; text: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle chat with 'T' key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "t") {
                e.preventDefault(); // Prevent typing 't' into other inputs if focused? 
                // Actually best to only prevent if not already focused in an input
                if (document.activeElement?.tagName !== "INPUT" && !isOpen) {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 10);
                } else if (isOpen && e.key === "Escape") {
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = message.trim();
        setHistory(prev => [...prev, { sender: "user", text: userMsg }]);
        setMessage("");

        // Simple keyword processing
        processMessage(userMsg);
    };

    const processMessage = (msg: string) => {
        const lowerMsg = msg.toLowerCase();

        // Check if near Natelle
        // We don't have direct access to "my player position" here easily unless we subscribe to store
        // But we can check if we are in Bridge scene.
        // For simplicity, let's assume if they are on the bridge, Natelle can "hear" them over coms or if close.
        // The requirement said "chat with the ai natelle ... to tell them take me to planet"

        if (scene !== "bridge") {
            setTimeout(() => {
                setHistory(prev => [...prev, { sender: "natelle", text: "I can't hear you, you're not on the Bridge." }]);
            }, 500);
            return;
        }

        if (lowerMsg.includes("planet") || (lowerMsg.includes("take me") && lowerMsg.includes("venus"))) {
            setTimeout(() => {
                setHistory(prev => [...prev, { sender: "natelle", text: "Understood. Plotting course for Venus. Hang tight." }]);

                // Trigger travel after a delay
                setTimeout(() => {
                    const venusParams: PlanetParams = {
                        groundColor: "#F4A460",
                        fogDensity: 0.03,
                        gravity: -8.9,
                        planetName: "Venus"
                    };
                    setPlanetParams(venusParams);
                    setScene("planet");
                    setIsOpen(false);
                }, 2000);

            }, 500);
        } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
            setTimeout(() => {
                setHistory(prev => [...prev, { sender: "natelle", text: "Greetings, Captain. Use this channel to request planetary transport." }]);
            }, 500);
        } else {
            setTimeout(() => {
                setHistory(prev => [...prev, { sender: "natelle", text: "I didn't catch that. Do you need to go to a planet?" }]);
            }, 500);
        }
    };

    if (!isOpen) {
        if (scene === "bridge") {
            return (
                <div className="fixed bottom-4 right-4 text-white/50 text-sm">
                    Press 'T' to contact Natelle
                </div>
            );
        }
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 w-80 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-lg flex flex-col overflow-hidden z-50">
            <div className="p-3 bg-cyan-900/20 border-b border-cyan-500/30 flex justify-between items-center">
                <span className="font-bold text-cyan-400">Coms: Natelle</span>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <div className="h-48 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
                {/* History reversed for "chat bottom-up" usually, or maintain order? */}
                {/* Let's render standard top-down but auto-scroll */}
                {[...history].reverse().map((msg, i) => (
                    <div key={i} className={`p-2 rounded max-w-[80%] text-sm ${msg.sender === "user" ? "bg-blue-600/30 ml-auto text-blue-100" : "bg-purple-600/30 mr-auto text-purple-100"}`}>
                        <div className="text-xs opacity-50 mb-1">{msg.sender === "user" ? "You" : "NatelleC0"}</div>
                        {msg.text}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-2 border-t border-cyan-500/30 bg-black/40">
                <input
                    ref={inputRef}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-gray-600 font-mono text-sm"
                    placeholder="Type your command..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
            </form>
        </div>
    );
}
