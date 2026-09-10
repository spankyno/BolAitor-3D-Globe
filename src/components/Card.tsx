import * as THREE from 'three';
import { useMemo, useRef, useState, useEffect } from 'react';
import { CARD_WIDTH, CARD_HEIGHT, GLOBE_RADIUS } from '../data';
import { getLocationByIndex } from '../locationsData';

interface CardProps {
  index: number;
  position: THREE.Vector3;
  scale?: number;
  userPhoto?: string | null;
  onSelect: (image: string, location: string, info: string) => void;
  onHover?: (info: string) => void;
  onHoverOut?: () => void;
}

export default function Card({ index, position, scale = 1, onSelect, onHover, onHoverOut }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const locationItem = useMemo(() => getLocationByIndex(index), [index]);
  
  // Default texture while loading
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;

    // Load neutral placeholder texture initially
    const placeholderCanvas = document.createElement('canvas');
    placeholderCanvas.width = 400;
    placeholderCanvas.height = 500;
    const ctx = placeholderCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 400, 500);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(locationItem.name.split(',')[0], 200, 250);
    }
    const initialTex = new THREE.CanvasTexture(placeholderCanvas);
    initialTex.minFilter = THREE.LinearMipmapLinearFilter;
    initialTex.generateMipmaps = true;
    setTexture(initialTex);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    // Load primary image, fallback to secondary if network error
    loader.load(
      locationItem.imageUrl,
      (loadedTex) => {
        if (!active) return;
        loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTex.generateMipmaps = true;
        setTexture(loadedTex);
      },
      undefined,
      () => {
        // Error handler: try fallback URL
        loader.load(
          locationItem.fallbackUrl,
          (fallbackTex) => {
            if (!active) return;
            fallbackTex.minFilter = THREE.LinearMipmapLinearFilter;
            fallbackTex.generateMipmaps = true;
            setTexture(fallbackTex);
          }
        );
      }
    );

    return () => {
      active = false;
    };
  }, [locationItem]);

  useEffect(() => {
    if (hovered && onHover) {
      onHover(locationItem.name);
    }
  }, [locationItem, hovered, onHover]);

  const rotationQuaternion = useMemo(() => {
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);
    // The local forward vector (+Z) points directly outward from center (0,0,0)
    dummy.lookAt(position.clone().multiplyScalar(2));
    return dummy.quaternion.clone();
  }, [position]);

  const geometry = useMemo(() => {
    // 32x32 segments for smooth curving
    // Scale the dimensions before applying the bend, so it sits perfectly curve-flush on the sphere
    const width = CARD_WIDTH * scale;
    const height = CARD_HEIGHT * scale;
    const geo = new THREE.PlaneGeometry(width, height, 32, 32);
    const pos = geo.attributes.position;
    
    // Curve the plane to match the sphere's surface
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      const theta = x / GLOBE_RADIUS;
      const phi = y / GLOBE_RADIUS;
      
      const newX = GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi);
      const newY = GLOBE_RADIUS * Math.sin(phi);
      // Offset by GLOBE_RADIUS so its local center remains at (0,0,0)
      const newZ = GLOBE_RADIUS * Math.cos(theta) * Math.cos(phi) - GLOBE_RADIUS;
      
      pos.setXYZ(i, newX, newY, newZ);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [scale]);

  return (
    <mesh 
      position={position} 
      quaternion={rotationQuaternion}
      ref={meshRef} 
      geometry={geometry} 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(locationItem.imageUrl, locationItem.name, locationItem.info);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        if (onHover) {
          onHover(locationItem.name);
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
        if (onHoverOut) {
          onHoverOut();
        }
      }}
    >
      {/* DoubleSide allows the interior views of the cards to be seen when passing through */}
      {texture && (
        <meshBasicMaterial 
          map={texture} 
          side={THREE.DoubleSide} 
          toneMapped={false} 
        />
      )}
    </mesh>
  );
}
