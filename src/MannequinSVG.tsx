import React from 'react';
import { BodyScales } from './WardrobeData';

interface Props { scales: BodyScales; activeZone: string | null; onZoneClick: (zone: string) => void; }

const MannequinSVG: React.FC<Props> = ({ scales, activeZone, onZoneClick }) => {
  const { torsoWidth, shoulderWidth, legLength, hipWidth } = scales;
  const bodyFill = '#c8cfe0';
  const bodyStroke = '#a0aac4';
  const sx = (v: number) => 100 + (v - 100) * shoulderWidth;
  const tx = (v: number) => 100 + (v - 100) * torsoWidth;
  const hx = (v: number) => 100 + (v - 100) * hipWidth;
  const ly = (v: number) => 230 + (v - 230) * legLength;

  const zoneStyle = (zone: string): React.CSSProperties => ({
    cursor: 'pointer', fill: 'transparent', stroke: activeZone === zone ? '#818cf8' : 'transparent',
    strokeWidth: activeZone === zone ? 2 : 0, strokeDasharray: activeZone === zone ? '6 3' : 'none',
    filter: activeZone === zone ? 'drop-shadow(0 0 8px rgba(129,140,248,0.6))' : 'none',
    transition: 'all 0.3s ease',
  });

  return (
    <svg viewBox="0 0 200 480" className="w-full h-full mannequin-breathe" style={{ maxHeight: '100%' }}>
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#dce2f0" />
          <stop offset="100%" stopColor="#b8c2d8" />
        </radialGradient>
        <filter id="bodyShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
        </filter>
        <filter id="activeGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#818cf8" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g filter="url(#bodyShadow)">
        {/* Head */}
        <ellipse cx="100" cy="40" rx="22" ry="27" fill="url(#bodyGrad)" stroke={bodyStroke} strokeWidth="0.8" />
        {/* Neck */}
        <rect x="94" y="67" width="12" height="15" rx="4" fill={bodyFill} stroke={bodyStroke} strokeWidth="0.5" />
        {/* Torso */}
        <path d={`M ${sx(62)} 85 Q ${sx(60)} 83 ${sx(68)} 82 L ${sx(132)} 82 Q ${sx(140)} 83 ${sx(138)} 85 L ${tx(142)} 150 Q ${tx(138)} 200 ${hx(130)} 230 L ${hx(70)} 230 Q ${tx(62)} 200 ${tx(58)} 150 Z`}
          fill="url(#bodyGrad)" stroke={bodyStroke} strokeWidth="0.8" />
        {/* Left Arm */}
        <path d={`M ${sx(62)} 86 Q ${sx(48)} 130 ${sx(44)} 180 Q ${sx(42)} 200 ${sx(46)} 215 L ${sx(52)} 212 Q ${sx(50)} 198 ${sx(52)} 180 Q ${sx(56)} 135 ${sx(66)} 90`}
          fill={bodyFill} stroke={bodyStroke} strokeWidth="0.5" />
        {/* Right Arm */}
        <path d={`M ${sx(138)} 86 Q ${sx(152)} 130 ${sx(156)} 180 Q ${sx(158)} 200 ${sx(154)} 215 L ${sx(148)} 212 Q ${sx(150)} 198 ${sx(148)} 180 Q ${sx(144)} 135 ${sx(134)} 90`}
          fill={bodyFill} stroke={bodyStroke} strokeWidth="0.5" />
        {/* Left Leg */}
        <path d={`M ${hx(72)} 230 L ${hx(70)} ${ly(340)} Q ${hx(69)} ${ly(370)} ${hx(70)} ${ly(400)} L ${hx(72)} ${ly(420)} L ${hx(60)} ${ly(425)} Q ${hx(56)} ${ly(430)} ${hx(60)} ${ly(435)} L ${hx(88)} ${ly(435)} Q ${hx(92)} ${ly(433)} ${hx(90)} ${ly(428)} L ${hx(85)} ${ly(420)} L ${hx(88)} ${ly(400)} Q ${hx(90)} ${ly(370)} ${hx(88)} ${ly(340)} L ${hx(94)} 230 Z`}
          fill="url(#bodyGrad)" stroke={bodyStroke} strokeWidth="0.8" />
        {/* Right Leg */}
        <path d={`M ${hx(106)} 230 L ${hx(112)} ${ly(340)} Q ${hx(110)} ${ly(370)} ${hx(112)} ${ly(400)} L ${hx(115)} ${ly(420)} L ${hx(110)} ${ly(428)} Q ${hx(108)} ${ly(433)} ${hx(112)} ${ly(435)} L ${hx(140)} ${ly(435)} Q ${hx(144)} ${ly(430)} ${hx(140)} ${ly(425)} L ${hx(128)} ${ly(420)} L ${hx(130)} ${ly(400)} Q ${hx(131)} ${ly(370)} ${hx(130)} ${ly(340)} L ${hx(128)} 230 Z`}
          fill="url(#bodyGrad)" stroke={bodyStroke} strokeWidth="0.8" />
      </g>

      {/* Clickable zones */}
      <rect x="68" y="8" width="64" height="58" rx="20" style={zoneStyle('cap')} onClick={() => onZoneClick('cap')} />
      <rect x="74" y="28" width="52" height="25" rx="10" style={zoneStyle('goggles')} onClick={() => onZoneClick('goggles')} />
      <rect x={tx(55)} y="80" width={tx(145) - tx(55)} height="152" rx="8" style={zoneStyle('topwear')} onClick={() => onZoneClick('topwear')} />
      <rect x={hx(65)} y="228" width={hx(135) - hx(65)} height={ly(425) - 228} rx="6" style={zoneStyle('bottomwear')} onClick={() => onZoneClick('bottomwear')} />
      <rect x={hx(54)} y={ly(418)} width={hx(146) - hx(54)} height="22" rx="4" style={zoneStyle('footwear')} onClick={() => onZoneClick('footwear')} />
    </svg>
  );
};

export default MannequinSVG;
