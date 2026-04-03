# Particle Motion UI

An interactive, gesture-controlled particle visualization web app with glassmorphism UI, real-time hand tracking, and stunning visual effects.

![Particle Motion UI](https://via.placeholder.com/800x400?text=Gesture+Controlled+Particles)

## ✨ Features

### Gesture Controls
- **☝️ Point** - Index finger attracts particles to fingertip
- **🤏 Pinch** - Thumb + index triggers particle explosions
- **🖐️ Open Palm** - Push particles away from palm
- **✊ Closed Fist** - Collapse particles inward
- **🙌 Two Hands** - Distance controls density, rotation, and time dilation

### Visual Effects
- 🌸 Bloom and glow post-processing
- 💫 Motion blur
- 🌫️ Depth fog vignette
- 🎨 Animated gradient backgrounds
- ✨ 5 behavior presets: Calm, Chaos, Orbit, Swarm, Galaxy

### UI/UX
- 🪟 Glassmorphism control panel with blur and transparency
- 🌙 Dark mode by default
- 📊 Real-time FPS and gesture HUD
- 🎮 No mouse cursor - hands-only interaction
- 📱 Mobile fallback with touch gestures
- ⛶ Fullscreen mode

### Advanced Features
- 🎤 Audio-reactive particles via microphone
- 🎬 Video recording (WebM with VP9 codec)
- 📸 Screenshot capture (PNG)
- 🔋/🚀 High/Low performance toggle
- ⚡ Automatic GPU-based quality scaling

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in Chrome (required for MediaPipe hand tracking).

## 📁 Project Structure

```
src/
├── core/
│   ├── handtracker.ts    # MediaPipe Hands integration
│   ├── gestures.ts       # Gesture recognition logic
│   ├── particles.ts      # WebGL particle engine (Three.js)
│   ├── postprocessing.ts # Bloom, motion blur, vignette
│   └── touchgestures.ts  # Mobile touch fallback
├── components/
│   ├── ControlPanel.tsx  # Floating settings panel
│   ├── HUD.tsx           # FPS and gesture display
│   └── Canvas.tsx        # WebGL rendering canvas
├── features/
│   ├── audio.ts          # Microphone FFT analysis
│   ├── recorder.ts       # Video/screenshot capture
│   └── performance.ts    # GPU detection, FPS monitoring
├── styles/
│   └── globals.css       # Glassmorphism design system
├── App.tsx               # Main application
└── main.tsx              # Entry point
```

## 🎛️ Controls Reference

| Control | Desktop (Hand) | Mobile (Touch) |
|---------|----------------|----------------|
| Attract particles | Point with index finger | Single finger drag |
| Explosion | Pinch thumb + index | Double two-finger tap |
| Push away | Open palm | Two-finger spread |
| Collapse | Closed fist | Two-finger pinch |
| Density/Time | Move hands apart/together | Three-finger drag |

## 🔧 Extending Gestures

To add new gestures, edit `src/core/gestures.ts`:

```typescript
// 1. Add gesture type
export type GestureType = '...' | 'your_gesture';

// 2. Add detection in detectSingleHandGesture()
if (/* your detection logic */) {
  return { gesture: 'your_gesture', strength: 0.9 };
}

// 3. Add particle effect in particles.ts applyGesture()
case 'your_gesture':
  // Apply forces to particles
  break;
```

## 🎨 Customizing Particles

Edit preset configurations in `src/core/particles.ts`:

```typescript
const PRESET_CONFIG = {
  your_preset: {
    friction: 0.97,      // 0-1 velocity decay
    maxSpeed: 0.025,     // Maximum particle speed
    attractStrength: 0.0005,
    repelStrength: 0.002,
    turbulence: 0.0005,  // Random motion
    orbitFactor: 0.3,    // Orbital tendency
  },
};
```

## ⚙️ Performance Modes

| Mode | Particle Count | Post-Processing | Pixel Ratio |
|------|---------------|-----------------|-------------|
| 🚀 High | Up to 15,000 | Bloom + Motion Blur | Device × 2 |
| 🔋 Low | Up to 5,000 | Disabled | 1x |

The app automatically detects GPU capability and recommends an initial mode.

## 📦 Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Browser Support

- **Desktop**: Chrome 90+ (required for MediaPipe)
- **Mobile**: Chrome/Safari (touch fallback mode)

## 📄 License

MIT
