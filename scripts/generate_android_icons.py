import os
import subprocess

# SVG Definitions
SVG_FOREGROUND = '''<svg width="432" height="432" viewBox="0 0 432 432" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
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
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#3B82F6" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Scale and translate PocketDB Logo to fit 432x432 canvas in the central 260px safe zone -->
  <g transform="translate(86, 86) scale(2.6)">
    <!-- Pocket Outer Contour -->
    <path
      d="M 22 18 
         C 22 18, 50 14, 78 18 
         C 82 18.5, 85 21.5, 85 25.5 
         L 85 58 
         C 85 75, 68 88, 50 91 
         C 32 88, 15 75, 15 58 
         L 15 25.5 
         C 15 21.5, 18 18.5, 22 18 Z"
      fill="url(#pocketBodyGrad)"
      stroke="url(#pocketBorderGrad)"
      stroke-width="3.5"
      stroke-linejoin="round"
      filter="url(#pocketGlow)"
    />

    <!-- Top Pocket Stitch Accent -->
    <path
      d="M 23 28 C 36 25, 64 25, 77 28"
      stroke="#60A5FA"
      stroke-width="1.5"
      stroke-dasharray="3 2"
      stroke-linecap="round"
      opacity="0.8"
    />

    <!-- Database Platter 1: Cyan / Blue -->
    <g>
      <path
        d="M 30 35 C 30 31.5, 40 29, 50 29 C 60 29, 70 31.5, 70 35 L 70 41 C 70 44.5, 60 47, 50 47 C 40 47, 30 44.5, 30 41 Z"
        fill="url(#dbTopGrad)"
      />
      <ellipse cx="50" cy="35" rx="20" ry="6" fill="#67E8F9" opacity="0.9" />
      <circle cx="50" cy="35" r="2.5" fill="#0E7490" />
      <circle cx="63" cy="37" r="1.5" fill="#FFFFFF" />
    </g>

    <!-- Database Platter 2: Cobalt -->
    <g>
      <path
        d="M 30 49 C 30 46, 40 43.5, 50 43.5 C 60 43.5, 70 46, 70 49 L 70 56 C 70 59.5, 60 62, 50 62 C 40 62, 30 59.5, 30 56 Z"
        fill="url(#dbMidGrad)"
      />
      <ellipse cx="50" cy="49" rx="20" ry="5.5" fill="#93C5FD" opacity="0.8" />
      <rect x="42" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.85" />
      <rect x="52" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.85" />
    </g>

    <!-- Database Platter 3: Emerald Local Storage -->
    <g>
      <path
        d="M 32 64 C 32 61.5, 41 59, 50 59 C 59 59, 68 61.5, 68 64 L 68 70 C 68 73.5, 59 76, 50 76 C 41 76, 32 73.5, 32 70 Z"
        fill="url(#dbBaseGrad)"
      />
      <ellipse cx="50" cy="64" rx="18" ry="5" fill="#6EE7B7" opacity="0.8" />
      <circle cx="50" cy="68" r="1.75" fill="#FFFFFF" />
    </g>

    <!-- Bottom Pocket Rivet -->
    <circle cx="50" cy="84" r="2" fill="#38BDF8" opacity="0.85" />
  </g>
</svg>'''

SVG_FULL = '''<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
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

  <!-- Background Base -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="100" stroke="#1E293B" stroke-width="4" />

  <!-- Subtle Developer Grid Lines -->
  <path d="M 0 128 L 512 128 M 0 256 L 512 256 M 0 384 L 512 384 M 128 0 L 128 512 M 256 0 L 256 512 M 384 0 L 384 512" stroke="#38BDF8" stroke-opacity="0.04" stroke-width="2" />

  <!-- Centered PocketDB Logo Mark -->
  <g transform="translate(86, 86) scale(3.4)">
    <path
      d="M 22 18 
         C 22 18, 50 14, 78 18 
         C 82 18.5, 85 21.5, 85 25.5 
         L 85 58 
         C 85 75, 68 88, 50 91 
         C 32 88, 15 75, 15 58 
         L 15 25.5 
         C 15 21.5, 18 18.5, 22 18 Z"
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
</svg>'''

SVG_ROUND = '''<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
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

  <!-- Circular Mask Background -->
  <circle cx="256" cy="256" r="256" fill="url(#bgGrad)" />
  <circle cx="256" cy="256" r="254" stroke="#1E293B" stroke-width="4" />

  <!-- Subtle Developer Grid Lines -->
  <path d="M 0 128 L 512 128 M 0 256 L 512 256 M 0 384 L 512 384 M 128 0 L 128 512 M 256 0 L 256 512 M 384 0 L 384 512" stroke="#38BDF8" stroke-opacity="0.04" stroke-width="2" />

  <!-- Centered PocketDB Logo Mark -->
  <g transform="translate(86, 86) scale(3.4)">
    <path
      d="M 22 18 
         C 22 18, 50 14, 78 18 
         C 82 18.5, 85 21.5, 85 25.5 
         L 85 58 
         C 85 75, 68 88, 50 91 
         C 32 88, 15 75, 15 58 
         L 15 25.5 
         C 15 21.5, 18 18.5, 22 18 Z"
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
</svg>'''

os.makedirs('temp_icons', exist_ok=True)
with open('temp_icons/foreground.svg', 'w') as f:
    f.write(SVG_FOREGROUND)
with open('temp_icons/full.svg', 'w') as f:
    f.write(SVG_FULL)
with open('temp_icons/round.svg', 'w') as f:
    f.write(SVG_ROUND)

# Densities and sizes
densities = {
    'mipmap-mdpi': {'icon': 48, 'foreground': 108},
    'mipmap-hdpi': {'icon': 72, 'foreground': 162},
    'mipmap-xhdpi': {'icon': 96, 'foreground': 216},
    'mipmap-xxhdpi': {'icon': 144, 'foreground': 324},
    'mipmap-xxxhdpi': {'icon': 192, 'foreground': 432},
}

base_res = 'android/app/src/main/res'

for folder, sizes in densities.items():
    target_dir = os.path.join(base_res, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    icon_sz = sizes['icon']
    fg_sz = sizes['foreground']
    
    # 1. ic_launcher.png
    cmd1 = ['convert', '-background', 'none', '-size', f'{icon_sz}x{icon_sz}', 'temp_icons/full.svg', os.path.join(target_dir, 'ic_launcher.png')]
    subprocess.run(cmd1, check=True)
    
    # 2. ic_launcher_round.png
    cmd2 = ['convert', '-background', 'none', '-size', f'{icon_sz}x{icon_sz}', 'temp_icons/round.svg', os.path.join(target_dir, 'ic_launcher_round.png')]
    subprocess.run(cmd2, check=True)
    
    # 3. ic_launcher_foreground.png
    cmd3 = ['convert', '-background', 'none', '-size', f'{fg_sz}x{fg_sz}', 'temp_icons/foreground.svg', os.path.join(target_dir, 'ic_launcher_foreground.png')]
    subprocess.run(cmd3, check=True)
    
    print(f"Generated icons for {folder}: ic_launcher ({icon_sz}px), ic_launcher_round ({icon_sz}px), ic_launcher_foreground ({fg_sz}px)")

print("All Android launcher icon PNGs generated successfully!")
