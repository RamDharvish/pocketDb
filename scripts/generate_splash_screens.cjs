const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function getSplashSvg(w, h) {
  const isLand = w > h;
  const logoSize = isLand ? Math.min(h * 0.45, 180) : Math.min(w * 0.35, 180);
  const logoX = (w - logoSize) / 2;
  const logoY = isLand ? (h - logoSize) / 2 - 20 : (h - logoSize) / 2 - 40;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="${w}" y2="${h}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>

    <linearGradient id="pocketBorderGrad" x1="10" y1="10" x2="90" y2="95" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>

    <linearGradient id="pocketBodyGrad" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <linearGradient id="dbTopGrad" x1="28" y1="26" x2="72" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>

    <linearGradient id="dbMidGrad" x1="28" y1="46" x2="72" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>

    <linearGradient id="dbBaseGrad" x1="28" y1="64" x2="72" y2="78" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <filter id="pocketGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#3B82F6" flood-opacity="0.5" />
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bgGrad)" />

  <g transform="translate(${logoX}, ${logoY}) scale(${logoSize / 100})">
    <path
      d="M 22 18 C 22 18, 50 14, 78 18 C 82 18.5, 85 21.5, 85 25.5 L 85 58 C 85 75, 68 88, 50 91 C 32 88, 15 75, 15 58 L 15 25.5 C 15 21.5, 18 18.5, 22 18 Z"
      fill="url(#pocketBodyGrad)"
      stroke="url(#pocketBorderGrad)"
      stroke-width="3.5"
      stroke-linejoin="round"
      filter="url(#pocketGlow)"
    />

    <path
      d="M 23 28 C 36 25, 64 25, 77 28"
      stroke="#60A5FA"
      stroke-width="1.5"
      stroke-dasharray="3 2"
      stroke-linecap="round"
      opacity="0.8"
    />

    <g>
      <path
        d="M 30 35 C 30 31.5, 40 29, 50 29 C 60 29, 70 31.5, 70 35 L 70 41 C 70 44.5, 60 47, 50 47 C 40 47, 30 44.5, 30 41 Z"
        fill="url(#dbTopGrad)"
      />
      <ellipse cx="50" cy="35" rx="20" ry="6" fill="#67E8F9" opacity="0.9" />
      <circle cx="50" cy="35" r="2.5" fill="#0E7490" />
      <circle cx="63" cy="37" r="1.5" fill="#FFFFFF" />
    </g>

    <g>
      <path
        d="M 30 49 C 30 46, 40 43.5, 50 43.5 C 60 43.5, 70 46, 70 49 L 70 56 C 70 59.5, 60 62, 50 62 C 40 62, 30 59.5, 30 56 Z"
        fill="url(#dbMidGrad)"
      />
      <ellipse cx="50" cy="49" rx="20" ry="5.5" fill="#93C5FD" opacity="0.8" />
      <rect x="42" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.85" />
      <rect x="52" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.85" />
    </g>

    <g>
      <path
        d="M 32 64 C 32 61.5, 41 59, 50 59 C 59 59, 68 61.5, 68 64 L 68 70 C 68 73.5, 59 76, 50 76 C 41 76, 32 73.5, 32 70 Z"
        fill="url(#dbBaseGrad)"
      />
      <ellipse cx="50" cy="64" rx="18" ry="5" fill="#6EE7B7" opacity="0.8" />
      <circle cx="50" cy="68" r="1.75" fill="#FFFFFF" />
    </g>

    <circle cx="50" cy="84" r="2" fill="#38BDF8" opacity="0.85" />
  </g>

  <!-- Wordmark -->
  <text x="${w / 2}" y="${logoY + logoSize + 36}" text-anchor="middle" font-family="monospace, sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" letter-spacing="1">Pocket<tspan fill="#3B82F6">DB</tspan></text>
  <text x="${w / 2}" y="${logoY + logoSize + 60}" text-anchor="middle" font-family="sans-serif" font-weight="500" font-size="12" fill="#94A3B8" letter-spacing="0.5">Your finances. Your device. Your database.</text>
</svg>`;
}

async function main() {
  const splashSizes = {
    'drawable': [480, 800],
    'drawable-port-mdpi': [320, 480],
    'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600],
    'drawable-port-xxxhdpi': [1280, 1920],
    'drawable-land-mdpi': [480, 320],
    'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1600, 960],
    'drawable-land-xxxhdpi': [1920, 1280],
  };

  const baseRes = path.join(__dirname, '../android/app/src/main/res');

  for (const [folder, [w, h]] of Object.entries(splashSizes)) {
    const targetDir = path.join(baseRes, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const svgStr = getSplashSvg(w, h);
    await sharp(Buffer.from(svgStr)).png().toFile(path.join(targetDir, 'splash.png'));
    console.log(`Generated splash for ${folder}: ${w}x${h}`);
  }

  console.log('All splash screens generated successfully!');
}

main().catch(err => {
  console.error('Error generating splash screens:', err);
  process.exit(1);
});
