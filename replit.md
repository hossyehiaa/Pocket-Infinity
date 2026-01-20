# Pocket Infinity - 3D Sci-Fi RPG

## Overview

This is a 3D browser-based game inspired by the USS Callister episode, built with React Three Fiber. Players command a starship, interact with crew members through AI-powered conversations (Groq AI), and explore procedurally generated planets. The game features two main scenes: a starship bridge for crew interactions and explorable alien planets with combat mechanics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Single-page application with component-based architecture
- **React Three Fiber**: 3D rendering using Three.js with React bindings
- **@react-three/drei**: Helper components for common 3D patterns (keyboard controls, text, stars)
- **@react-three/postprocessing**: Visual effects like bloom for enhanced graphics
- **Zustand**: Lightweight state management with selector subscriptions for game state, controls, and audio
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built accessible UI components
- **Vite**: Development server with HMR and production bundling

### Backend Architecture
- **Express.js**: HTTP server with JSON body parsing and logging middleware
- **Vite Dev Middleware**: In development, serves frontend with hot module replacement
- **Static File Serving**: In production, serves built frontend assets from `dist/public`
- **Storage Interface Pattern**: Abstract `IStorage` interface with `MemStorage` implementation for easy database swapping

### State Management Pattern
The game uses multiple Zustand stores for separation of concerns:
- `useGameState`: Core game state (scene, planets, crew, enemies, bullets, health, score)
- `useControls`: Input handling for both keyboard and mobile touch controls
- `useGame`: Game phase management (ready/playing/ended)
- `useAudio`: Sound effect and music management with mute toggle

### Game Scene Architecture
- **Bridge Scene**: Interior starship environment with interactive NPC crew members
- **Planet Scene**: Procedurally generated terrain with enemies, combat, and exploration
- **Scene Switching**: "Warp" transitions between scenes with loading states

### Procedural Terrain System
- **Simplex Noise**: Custom noise library (`client/src/lib/noise.ts`) for terrain height generation
- **FBM (Fractal Brownian Motion)**: Multi-octave noise for realistic hills and valleys
- **Terrain Size**: 200x200 units with 100x100 segment grid for detailed heightmaps
- **SeededRandom**: Deterministic random number generator for consistent prop placement

### Scattered Props System (InstancedMesh)
- **Performance**: Uses THREE.InstancedMesh for rendering 500-700+ objects efficiently
- **Planet Type Detection**: Automatically detects planet type from ground color
- **Volcanic Planets**: 600 obsidian rock shards (dodecahedrons)
- **Forest Planets**: 200 alien trees (cones) + 500 grass tufts
- **Ice Planets**: 300 large crystals + 400 small crystals (octahedrons, transparent)
- **Desert Planets**: 250 rocks + 500 debris pieces

### Minimap System
- **Location**: Top-left corner circular radar (120x120 pixels)
- **World Scale**: Maps 100-unit world radius to minimap
- **Player Indicator**: Green dot at center
- **Enemy Indicators**: Red pulsing dots, clamped to edge when distant
- **Ship Indicator**: Yellow icon at spawn point (0,0)
- **Real-time Updates**: Enemy positions sync via `updateEnemyPosition` in game state

### Atmospheric Fog
- **FogExp2**: Exponential fog for natural distance fade
- **Color Matching**: Fog color derived from planet's ground color (30% brightness)
- **Dynamic Density**: Fog density tied to `planetParams.fogDensity`

### Combat System
- **Enemy AI**: Floating drones chase the player at 1.5 units/sec, hover above terrain
- **Player Damage**: -10 HP when drone within 1.5 units (1 second cooldown)
- **Knockback**: Player pushed away from drone on hit using state-based velocity
- **Damage Visual**: Red vignette flash (0.2s) on taking damage
- **Scoring**: +100 points per drone destroyed
- **Game Over**: When HP reaches 0, shows final score and RESPAWN button
- **HUD**: Health bar (top-left, color changes based on HP), Score (top-right)

### Weapon System
- **Keys 1-3**: Switch between weapons
- **Blaster (1)**: Fast fire (300ms cooldown), 25 damage, green projectiles
- **Shotgun (2)**: 5 spread projectiles, 15 damage each, 800ms cooldown, orange projectiles
- **Sniper (3)**: Instant raycast hit, 100 damage, 1500ms cooldown, cyan trail
- **UI**: Weapon selector in bottom-right shows current weapon with key hints

### Hoverboard Vehicle
- **Toggle**: Press 'V' to mount/dismount (planet scene only)
- **Speed**: 3x movement speed when riding
- **Animation**: Bobbing up/down hover effect
- **Visual**: Glowing cyan hover-jets under a blue platform
- **HUD**: Indicator shows when mounted with dismount instructions

### Battle Royale System
- **Shrinking Zone**: Blue translucent cylinder that shrinks from 100m to 8m over 2 minutes
- **Zone Damage**: 5 HP per second when outside the safe zone
- **Zone UI**: Timer at top center showing time remaining and current radius
- **Sci-Fi Outposts**: 8 procedurally placed buildings with interiors for cover
- **Building Types**: 3 different outpost styles (bunker, dome, multi-story)
- **Space Bike**: Drivable vehicle near spawn (F to enter/exit), 4x speed
- **Vehicle Proximity**: "Press F to Drive" prompt when near vehicle

### Humanoid Characters
- **Player Model**: Sci-Fi armored humanoid with visor, shoulder pads, limbs
- **Walking Animation**: Arm and leg swing animation using useFrame
- **Animation State**: Movement-based animation triggers (isMoving prop)

### Multiplayer System (Playroom Kit)
- **insertCoin**: Game wrapped with Playroom lobby (streamMode + matchmaking enabled)
- **Voice Chat**: Playroom handles audio streams automatically via WebRTC
- **Player Sync**: Local player position synced at 20Hz with movement threshold (0.05 units)
- **NetworkManager**: Uses usePlayersList() to track connected players, syncs scene from host
- **NetworkPlayer**: Renders remote players with interpolated position/rotation (0.15 lerp)
- **Scene Authority**: Host controls scene transitions (warp/return), non-hosts follow via polling
- **Lobby UI**: Shows player count and room code at top center of screen
- **Player Colors**: Assigned from palette on join (blue, red, green, orange, purple, teal, pink, cyan)

### AI Integration
- **Groq API (llama-3.3-70b-versatile)**: Powers crew member conversations with personality-driven responses
- **Dynamic Planet Generation**: AI generates planet parameters (colors, gravity, names) based on player requests
- **Client-side API calls**: Groq integration runs directly in browser using `VITE_GROQ_API_KEY` with `dangerouslyAllowBrowser: true`

### Audio System
- **Web Audio API**: Synthesized retro sci-fi sounds using oscillators (no external audio files)
- **Sound Effects**: Laser shoot (square wave), jump (sine slide), explosion (noise + filter), warp drive (dual oscillators + LFO)
- **Mute Toggle**: Bottom-right button to enable/disable all sounds
- **User Gesture Initialization**: AudioContext initialized on START GAME click for browser autoplay compliance

### Voice Chat & Audio Manager
- **Root Level**: AudioManager component mounted at root in main.tsx, never unmounts during gameplay
- **WebRTC Voice**: Peer-to-peer voice chat using STUN servers and Playroom RPC for signaling
- **Comms Panel**: Bottom-right diagnostic overlay showing mic status, connection state, audio context state
- **Reset Button**: Force-kills all audio tracks and re-requests microphone access without page refresh
- **Persistence**: Voice chat persists across scene changes (bridge/planet) and game resets

### Mobile Support
- **Responsive Controls**: Virtual joystick (nipplejs) for movement, touch zones for camera look
- **Device Detection**: `useIsMobile` hook adjusts UI and disables expensive post-processing effects
- **Touch-optimized UI**: Mobile-specific control buttons for actions like talk/shoot/jump

### Build System
- **Vite**: Frontend bundling with React plugin, GLSL shader support, and asset handling
- **esbuild**: Server-side bundling with selective dependency bundling for faster cold starts
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory

## External Dependencies

### Database
- **PostgreSQL**: Configured via Drizzle ORM with `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations` directory
- **Schema**: Located in `shared/schema.ts` with users table (id, username, password)

### AI Services
- **Groq API (llama-3.3-70b-versatile)**: Fast inference for crew conversations and planet generation
- **Environment Variable**: `VITE_GROQ_API_KEY` required for AI features

### Key NPM Dependencies
- **three**: 3D graphics engine
- **nipplejs**: Mobile virtual joystick
- **react-day-picker**: Date selection component
- **embla-carousel-react**: Carousel functionality
- **vaul**: Drawer component
- **recharts**: Chart components
- **react-hook-form**: Form handling
- **zod**: Schema validation with `drizzle-zod` integration