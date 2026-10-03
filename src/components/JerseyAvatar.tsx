import React from 'react';
import { AvatarConfig } from '../types';

interface JerseyAvatarProps {
  avatar: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showGlow?: boolean;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: { box: 32, px: 'w-8 h-8' },
  sm: { box: 44, px: 'w-11 h-11' },
  md: { box: 56, px: 'w-14 h-14' },
  lg: { box: 80, px: 'w-20 h-20' },
  xl: { box: 112, px: 'w-28 h-28' },
  hero: { box: 180, px: 'w-44 h-44 sm:w-52 sm:h-52' },
};

export const JerseyAvatar: React.FC<JerseyAvatarProps> = ({
  avatar,
  size = 'md',
  className = '',
  showGlow = false,
  animate = false,
}) => {
  const {
    primaryColor,
    secondaryColor,
    accentColor,
    numberColor,
    jerseyNumber,
    jerseyStyle = 'classic',
    playerSkinTone = '#a16207',
    headband = true,
    headbandColor = '#000000',
    hairStyle = 'fade',
    accessory = 'none',
    accessoryColor = '#CE1141',
  } = avatar;

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const numStr = String(jerseyNumber ?? 23);

  // SVG dimensions: viewBox="0 0 100 110"
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none rounded-2xl overflow-hidden shrink-0 ${sizeConfig.px} ${className}`}
      style={{
        boxShadow: showGlow
          ? `0 10px 25px -5px ${primaryColor}40, 0 0 12px ${secondaryColor}30`
          : undefined,
      }}
    >
      {/* Background circle / court halo */}
      <svg
        viewBox="0 0 100 110"
        className={`w-full h-full ${animate ? 'transition-all duration-300 transform hover:scale-105' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`bg-grad-${size}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#262626" />
            <stop offset="70%" stopColor="#141414" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>

          <linearGradient id={`jersey-grad-${primaryColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.88" />
          </linearGradient>

          <filter id={`shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Backdrop tile with subtle basketball rim arc */}
        <rect width="100" height="110" fill={`url(#bg-grad-${size})`} rx="16" />
        <circle cx="50" cy="55" r="46" fill="none" stroke={secondaryColor} strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="3 3" />

        {/* Player Arms & Shoulders skin */}
        {/* Left Arm / Shoulder */}
        <path
          d="M 22 64 C 18 72, 16 88, 15 105 L 28 105 C 29 90, 31 76, 33 66 Z"
          fill={playerSkinTone}
        />
        {/* Right Arm / Shoulder */}
        <path
          d="M 78 64 C 82 72, 84 88, 85 105 L 72 105 C 71 90, 69 76, 67 66 Z"
          fill={playerSkinTone}
        />

        {/* Accessory: Arm Sleeve on right arm */}
        {accessory === 'arm_sleeve' && (
          <path
            d="M 74 74 C 77 82, 80 92, 83 105 L 73 105 C 71 94, 69 84, 68 76 Z"
            fill={accessoryColor || secondaryColor}
          />
        )}

        {/* Accessory: Wristband */}
        {accessory === 'wristband' && (
          <rect x="74" y="94" width="9" height="6" rx="1.5" fill={accessoryColor || secondaryColor} />
        )}

        {/* Neck */}
        <path
          d="M 44 48 L 44 65 C 44 67, 56 67, 56 65 L 56 48 Z"
          fill={playerSkinTone}
        />
        {/* Neck shadow under jaw */}
        <path
          d="M 44 50 C 47 54, 53 54, 56 50 L 56 55 C 53 58, 47 58, 44 55 Z"
          fill="#000000"
          fillOpacity="0.25"
        />

        {/* ================= JERSEY BODY ================= */}
        {/* Main Torso */}
        <path
          d="M 30 64 L 38 60 L 62 60 L 70 64 L 75 108 L 25 108 Z"
          fill={`url(#jersey-grad-${primaryColor.replace('#', '')})`}
        />

        {/* Jersey Styles */}
        {jerseyStyle === 'split' && (
          <path
            d="M 50 60 L 62 60 L 70 64 L 75 108 L 50 108 Z"
            fill={secondaryColor}
          />
        )}

        {jerseyStyle === 'pinstripe' && (
          <g stroke={accentColor} strokeWidth="0.8" opacity="0.45">
            <line x1="36" y1="65" x2="33" y2="108" />
            <line x1="43" y1="64" x2="41" y2="108" />
            <line x1="50" y1="66" x2="50" y2="108" />
            <line x1="57" y1="64" x2="59" y2="108" />
            <line x1="64" y1="65" x2="67" y2="108" />
          </g>
        )}

        {/* Classic side trim panels */}
        {jerseyStyle === 'classic' && (
          <>
            <path d="M 25 76 L 31 74 L 29 108 L 25 108 Z" fill={secondaryColor} />
            <line x1="31" y1="74" x2="29" y2="108" stroke={accentColor} strokeWidth="1" />
            <path d="M 75 76 L 69 74 L 71 108 L 75 108 Z" fill={secondaryColor} />
            <line x1="69" y1="74" x2="71" y2="108" stroke={accentColor} strokeWidth="1" />
          </>
        )}

        {/* Modern slash styling */}
        {jerseyStyle === 'modern' && (
          <>
            <polygon points="68,64 74,70 65,108 59,108" fill={secondaryColor} opacity="0.9" />
            <line x1="68" y1="64" x2="59" y2="108" stroke={accentColor} strokeWidth="1.2" />
          </>
        )}

        {/* Armhole trim / ribbing */}
        <path
          d="M 29 64 C 29 70, 31 76, 33 80"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 71 64 C 71 70, 69 76, 67 80"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Jersey Collar (V-neck cutout with trim) */}
        <path
          d="M 38 60 L 50 71 L 62 60 Z"
          fill={playerSkinTone}
        />
        <path
          d="M 36 60 L 50 72 L 64 60"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M 37 60 L 50 71 L 63 60"
          fill="none"
          stroke={accentColor}
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Jersey Number on Chest */}
        <text
          x="50"
          y="93"
          textAnchor="middle"
          fill={numberColor}
          stroke={secondaryColor}
          strokeWidth="0.8"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: numStr.length >= 2 ? '22px' : '26px',
            letterSpacing: '-0.02em',
          }}
          filter={`url(#shadow-${size})`}
        >
          {numStr}
        </text>

        {/* Small League / Brand Patch on top chest */}
        <rect x="40" y="66" width="3.5" height="4.5" rx="1" fill={accentColor} opacity="0.8" />

        {/* ================= PLAYER HEAD & HAIR ================= */}
        {/* Ears */}
        <circle cx="36" cy="38" r="4.5" fill={playerSkinTone} />
        <circle cx="36" cy="38" r="2.2" fill="#000000" fillOpacity="0.15" />
        <circle cx="64" cy="38" r="4.5" fill={playerSkinTone} />
        <circle cx="64" cy="38" r="2.2" fill="#000000" fillOpacity="0.15" />

        {/* Head / Face Oval */}
        <ellipse cx="50" cy="36" rx="13.5" ry="16" fill={playerSkinTone} />

        {/* Hair Styles */}
        {hairStyle === 'afro' && (
          <g fill="#171717">
            <circle cx="50" cy="23" r="16" />
            <circle cx="37" cy="27" r="11" />
            <circle cx="63" cy="27" r="11" />
            <circle cx="43" cy="20" r="12" />
            <circle cx="57" cy="20" r="12" />
          </g>
        )}

        {hairStyle === 'dreads' && (
          <g fill="#171717">
            <path d="M 37 25 Q 32 35 30 46 Q 33 46 35 34 Z" />
            <path d="M 42 22 Q 35 36 33 50 Q 36 50 39 36 Z" />
            <path d="M 63 25 Q 68 35 70 46 Q 67 46 65 34 Z" />
            <path d="M 58 22 Q 65 36 67 50 Q 64 50 61 36 Z" />
            <ellipse cx="50" cy="24" rx="14" ry="8" />
          </g>
        )}

        {hairStyle === 'fade' && (
          <path
            d="M 36 28 C 36 20, 42 18, 50 18 C 58 18, 64 20, 64 28 C 64 30, 63 32, 60 30 C 56 28, 44 28, 40 30 C 37 32, 36 30, 36 28 Z"
            fill="#171717"
          />
        )}

        {hairStyle === 'short' && (
          <path
            d="M 36 30 C 36 21, 42 19, 50 19 C 58 19, 64 21, 64 30 C 62 26, 56 24, 50 24 C 44 24, 38 26, 36 30 Z"
            fill="#171717"
          />
        )}

        {/* Headband (if active) */}
        {headband && (
          <g>
            <path
              d="M 35.5 28 C 40 26, 60 26, 64.5 28 L 65 33 C 60 31, 40 31, 35 33 Z"
              fill={headbandColor}
            />
            {/* Headband contrast stripe or logo stitch */}
            <line x1="48" y1="29.5" x2="52" y2="29.5" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* Protective Face Mask Accessory */}
        {accessory === 'face_mask' && (
          <path
            d="M 40 37 L 50 44 L 60 37 L 57 47 L 43 47 Z"
            fill="#000000"
            fillOpacity="0.65"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
        )}

        {/* Simple athletic eyes / focus brows */}
        <g fill="#171717" opacity="0.85">
          {/* Eyebrows */}
          <path d="M 42 34 L 46 35" stroke="#171717" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 58 34 L 54 35" stroke="#171717" strokeWidth="1.2" strokeLinecap="round" />
          {/* Focused eyes */}
          <circle cx="44" cy="37" r="1.1" />
          <circle cx="56" cy="37" r="1.1" />
          {/* Athletic mouth */}
          <line x1="47" y1="45" x2="53" y2="45" stroke="#171717" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
