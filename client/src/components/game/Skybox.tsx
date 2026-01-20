import { useMemo } from "react";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

export function SpaceSkybox() {
  const nebulaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color("#0a0a20") },
        color2: { value: new THREE.Color("#1a0a30") },
        color3: { value: new THREE.Color("#050510") },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        
        void main() {
          float y = (vPosition.y + 200.0) / 400.0;
          vec3 color = mix(color3, mix(color1, color2, y), smoothstep(0.0, 1.0, y));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  const distantStars = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 180 + Math.random() * 20;
      
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      const starType = Math.random();
      if (starType < 0.7) {
        colors.push(1, 1, 1);
      } else if (starType < 0.85) {
        colors.push(0.8, 0.9, 1);
      } else if (starType < 0.95) {
        colors.push(1, 0.9, 0.7);
      } else {
        colors.push(1, 0.6, 0.4);
      }
      
      sizes.push(0.3 + Math.random() * 0.7);
    }
    
    return { positions, colors, sizes };
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <primitive object={nebulaMaterial} />
      </mesh>

      <Stars 
        radius={150}
        depth={50}
        count={3000}
        factor={4}
        saturation={0.1}
        fade
        speed={0.5}
      />

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={distantStars.positions.length / 3}
            array={new Float32Array(distantStars.positions)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={distantStars.colors.length / 3}
            array={new Float32Array(distantStars.colors)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.5}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation={false}
        />
      </points>

      <mesh position={[100, 50, -150]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#4a90d9" transparent opacity={0.3} />
      </mesh>
      <pointLight position={[100, 50, -150]} color="#4a90d9" intensity={0.3} distance={100} />

      <mesh position={[-80, -30, -120]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
