import { useEffect, useRef, useState } from "react";
import { useControls } from "@/lib/stores/useControls";

export function KeyboardMouseControls() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPointerLocked, setIsPointerLocked] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const keysPressed = useRef<Set<string>>(new Set());

    const { setMove, setLook, setJump, setShoot } = useControls();

    useEffect(() => {
        // Find the canvas element
        const canvas = document.querySelector("canvas");
        canvasRef.current = canvas;

        if (!canvas) return;

        // Pointer Lock handlers
        const handlePointerLockChange = () => {
            const locked = document.pointerLockElement === canvas;
            setIsPointerLocked(locked);
            if (locked) {
                setShowInstructions(false);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (document.pointerLockElement === canvas) {
                // Mouse sensitivity
                const sensitivity = 0.002;
                const deltaX = e.movementX * sensitivity;
                const deltaY = e.movementY * sensitivity;

                // Update look controls (feed into the same store mobile uses)
                setLook(deltaX, deltaY);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (document.pointerLockElement === canvas) {
                if (e.button === 0) { // Left click
                    setShoot(true);
                    setTimeout(() => setShoot(false), 100);
                }
            } else {
                // Request pointer lock on click
                canvas.requestPointerLock();
            }
        };

        // Keyboard handlers
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current.add(e.code);
            updateMovement();

            // Jump on Space
            if (e.code === "Space") {
                e.preventDefault();
                setJump(true);
                setTimeout(() => setJump(false), 100);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.code);
            updateMovement();
        };

        const updateMovement = () => {
            let moveX = 0;
            let moveZ = 0;

            if (keysPressed.current.has("KeyW") || keysPressed.current.has("ArrowUp")) {
                moveZ = -1;
            }
            if (keysPressed.current.has("KeyS") || keysPressed.current.has("ArrowDown")) {
                moveZ = 1;
            }
            if (keysPressed.current.has("KeyA") || keysPressed.current.has("ArrowLeft")) {
                moveX = -1;
            }
            if (keysPressed.current.has("KeyD") || keysPressed.current.has("ArrowRight")) {
                moveX = 1;
            }

            setMove(moveX, moveZ);
        };

        // Event listeners
        document.addEventListener("pointerlockchange", handlePointerLockChange);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("pointerlockchange", handlePointerLockChange);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);

            // Reset controls on unmount
            setMove(0, 0);
            setLook(0, 0);
        };
    }, [setMove, setLook, setJump, setShoot]);

    // Instructions overlay
    if (!isPointerLocked && showInstructions) {
        return (
            <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
                <div className="bg-black/80 backdrop-blur-md px-8 py-6 rounded-2xl border-2 border-cyan-500/50 shadow-2xl max-w-md pointer-events-auto">
                    <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">
                        🖱️ PC Controls
                    </h3>
                    <div className="space-y-3 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center font-mono text-lg font-bold border border-white/20">
                                W A S D
                            </div>
                            <span className="text-gray-300">Move</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center font-mono text-lg font-bold border border-white/20">
                                MOUSE
                            </div>
                            <span className="text-gray-300">Look Around</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center font-mono text-lg font-bold border border-white/20">
                                CLICK
                            </div>
                            <span className="text-gray-300">Shoot</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center font-mono text-lg font-bold border border-white/20">
                                SPACE
                            </div>
                            <span className="text-gray-300">Jump</span>
                        </div>
                    </div>
                    <div className="mt-6 text-center text-cyan-400 text-sm animate-pulse">
                        Click anywhere to start playing
                    </div>
                    <div className="mt-2 text-center text-gray-500 text-xs">
                        Press ESC to unlock cursor
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
