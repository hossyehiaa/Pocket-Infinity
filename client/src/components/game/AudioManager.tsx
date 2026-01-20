import { useEffect, useRef, useCallback, useState, createContext, useContext } from "react";
import { usePlayersList, myPlayer, onPlayerJoin, PlayerState, RPC } from "playroomkit";
import { useGameState } from "@/lib/stores/useGameState";

interface PeerConnection {
  pc: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

interface AudioStatus {
  micActive: boolean;
  micMuted: boolean;
  connectionState: "disconnected" | "connecting" | "connected";
  audioContextState: "suspended" | "running" | "closed";
  peerCount: number;
}

interface AudioManagerContextType {
  status: AudioStatus;
  resetComms: () => Promise<void>;
}

const AudioManagerContext = createContext<AudioManagerContextType | null>(null);

export function useAudioManager() {
  return useContext(AudioManagerContext);
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
];

let audioElements: HTMLAudioElement[] = [];
let audioUnlocked = false;
let audioUnlockListeners: (() => void)[] = [];

function clearAudioElements() {
  audioElements.forEach(el => {
    el.srcObject = null;
    el.remove();
  });
  audioElements = [];
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export function onAudioUnlock(callback: () => void) {
  if (audioUnlocked) {
    callback();
  } else {
    audioUnlockListeners.push(callback);
  }
}

export function forceUnlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  console.log("🔊 Force unlocking all audio elements...");
  
  audioElements.forEach(audio => {
    audio.play().catch(() => {});
  });
  
  audioUnlockListeners.forEach(cb => cb());
  audioUnlockListeners = [];
}

function VoiceChatCore({ onStatusChange }: { onStatusChange: (status: Partial<AudioStatus>) => void }) {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const pendingOffersRef = useRef<Set<string>>(new Set());
  const players = usePlayersList();
  const me = myPlayer();
  const { isMicMuted } = useGameState();
  const resetFlagRef = useRef(0);

  const createPeerConnection = useCallback((playerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    const audioElement = document.createElement("audio");
    audioElement.autoplay = false;
    audioElement.setAttribute("playsinline", "true");
    audioElement.setAttribute("webkit-playsinline", "true");
    audioElement.muted = false;
    audioElement.id = `audio-${playerId}`;
    audioElement.dataset.voicechat = "true";
    document.body.appendChild(audioElement);
    audioElements.push(audioElement);

    pc.ontrack = (event) => {
      console.log("🔊 Received audio track from", playerId);
      if (event.streams[0]) {
        audioElement.srcObject = event.streams[0];
        audioElement.play().catch((e) => {
          console.log("🔊 Autoplay blocked, waiting for user interaction");
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        RPC.call("voiceIceCandidate", {
          targetId: playerId,
          candidate: event.candidate.toJSON(),
        }, RPC.Mode.ALL);
      }
    };

    pc.onconnectionstatechange = () => {
      const states = Array.from(peerConnectionsRef.current.values()).map(p => p.pc.connectionState);
      if (states.some(s => s === "connected")) {
        onStatusChange({ connectionState: "connected" });
      } else if (states.some(s => s === "connecting")) {
        onStatusChange({ connectionState: "connecting" });
      } else {
        onStatusChange({ connectionState: "disconnected" });
      }
      onStatusChange({ peerCount: peerConnectionsRef.current.size });
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(playerId, { pc, audioElement });
    onStatusChange({ peerCount: peerConnectionsRef.current.size });
    return pc;
  }, [onStatusChange]);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      onStatusChange({ micActive: true });
      console.log("🎤 Microphone access granted");
      return stream;
    } catch (err) {
      console.log("🎤 Microphone access denied or not available");
      onStatusChange({ micActive: false });
      return null;
    }
  }, [onStatusChange]);

  const initiateCall = useCallback(async (playerId: string) => {
    if (pendingOffersRef.current.has(playerId)) return;
    pendingOffersRef.current.add(playerId);
    
    if (!localStreamRef.current) {
      await initLocalStream();
    }
    
    const pc = createPeerConnection(playerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log("🔊 Sending voice offer to", playerId);
    RPC.call("voiceOffer", {
      targetId: playerId,
      offer: pc.localDescription?.toJSON(),
    }, RPC.Mode.ALL);
  }, [createPeerConnection, initLocalStream]);

  const cleanup = useCallback(() => {
    peerConnectionsRef.current.forEach(({ pc, audioElement }) => {
      pc.close();
      audioElement.srcObject = null;
      audioElement.remove();
    });
    peerConnectionsRef.current.clear();
    pendingOffersRef.current.clear();
    clearAudioElements();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    onStatusChange({ micActive: false, connectionState: "disconnected", peerCount: 0 });
  }, [onStatusChange]);

  const resetComms = useCallback(async () => {
    console.log("🔄 Resetting voice communications...");
    resetFlagRef.current++;
    cleanup();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await initLocalStream();
    
    if (players && me) {
      for (const player of players) {
        if (player.id !== me.id) {
          await initiateCall(player.id);
        }
      }
    }
    console.log("🔄 Voice communications reset complete");
  }, [cleanup, initLocalStream, players, me, initiateCall]);

  useEffect(() => {
    (window as any).__resetVoiceComms = resetComms;
  }, [resetComms]);

  useEffect(() => {
    initLocalStream();

    RPC.register("voiceOffer", async (data, sender) => {
      if (data.targetId !== me?.id) return;
      
      if (!localStreamRef.current) {
        await initLocalStream();
      }

      let peerData = peerConnectionsRef.current.get(sender.id);
      if (!peerData) {
        createPeerConnection(sender.id);
        peerData = peerConnectionsRef.current.get(sender.id);
      }
      
      if (peerData) {
        await peerData.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerData.pc.createAnswer();
        await peerData.pc.setLocalDescription(answer);

        RPC.call("voiceAnswer", {
          targetId: sender.id,
          answer: peerData.pc.localDescription?.toJSON(),
        }, RPC.Mode.ALL);
      }
    });

    RPC.register("voiceAnswer", async (data, sender) => {
      if (data.targetId !== me?.id) return;
      
      const peerData = peerConnectionsRef.current.get(sender.id);
      if (peerData && peerData.pc.signalingState === "have-local-offer") {
        console.log("🔊 Received voice answer from", sender.id);
        await peerData.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        pendingOffersRef.current.delete(sender.id);
      }
    });

    RPC.register("voiceIceCandidate", async (data, sender) => {
      if (data.targetId !== me?.id) return;
      
      const peerData = peerConnectionsRef.current.get(sender.id);
      if (peerData && data.candidate) {
        try {
          await peerData.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {}
      }
    });

    return cleanup;
  }, [me?.id, createPeerConnection, initLocalStream, cleanup]);

  useEffect(() => {
    const cleanupJoin = onPlayerJoin((player) => {
      if (player.id !== me?.id) {
        setTimeout(() => {
          initiateCall(player.id);
        }, 1000);
      }
    });

    return () => {
      if (cleanupJoin) cleanupJoin();
    };
  }, [me?.id, initiateCall]);

  useEffect(() => {
    if (!me) return;
    
    players.forEach((player: PlayerState) => {
      if (player.id !== me.id && !peerConnectionsRef.current.has(player.id)) {
        initiateCall(player.id);
      }
    });
  }, [players, me, initiateCall]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicMuted;
      });
    }
    onStatusChange({ micMuted: isMicMuted });
  }, [isMicMuted, onStatusChange]);

  return null;
}

function CommsPanel({ status, onReset }: { status: AudioStatus; onReset: () => void }) {
  const [isResetting, setIsResetting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await onReset();
    setTimeout(() => setIsResetting(false), 1000);
  };

  const micIcon = status.micActive && !status.micMuted ? "🟢" : status.micActive ? "🟡" : "🔴";
  const connectionIcon = status.connectionState === "connected" ? "🟢" : status.connectionState === "connecting" ? "🟡" : "🔴";
  const audioIcon = status.audioContextState === "running" ? "🟢" : status.audioContextState === "suspended" ? "🟡" : "🔴";

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <span>{micIcon}</span>
        <span className="text-gray-400">COMMS</span>
        <span className="text-gray-500">{expanded ? "▼" : "▲"}</span>
      </button>
      
      {expanded && (
        <div className="absolute bottom-12 right-0 bg-gray-900/95 border border-gray-700 rounded-lg p-3 min-w-[200px] shadow-xl">
          <div className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">
            VOICE DIAGNOSTICS
          </div>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mic Status:</span>
              <span className="flex items-center gap-1">
                {micIcon}
                <span className={status.micActive ? (status.micMuted ? "text-yellow-400" : "text-green-400") : "text-red-400"}>
                  {status.micActive ? (status.micMuted ? "Muted" : "Active") : "Off"}
                </span>
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Connection:</span>
              <span className="flex items-center gap-1">
                {connectionIcon}
                <span className={
                  status.connectionState === "connected" ? "text-green-400" : 
                  status.connectionState === "connecting" ? "text-yellow-400" : "text-red-400"
                }>
                  {status.connectionState.charAt(0).toUpperCase() + status.connectionState.slice(1)}
                </span>
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Audio Context:</span>
              <span className="flex items-center gap-1">
                {audioIcon}
                <span className={
                  status.audioContextState === "running" ? "text-green-400" : 
                  status.audioContextState === "suspended" ? "text-yellow-400" : "text-red-400"
                }>
                  {status.audioContextState.charAt(0).toUpperCase() + status.audioContextState.slice(1)}
                </span>
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Peers:</span>
              <span className="text-cyan-400">{status.peerCount}</span>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            disabled={isResetting}
            className={`mt-3 w-full py-1.5 rounded text-xs font-bold transition-colors ${
              isResetting 
                ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                : "bg-cyan-700 hover:bg-cyan-600 text-white"
            }`}
          >
            {isResetting ? "Resetting..." : "↻ Reset Comms"}
          </button>
        </div>
      )}
    </div>
  );
}

export function AudioManager() {
  const [status, setStatus] = useState<AudioStatus>({
    micActive: false,
    micMuted: false,
    connectionState: "disconnected",
    audioContextState: "suspended",
    peerCount: 0,
  });

  const updateStatus = useCallback((partial: Partial<AudioStatus>) => {
    setStatus(prev => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const ctx = (window as any).__audioContext;
      if (ctx) {
        updateStatus({ audioContextState: ctx.state as any });
      } else {
        updateStatus({ audioContextState: "suspended" });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [updateStatus]);

  const resetComms = useCallback(async () => {
    const resetFn = (window as any).__resetVoiceComms;
    if (resetFn) {
      await resetFn();
    }
  }, []);

  return (
    <AudioManagerContext.Provider value={{ status, resetComms }}>
      <VoiceChatCore onStatusChange={updateStatus} />
      <CommsPanel status={status} onReset={resetComms} />
    </AudioManagerContext.Provider>
  );
}
