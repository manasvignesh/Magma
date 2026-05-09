import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BodyScales } from './WardrobeData';

/*
 * SVG-based clothing overlay using foreignObject + CSS 3D transforms
 * to conform clothing images to mannequin body contours.
 * No canvas = no CORS issues with external images.
 */

interface ZoneGeom {
  // SVG polygon points for clip-path
  clip: string;
  // CSS perspective transform for body-conform illusion
  perspective: number;
  rotateX: number;
  skewY: number;
  // Position in SVG viewBox (0-200, 0-480)
  x: number; y: number; w: number; h: number;
  zIndex: number;
}

function getZoneGeom(zone: string, s: BodyScales): ZoneGeom {
  const sx = (v: number) => 100 + (v - 100) * s.shoulderWidth;
  const hx = (v: number) => 100 + (v - 100) * s.hipWidth;
  const ly = (v: number) => 230 + (v - 230) * s.legLength;

  switch (zone) {
    case 'topwear': {
      const l = sx(56), r = sx(144), t = 80, b = 234;
      const bl = hx(68), br = hx(132);
      return {
        clip: `polygon(${((l - l) / (r - l) * 100).toFixed(1)}% 0%, ${((r - l) / (r - l) * 100).toFixed(1)}% 0%, ${((br - l) / (r - l) * 100).toFixed(1)}% 100%, ${((bl - l) / (r - l) * 100).toFixed(1)}% 100%)`,
        perspective: 400, rotateX: 2.5, skewY: 0,
        x: l, y: t, w: r - l, h: b - t,
        zIndex: 10,
      };
    }
    case 'bottomwear': {
      const l = hx(58), r = hx(142), t = 228, b = ly(432);
      // Two-leg clip: inseam gap in center
      const cx = 50; // center %
      const gapW = 4; // gap width %
      return {
        clip: `polygon(0% 0%, 100% 0%, 92% 50%, 78% 100%, ${cx + gapW}% 100%, ${cx + 1}% 50%, ${cx - 1}% 50%, ${cx - gapW}% 100%, 22% 100%, 8% 50%)`,
        perspective: 350, rotateX: 1.5, skewY: 0,
        x: l, y: t, w: r - l, h: b - t,
        zIndex: 5,
      };
    }
    case 'cap':
      return {
        clip: 'ellipse(48% 45% at 50% 55%)',
        perspective: 200, rotateX: 5, skewY: 0,
        x: 72, y: 6, w: 56, h: 50, zIndex: 20,
      };
    case 'goggles':
      return {
        clip: 'ellipse(46% 42% at 50% 50%)',
        perspective: 150, rotateX: 0, skewY: 0,
        x: 74, y: 26, w: 52, h: 28, zIndex: 25,
      };
    case 'footwear': {
      const l = hx(52), r = hx(148), t = ly(416), b = ly(442);
      return {
        clip: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
        perspective: 200, rotateX: 15, skewY: 0,
        x: l, y: t, w: r - l, h: b - t, zIndex: 3,
      };
    }
    default:
      return { clip: 'none', perspective: 0, rotateX: 0, skewY: 0, x: 0, y: 0, w: 200, h: 480, zIndex: 0 };
  }
}

const ZONE_ORDER = ['footwear', 'bottomwear', 'topwear', 'cap', 'goggles'] as const;

// SVG filter for fabric texture
const FabricFilter = () => (
  <defs>
    <filter id="clothFabric" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" seed="5" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    {/* Shoulder highlight gradient */}
    <linearGradient id="shoulderShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(0,0,0,0.12)" />
      <stop offset="30%" stopColor="rgba(0,0,0,0)" />
    </linearGradient>
    <linearGradient id="foldHighlight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="40%" stopColor="rgba(255,255,255,0)" />
      <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
      <stop offset="60%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
  </defs>
);

interface Props {
  equipped: Record<string, string | null>;
  scales: BodyScales;
  findItem: (id: string) => { img: string; name: string } | undefined;
}

const ClothingCanvas: React.FC<Props> = ({ equipped, scales, findItem }) => {
  const zones = useMemo(() =>
    ZONE_ORDER.map(zone => ({ zone, geom: getZoneGeom(zone, scales) })),
    [scales]
  );

  const hasAny = Object.values(equipped).some(Boolean);
  if (!hasAny) return null;

  return (
    <svg
      viewBox="0 0 200 480"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}
    >
      <FabricFilter />
      <AnimatePresence>
        {zones.map(({ zone, geom }) => {
          const itemId = equipped[zone];
          if (!itemId) return null;
          const item = findItem(itemId);
          if (!item) return null;

          return (
            <motion.g
              key={`${zone}-${itemId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <foreignObject
                x={geom.x} y={geom.y}
                width={geom.w} height={geom.h}
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    clipPath: geom.clip,
                    transform: `perspective(${geom.perspective}px) rotateX(${geom.rotateX}deg)`,
                    transformOrigin: '50% 0%',
                    filter: 'url(#clothFabric)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: 'contrast(1.06) saturate(1.1) brightness(0.92)',
                    }}
                    draggable={false}
                  />
                  {/* Shoulder shading overlay for tops */}
                  {zone === 'topwear' && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%), linear-gradient(90deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 60%)',
                      pointerEvents: 'none',
                    }} />
                  )}
                  {/* Inseam shadow for bottoms */}
                  {zone === 'bottomwear' && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent 44%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 56%)',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

export default ClothingCanvas;
