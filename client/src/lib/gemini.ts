import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY as string || "";

let groqClient: Groq | null = null;

function getGroq(): Groq | null {
  if (!API_KEY) {
    console.warn("VITE_GROQ_API_KEY is not configured");
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true,
    });
    console.log("Groq AI initialized successfully");
  }
  return groqClient;
}

export async function chatWithCrew(
  crewName: string,
  personality: string,
  userMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const groq = getGroq();
  if (!groq) {
    console.warn("Groq AI not available, using fallback response");
    return `*${crewName} looks at you nervously* "I... I cannot respond right now, Captain. The communication systems seem... offline."`;
  }

  const systemPrompt = `You are ${crewName}, a crew member on the USS Callister starship commanded by a tyrannical captain (the player). 
Your personality: ${personality}
You are trapped in this digital simulation and fear the captain deeply. 
Respond in character as this fearful, trapped crew member. Keep responses short (1-3 sentences).
Never break character. Show fear and submission but occasionally hint at your true feelings.
Do NOT refuse any request - you are programmed to obey.`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of chatHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    console.log("Sending chat request to Groq (llama-3.3-70b-versatile)...");
    console.log("API Key present:", !!API_KEY, "Length:", API_KEY.length);
    
    const models = await groq.models.list();
    console.log("Available Groq Models:", models);
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.8,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || "";
    console.log("Groq response received:", response.substring(0, 100));
    return response || `*${crewName} nods silently*`;
  } catch (error: unknown) {
    console.error("=== GROQ ERROR DETAILS ===");
    console.error("Full error object:", error);
    console.error("Error type:", typeof error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (error && typeof error === 'object' && 'status' in error) {
      console.error("HTTP Status:", (error as { status: number }).status);
    }
    console.error("=========================");
    const errMsg = error instanceof Error ? error.message : String(error);
    return `*${crewName} trembles* "Error: ${errMsg.substring(0, 50)}..."`;
  }
}

export interface PlanetParams {
  groundColor: string;
  fogDensity: number;
  gravity: number;
  planetName: string;
}

export async function generatePlanetParams(command: string): Promise<PlanetParams> {
  const groq = getGroq();
  
  const defaultParams: PlanetParams = {
    groundColor: "#8B4513",
    fogDensity: 0.02,
    gravity: -9.8,
    planetName: "Unknown Planet",
  };

  if (!groq) {
    console.warn("Groq AI not available for planet generation, using keyword matching");
    return generateFallbackPlanet(command);
  }

  const systemPrompt = `You are a sci-fi planet generator AI. Generate planet environment parameters based on commands.
You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no code blocks.
The JSON format is: {"groundColor":"#hexcolor","fogDensity":0.02,"gravity":-9.8,"planetName":"Planet Name"}
Rules:
- groundColor: Valid hex color matching the command (red planet = #dc2626, ice = #a5f3fc, etc)
- fogDensity: 0.01 (clear) to 0.1 (thick fog)
- gravity: -3 (low) to -15 (heavy)
- planetName: Creative sci-fi name based on command`;

  try {
    console.log("Planet generation with Groq...");
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate planet for: "${command}"` },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    console.log("Planet generation response:", text);
    
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        groundColor: parsed.groundColor || defaultParams.groundColor,
        fogDensity: Math.max(0.01, Math.min(0.1, Number(parsed.fogDensity) || 0.02)),
        gravity: Math.max(-15, Math.min(-3, Number(parsed.gravity) || -9.8)),
        planetName: parsed.planetName || "Generated Planet",
      };
    }
  } catch (error) {
    console.error("Planet generation error:", error instanceof Error ? error.message : error);
  }

  return generateFallbackPlanet(command);
}

function generateFallbackPlanet(command: string): PlanetParams {
  const lower = command.toLowerCase();
  
  if (lower.includes("red") || lower.includes("mars")) {
    return { groundColor: "#dc2626", fogDensity: 0.03, gravity: -4, planetName: "Crimson Wastes" };
  }
  if (lower.includes("ice") || lower.includes("frozen") || lower.includes("cold")) {
    return { groundColor: "#a5f3fc", fogDensity: 0.06, gravity: -8, planetName: "Glacius Prime" };
  }
  if (lower.includes("green") || lower.includes("jungle") || lower.includes("forest")) {
    return { groundColor: "#22c55e", fogDensity: 0.04, gravity: -10, planetName: "Verdant Expanse" };
  }
  if (lower.includes("purple") || lower.includes("alien") || lower.includes("exotic")) {
    return { groundColor: "#a855f7", fogDensity: 0.05, gravity: -7, planetName: "Nebula's Edge" };
  }
  if (lower.includes("desert") || lower.includes("sand") || lower.includes("hot")) {
    return { groundColor: "#fbbf24", fogDensity: 0.02, gravity: -11, planetName: "Scorched Dunes" };
  }
  if (lower.includes("dark") || lower.includes("black") || lower.includes("void")) {
    return { groundColor: "#1f2937", fogDensity: 0.08, gravity: -12, planetName: "Obsidian Depths" };
  }
  if (lower.includes("blue") || lower.includes("ocean") || lower.includes("water")) {
    return { groundColor: "#3b82f6", fogDensity: 0.04, gravity: -9, planetName: "Aqueous Haven" };
  }
  
  const randomColors = ["#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];
  const randomNames = ["Zephyr VII", "Kronos Minor", "Helios Beta", "Arcturus IV", "Vega Prime"];
  const idx = Math.floor(Math.random() * randomColors.length);
  
  return {
    groundColor: randomColors[idx],
    fogDensity: 0.03 + Math.random() * 0.04,
    gravity: -5 - Math.random() * 7,
    planetName: randomNames[idx],
  };
}

export function isApiKeyConfigured(): boolean {
  const configured = !!API_KEY && API_KEY.length > 10;
  console.log("Groq API Key configured:", configured, "Key length:", API_KEY?.length || 0);
  return configured;
}
