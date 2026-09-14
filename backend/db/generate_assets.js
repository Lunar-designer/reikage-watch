import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

function createThumbnailSvg({ title, tag, creator, subtitle, badge, accent = '#FFFFFF' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a" />
      <stop offset="60%" stop-color="#141414" />
      <stop offset="100%" stop-color="#040404" />
    </linearGradient>
    <linearGradient id="overlayGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.95" />
      <stop offset="40%" stop-color="#000000" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="70%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />
  <rect width="1280" height="720" fill="url(#grid)" />
  <rect width="1280" height="720" fill="url(#glowGrad)" />

  <!-- Geometric Clan esports backdrop elements -->
  <path d="M 900 0 L 1280 0 L 1280 720 L 700 720 Z" fill="rgba(255,255,255,0.02)" />
  <polygon points="1050,150 1200,360 1050,570 900,360" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <polygon points="1080,210 1170,360 1080,510 990,360" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.4" />
  
  <!-- Cyber cross lines -->
  <line x1="800" y1="360" x2="1250" y2="360" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="8 8" />
  <line x1="1050" y1="100" x2="1050" y2="620" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="8 8" />

  <!-- Reikage Clan Crest Motif -->
  <g transform="translate(1000, 310)">
    <path d="M 50 -100 L 90 -20 L 50 60 L 10 -20 Z" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="2" />
    <path d="M 50 -70 L 75 -20 L 50 30 L 25 -20 Z" fill="${accent}" fill-opacity="0.3" />
    <text x="50" y="110" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="6" text-anchor="middle">REIKAGE CLAN</text>
  </g>

  <!-- Bottom Dark Vignette -->
  <rect width="1280" height="720" fill="url(#overlayGrad)" />

  <!-- Content Block -->
  <g transform="translate(70, 480)">
    <!-- Badge -->
    <rect x="0" y="-80" width="160" height="34" rx="6" fill="#181818" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <text x="80" y="-58" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="800" font-size="13" fill="#ffffff" letter-spacing="2" text-anchor="middle">${badge}</text>

    <!-- Category Pill -->
    <rect x="175" y="-80" width="140" height="34" rx="6" fill="rgba(255,255,255,0.06)" />
    <text x="245" y="-58" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="700" font-size="12" fill="#aaaaaa" letter-spacing="1.5" text-anchor="middle">${tag}</text>

    <!-- Main Title -->
    <text x="0" y="-5" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="-0.5">${title}</text>
    
    <!-- Subtitle -->
    <text x="0" y="42" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="500" font-size="22" fill="#888888">${subtitle}</text>

    <!-- Creator signature -->
    <text x="0" y="90" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="700" font-size="16" fill="#cccccc" letter-spacing="1">PRODUCED BY ${creator.toUpperCase()}</text>
  </g>

  <!-- Brand watermark -->
  <g transform="translate(70, 70)">
    <text font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="18" fill="#ffffff" letter-spacing="4">REIKAGE</text>
    <text x="110" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="400" font-size="18" fill="#888888" letter-spacing="2">WATCH</text>
  </g>

  <!-- Decorative border -->
  <rect x="20" y="20" width="1240" height="680" rx="14" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
</svg>`;
}

function createAvatarSvg({ name, tag, initials, bg = '#161616', accent = '#ffffff' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#0a0a0a" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="100" fill="url(#avatarGrad)" />
  <circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="2.5" stroke-opacity="0.3" stroke-dasharray="14 6" />
  <polygon points="100,30 150,100 100,170 50,100" fill="none" stroke="${accent}" stroke-width="1" stroke-opacity="0.2" />
  <text x="100" y="112" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="36" fill="${accent}" text-anchor="middle" letter-spacing="2">${initials}</text>
  <rect x="55" y="145" width="90" height="22" rx="11" fill="#000000" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="100" y="160" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${tag}</text>
</svg>`;
}

// Generate thumbnails
const thumbnails = [
  {
    file: 'thumb_grand_finals.svg',
    title: 'GRAND FINALS 2026 // CHAMPIONS',
    subtitle: 'Reikage Clan vs Shadow Syndicate • Overtime Decider Map',
    badge: 'GRAND FINAL',
    tag: 'CLAN WARS',
    creator: 'Reikage Esports',
    accent: '#ffffff'
  },
  {
    file: 'thumb_lunar_val.svg',
    title: 'LUNAR 1v5 IMPOSSIBLE ACE CLUTCH',
    subtitle: 'Ascent B-Site Retake • Valorant Masters Scrims',
    badge: 'PRO HIGHLIGHT',
    tag: 'MONTAGES',
    creator: 'lunar_reikage',
    accent: '#e0e0e0'
  },
  {
    file: 'thumb_scrim_clutch.svg',
    title: 'TIER-1 SCRIMS: RETAKE PROTOCOL',
    subtitle: 'Voice Comms & Micro-Strategy • Episode 4',
    badge: 'TACTICAL',
    tag: 'SCRIMS',
    creator: 'reikage_admin',
    accent: '#cccccc'
  },
  {
    file: 'thumb_vortex_tactics.svg',
    title: 'HOW REIKAGE READS ENEMY ROTATIONS',
    subtitle: 'IGL In-Depth Tactical Guide & Demo Review',
    badge: 'IGL GUIDE',
    tag: 'TACTICS',
    creator: 'vortex_rk',
    accent: '#ffffff'
  },
  {
    file: 'thumb_zenith_montage.svg',
    title: 'ZENITH // OPERATOR HIGHLIGHT REEL',
    subtitle: 'Aggressive Sniping Montage • 4K 60FPS',
    badge: 'SNIPER REEL',
    tag: 'MONTAGES',
    creator: 'zenith_rk',
    accent: '#ffffff'
  },
  {
    file: 'thumb_shadow_highlights.svg',
    title: 'KAGE SHADOW - APEX CLAN SPREE',
    subtitle: 'Predator Lobby 4K Damage Squad Wipe',
    badge: 'APEX HIGHLIGHT',
    tag: 'HIGHLIGHTS',
    creator: 'kage_shadow',
    accent: '#d4d4d4'
  }
];

thumbnails.forEach(t => {
  fs.writeFileSync(path.join(thumbnailsDir, t.file), createThumbnailSvg(t));
});

// Generate avatars
const avatars = [
  { file: 'avatar_admin.svg', name: 'reikage_admin', tag: 'MASTER', initials: 'RK', bg: '#202020', accent: '#ffffff' },
  { file: 'avatar_lunar.svg', name: 'lunar_reikage', tag: 'FOUNDER', initials: 'LU', bg: '#1c1c1c', accent: '#f0f0f0' },
  { file: 'avatar_kage.svg', name: 'kage_shadow', tag: 'ELITE', initials: 'KS', bg: '#181818', accent: '#e5e5e5' },
  { file: 'avatar_vortex.svg', name: 'vortex_rk', tag: 'IGL', initials: 'VX', bg: '#151515', accent: '#ffffff' },
  { file: 'avatar_zenith.svg', name: 'zenith_rk', tag: 'SNIPER', initials: 'ZN', bg: '#1a1a1a', accent: '#d8d8d8' },
  { file: 'avatar_spectre.svg', name: 'spectre_rk', tag: 'PRO', initials: 'SP', bg: '#141414', accent: '#cccccc' }
];

avatars.forEach(a => {
  fs.writeFileSync(path.join(avatarsDir, a.file), createAvatarSvg(a));
});

console.log('Successfully generated Reikage thumbnails and avatars!');
