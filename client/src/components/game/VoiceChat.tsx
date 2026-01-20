import { useEffect, useRef, useCallback, useState } from "react";
import { usePlayersList, myPlayer, onPlayerJoin, PlayerState, RPC } from "playroomkit";
import { useGameState } from "@/lib/stores/useGameState";

interface PeerConnection {
  pc: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
];

const audioElements: HTMLAudioElement[] = [];
let audioUnlocked = false;
let audioUnlockListeners: (() => void)[] = [];

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

export function VoiceChat() {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const pendingOffersRef = useRef<Set<string>>(new Set());
  const players = usePlayersList();
  const me = myPlayer();
  const { isMicMuted } = useGameState();

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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(playerId, { pc, audioElement });
    return pc;
  }, []);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.log("Microphone access denied or not available");
      return null;
    }
  }, []);

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

    return () => {
      peerConnectionsRef.current.forEach(({ pc, audioElement }) => {
        pc.close();
        audioElement.remove();
      });
      peerConnectionsRef.current.clear();
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [me?.id, createPeerConnection, initLocalStream]);

  useEffect(() => {
    const cleanup = onPlayerJoin((player) => {
      if (player.id !== me?.id) {
        setTimeout(() => {
          initiateCall(player.id);
        }, 1000);
      }
    });

    return () => {
      if (cleanup) cleanup();
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
  }, [isMicMuted]);

  return null;
}
