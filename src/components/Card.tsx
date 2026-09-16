import * as THREE from 'three';
import { useMemo, useRef, useState, useEffect } from 'react';
import { CARD_WIDTH, CARD_HEIGHT, GLOBE_RADIUS } from '../data';
import { DEFAULT_PHOTO_DESCRIPTION } from '../utils/photoCaption';

interface CardProps {
  index: number;
  position: THREE.Vector3;
  scale?: number;
  customImage: string;
  customTitle?: string;
  customDescription?: string;
  onSelect: (image: string, location: string, info: string) => void;
  onHover?: (info: string) => void;
  onHoverOut?: () => void;
}

// A single tiny, shared placeholder texture for every card while its real
// photo is loading — much cheaper than each of the (up to 96) cards
// building its own 400x500 canvas on every mount.
let sharedPlaceholder: THREE.Texture | null = null;
function getSharedPlaceholder(): THREE.Texture {
  if (!sharedPlaceholder) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 4, 4);
    }
    sharedPlaceholder = new THREE.CanvasTexture(canvas);
    sharedPlaceholder.minFilter = THREE.LinearFilter;
    sharedPlaceholder.generateMipmaps = false;
  }
  return sharedPlaceholder;
}

export default function Card({ index, position, scale = 1, customImage, customTitle, customDescription, onSelect, onHover, onHoverOut }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const cardName = customTitle?.trim() || `Foto ${index + 1}`;
  const cardInfo = customDescription?.trim() || DEFAULT_PHOTO_DESCRIPTION;

  const [texture, setTexture] = useState<THREE.Texture>(() => getSharedPlaceholder());

  useEffect(() => {
    let active = true;
    let loadedTex: THREE.Texture | null = null;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(customImage, (tex) => {
      if (!active) {
        // Component unmounted or customImage changed again before this
        // finished loading — don't leak the GPU texture we just made.
        tex.dispose();
        return;
      }
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      loadedTex = tex;
      setTexture(tex);
    });

    return () => {
      active = false;
      // Dispose the previously loaded photo texture (not the shared
      // placeholder) whenever this card moves on to a different image or
      // unmounts, to avoid accumulating GPU memory across globes.
      loadedTex?.dispose();
    };
  }, [customImage]);

  useEffect(() => {
    if (hovered && onHover) {
      onHover(cardName);
    }
  }, [cardName, hovered, onHover]);

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

  // Dispose the plane geometry whenever it's replaced (scale changed) or
  // the card unmounts.
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh 
      position={position} 
      quaternion={rotationQuaternion}
      ref={meshRef} 
      geometry={geometry} 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(customImage, cardName, cardInfo);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        if (onHover) {
          onHover(cardName);
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
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        toneMapped={false} 
      />
    </mesh>
  );
}
