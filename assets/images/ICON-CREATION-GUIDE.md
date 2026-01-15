# App Icon Creation Guide

## Icon Design Requirements

### Brand Concept
Iron Faith represents strength and spirituality combined. The icon should convey:
- **Faith/Spirituality:** Christian symbolism (cross, book, dove, light)
- **Strength:** Iron/steel metaphor, solid foundation, durability
- **Modern:** Clean, contemporary design that works at all sizes

### Design Specifications

**Master Icon:** 1024x1024px PNG
- RGB color mode
- Transparent or solid background
- 72 DPI minimum
- No alpha transparency in corners for iOS

**Design Guidelines:**
- Simple, recognizable shape
- Works well at small sizes (16x16 to 1024x1024)
- Distinct silhouette
- Avoids text (icons don't scale well)
- Single focal point
- High contrast

## Recommended Design Concepts

### Concept 1: Cross + Shield
- Stylized cross inside a shield
- Represents faith (cross) and strength (shield)
- Colors: Deep blue (#2563EB) with white/silver accents
- Modern, geometric style

### Concept 2: Open Book + Light
- Open Bible with light/glow emanating
- Represents Scripture and enlightenment
- Colors: Warm gold/amber with deep blue
- Subtle gradient for depth

### Concept 3: Mountain + Cross
- Mountain silhouette with cross at peak
- Represents faith journey and spiritual strength
- Colors: Gradient from deep blue to lighter blue
- Minimalist, iconic style

## Color Palette

**Primary Colors:**
- Primary Blue: #2563EB
- Dark Blue: #1E40AF
- Light Blue: #3B82F6

**Accent Colors:**
- White: #FFFFFF
- Gold: #F59E0B
- Silver: #9CA3AF

**Background:**
- iOS: White (#FFFFFF) or gradient
- Android Adaptive: White (#FFFFFF)

## Required Sizes

### iOS (icon.png in app.json)
All sizes should be generated from 1024x1024 master:

- **App Icon:**
  - 1024x1024 (App Store)
  - 180x180 (iPhone @3x)
  - 167x167 (iPad Pro)
  - 152x152 (iPad @2x)
  - 120x120 (iPhone @2x)
  - 87x87 (iPhone @3x Settings)
  - 80x80 (iPad @2x Spotlight)
  - 76x76 (iPad)
  - 60x60 (iPhone @2x Spotlight)
  - 58x58 (iPhone @2x Settings)
  - 40x40 (Spotlight)
  - 29x29 (Settings)
  - 20x20 (Notifications)

### Android (adaptive-icon.png)
Adaptive icon consists of two layers:
- **Foreground:** 1024x1024 (icon within safe zone 432x432)
- **Background:** 1024x1024 (solid color or subtle pattern)
- **Safe Zone:** Keep important elements in center 432x432

Common sizes generated:
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)

### Web (favicon.png)
- 192x192 (PWA)
- 32x32 (Standard favicon)
- 16x16 (Browser tab)

### Splash Screen
- 2732x2732 (iOS, centered on white/colored background)
- Icon centered with plenty of breathing room

## Creation Process

### Option 1: Design Tool (Recommended)
1. Use Figma, Sketch, Adobe Illustrator, or similar
2. Create artboard at 1024x1024px
3. Design icon following guidelines above
4. Export as PNG (no alpha for iOS)
5. Use icon generator tool or Expo's asset generation

### Option 2: Icon Generator Services
- **App Icon Generator:** https://appicon.co
- **Expo Asset Generation:** Built into EAS
- **MakeAppIcon:** https://makeappicon.com

Upload your 1024x1024 master and generate all sizes automatically.

### Option 3: Simple SVG to PNG
Create a simple SVG icon and convert to PNG at various sizes:

```svg
<!-- Example: Simple Cross Icon -->
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#2563EB"/>
  <rect x="462" y="200" width="100" height="624" fill="white" rx="10"/>
  <rect x="300" y="462" width="424" height="100" fill="white" rx="10"/>
</svg>
```

## Tools for Icon Creation

**Free:**
- Figma (free tier)
- Inkscape (open source)
- GIMP (open source)
- Canva (free tier)

**Paid:**
- Adobe Illustrator
- Sketch
- Affinity Designer

**Icon Generators:**
- https://appicon.co
- https://makeappicon.com
- https://icon.kitchen

## Expo Icon Generation

Expo can automatically generate all required icon sizes from your 1024x1024 master:

```bash
# Install eas-cli
npm install -g eas-cli

# Generate icons automatically during build
eas build --platform ios
eas build --platform android
```

The build process will:
1. Read icon path from app.json
2. Generate all required sizes
3. Apply to app bundle automatically

## File Locations

After creation, place files here:

```
assets/images/
├── icon.png              # 1024x1024 master (iOS)
├── adaptive-icon.png     # 1024x1024 adaptive foreground (Android)
├── favicon.png           # 192x192 or 512x512 (Web)
└── splash.png            # 2732x2732 (Splash screen)
```

## Testing Your Icon

1. **Test at multiple sizes:** Ensure legibility from 16x16 to 1024x1024
2. **Test on different backgrounds:** White, black, colored
3. **Test in context:** Home screen, app store, notifications
4. **Check iOS safe area:** No important content in outer corners
5. **Android adaptive preview:** Test with different shapes (circle, square, rounded)

## Current Status

⚠️ **ACTION REQUIRED:** The current icon files are placeholders.

**Next Steps:**
1. Create 1024x1024 master icon following design concepts above
2. Use icon generator service or design tool
3. Replace placeholder files in assets/images/
4. Test icon at various sizes
5. Run build to generate all required sizes

## Resources

- **Apple HIG Icons:** https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Android Adaptive Icons:** https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
- **Expo Assets:** https://docs.expo.dev/develop/user-interface/assets/
- **Icon Design Best Practices:** https://www.youtube.com/watch?v=NfPHyN3FTXs
