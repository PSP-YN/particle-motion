/**
 * Particle Motion UI - Main Application
 * Gesture-controlled particle visualization with camera preview
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import './styles/globals.css';

// Core modules
import { HandTracker, getHandTracker } from './core/handtracker';
import type { TrackingResult } from './core/handtracker';
import { recognizeGestures } from './core/gestures';
import type { GestureResult, GestureType } from './core/gestures';
import { ParticleEngine } from './core/particles';
import type { ParticleConfig, ParticlePreset } from './core/particles';
import { PostProcessor, createDefaultPostConfig } from './core/postprocessing';
import { TouchGestureHandler, isTouchDevice } from './core/touchgestures';
import type { ParticleShape } from './core/shapes';
import { getRandomShape } from './core/shapes';
import type { MovementMode } from './core/movements';
import type { NormalizedLandmarkList } from '@mediapipe/hands';

// Feature modules
import { AudioAnalyzer } from './features/audio';
import type { AudioData } from './features/audio';
import { CanvasRecorder } from './features/recorder';
import type { RecorderState } from './features/recorder';
import { PerformanceMonitor, getPerformanceMonitor } from './features/performance';
import type { PerformanceLevel } from './features/performance';

// UI Components
import { ControlPanel } from './components/ControlPanel';
import { HUD } from './components/HUD';
import { Canvas } from './components/Canvas';
import type { CanvasRef } from './components/Canvas';
import { CameraPreview } from './components/CameraPreview';

const App: React.FC = () => {
  // Refs
  const canvasRef = useRef<CanvasRef>(null);
  const particleEngineRef = useRef<ParticleEngine | null>(null);
  const postProcessorRef = useRef<PostProcessor | null>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const touchHandlerRef = useRef<TouchGestureHandler | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const recorderRef = useRef<CanvasRecorder | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [fps, setFps] = useState(60);
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Configuration state
  const [particleCount, setParticleCount] = useState(5000);
  const [particleSize, setParticleSize] = useState(0.2);  // Very small default - barely visible
  const [color1, setColor1] = useState('#ffffff');
  const [color2, setColor2] = useState('#88ccff');
  const [preset, setPreset] = useState<ParticlePreset>('calm');
  const [shape, setShape] = useState<ParticleShape>('sphere');
  const [movement, setMovement] = useState<MovementMode>('float');
  const [performanceMode, setPerformanceMode] = useState<PerformanceLevel>('high');
  const [autoChangeShape, setAutoChangeShape] = useState(false);

  // Camera preview state
  const [cameraVisible, setCameraVisible] = useState(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [handLandmarks, setHandLandmarks] = useState<NormalizedLandmarkList[]>([]);

  // Iron Man display state
  const [rotation3D, setRotation3D] = useState({ x: 0, y: 0, z: 0 });
  const [timeScale, setTimeScale] = useState(1);
  const [shapeScale, setShapeScale] = useState(1);

  /**
   * Initialize all systems
   */
  const initialize = useCallback(async (canvas: HTMLCanvasElement) => {
    performanceMonitorRef.current = getPerformanceMonitor();
    const initialLevel = performanceMonitorRef.current.getInitialLevel();
    setPerformanceMode(initialLevel);

    const initialCount = performanceMonitorRef.current.getRecommendedParticleCount();
    setParticleCount(initialCount);

    // Particle engine configuration
    const particleConfig: ParticleConfig = {
      count: initialCount,
      color1,
      color2,
      preset,
      shape,
      movement,
      particleSize,
      performanceMode: initialLevel,
      bloomEnabled: initialLevel === 'high',
      motionBlurEnabled: false,
    };

    particleEngineRef.current = new ParticleEngine(canvas, particleConfig);

    const postConfig = createDefaultPostConfig(initialLevel);
    postProcessorRef.current = new PostProcessor(
      particleEngineRef.current.getRenderer(),
      particleEngineRef.current.getScene(),
      particleEngineRef.current.getCamera(),
      postConfig
    );

    recorderRef.current = new CanvasRecorder(canvas);
    recorderRef.current.setOnStateChange(setRecorderState);

    // Initialize input handling
    if (isTouchDevice()) {
      touchHandlerRef.current = new TouchGestureHandler(canvas);
      touchHandlerRef.current.onGesture(handleGesture);
      setIsTracking(true);
    } else {
      handTrackerRef.current = getHandTracker();
      const trackingInitialized = await handTrackerRef.current.initialize();

      if (trackingInitialized) {
        setVideoElement(handTrackerRef.current.getVideoElement());
        handTrackerRef.current.onTrack(handleTrackingResult);
        handTrackerRef.current.start();
        setIsTracking(true);
      }
    }

    setIsInitialized(true);
    startRenderLoop();
  }, [color1, color2, preset, shape, movement]);

  /**
   * Handle hand tracking results
   */
  const handleTrackingResult = useCallback((result: TrackingResult) => {
    setHandCount(result.hands.length);

    // Store landmarks for camera preview
    const landmarks = result.hands.map(h => h.landmarks);
    setHandLandmarks(landmarks);

    // Recognize gestures and apply
    const gesture = recognizeGestures(result.hands);
    handleGesture(gesture);

    // Update Iron Man display from particle engine
    if (particleEngineRef.current) {
      setRotation3D(particleEngineRef.current.getRotation());
      setTimeScale(particleEngineRef.current.getTimeScale());
      setShapeScale(particleEngineRef.current.getShapeScale());
    }
  }, []);

  /**
   * Handle gesture updates
   */
  const handleGesture = useCallback((gesture: GestureResult) => {
    setCurrentGesture(gesture.gesture);
    if (particleEngineRef.current) {
      particleEngineRef.current.applyGesture(gesture);
    }
  }, []);

  /**
   * Handle audio data
   */
  const handleAudioData = useCallback((data: AudioData) => {
    if (!particleEngineRef.current) return;
    if (data.isBeat) {
      const gesture: GestureResult = {
        gesture: 'closed_fist',
        position: { x: 0.5, y: 0.5, z: 0 },
        strength: data.bass,
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        palmFacing: 'camera',
      };
      particleEngineRef.current.applyGesture(gesture);
    }
  }, []);

  /**
   * Main render loop
   */
  const startRenderLoop = useCallback(() => {
    const render = (time: number) => {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      performanceMonitorRef.current?.tick();

      const metrics = performanceMonitorRef.current?.getMetrics();
      if (metrics) {
        setFps(metrics.fps);
      }

      if (particleEngineRef.current) {
        particleEngineRef.current.update(deltaTime);
      }

      if (postProcessorRef.current && performanceMode === 'high') {
        postProcessorRef.current.render();
      } else if (particleEngineRef.current) {
        particleEngineRef.current.render();
      }

      if (recorderRef.current && recorderState === 'recording') {
        setRecordingDuration(recorderRef.current.getDuration());
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
  }, [performanceMode, recorderState]);

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(async () => {
    if (audioEnabled) {
      audioAnalyzerRef.current?.stop();
      audioAnalyzerRef.current?.destroy();
      audioAnalyzerRef.current = null;
      setAudioEnabled(false);
    } else {
      audioAnalyzerRef.current = new AudioAnalyzer();
      const initialized = await audioAnalyzerRef.current.initialize();
      if (initialized) {
        audioAnalyzerRef.current.onAudio(handleAudioData);
        audioAnalyzerRef.current.start();
        setAudioEnabled(true);
      }
    }
  }, [audioEnabled, handleAudioData]);

  /**
   * Toggle recording
   */
  const toggleRecording = useCallback(() => {
    if (!recorderRef.current) return;
    if (recorderState === 'recording') {
      recorderRef.current.stopRecording();
    } else if (recorderState === 'idle') {
      recorderRef.current.startRecording();
    }
  }, [recorderState]);

  /**
   * Take screenshot
   */
  const takeScreenshot = useCallback(() => {
    recorderRef.current?.takeScreenshot();
  }, []);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  /**
   * Update particle configuration
   */
  useEffect(() => {
    if (!particleEngineRef.current) return;

    particleEngineRef.current.updateConfig({
      count: particleCount,
      color1,
      color2,
      preset,
      shape,
      movement,
      particleSize,
      performanceMode,
      bloomEnabled: performanceMode === 'high',
      motionBlurEnabled: false,
    });

    if (postProcessorRef.current) {
      const postConfig = createDefaultPostConfig(performanceMode);
      postProcessorRef.current.updateConfig(postConfig);
      postProcessorRef.current.setEnabled(performanceMode === 'high');
    }
  }, [particleCount, particleSize, color1, color2, preset, shape, movement, performanceMode]);

  /**
   * Auto-change shape every 5 seconds when enabled
   */
  useEffect(() => {
    if (!autoChangeShape) return;

    const interval = setInterval(() => {
      setShape(getRandomShape());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoChangeShape]);

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      handTrackerRef.current?.destroy();
      touchHandlerRef.current?.destroy();
      audioAnalyzerRef.current?.destroy();
      particleEngineRef.current?.destroy();
      postProcessorRef.current?.destroy();
      recorderRef.current?.destroy();
    };
  }, []);

  return (
    <>
      {/* Black Background */}
      <div className="animated-bg" />

      {/* Particle Canvas */}
      <Canvas ref={canvasRef} onCanvasReady={initialize} />

      {/* Camera Preview with Hand Skeleton */}
      <CameraPreview
        videoElement={videoElement}
        landmarks={handLandmarks}
        isVisible={cameraVisible}
        onToggle={() => setCameraVisible(!cameraVisible)}
      />

      {/* HUD */}
      <HUD
        fps={fps}
        gesture={currentGesture}
        handCount={handCount}
        isTracking={isTracking}
        recorderState={recorderState}
        recordingDuration={recordingDuration}
        rotation={rotation3D}
        timeScale={timeScale}
        shapeScale={shapeScale}
      />

      {/* Control Panel */}
      <ControlPanel
        particleCount={particleCount}
        onParticleCountChange={setParticleCount}
        particleSize={particleSize}
        onParticleSizeChange={setParticleSize}
        color1={color1}
        color2={color2}
        onColor1Change={setColor1}
        onColor2Change={setColor2}
        preset={preset}
        onPresetChange={setPreset}
        shape={shape}
        onShapeChange={setShape}
        autoChangeShape={autoChangeShape}
        onAutoChangeToggle={() => setAutoChangeShape(!autoChangeShape)}
        movement={movement}
        onMovementChange={setMovement}
        performanceMode={performanceMode}
        onPerformanceModeChange={setPerformanceMode}
        audioEnabled={audioEnabled}
        onAudioToggle={toggleAudio}
        recorderState={recorderState}
        onRecordToggle={toggleRecording}
        onScreenshot={takeScreenshot}
        onFullscreen={toggleFullscreen}
      />

      {/* Loading Overlay */}
      {!isInitialized && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            zIndex: 1000,
          }}
        >
          <div className="glass-panel pulse" style={{ padding: '30px 50px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>✨</div>
            <div style={{ fontSize: '14px', letterSpacing: '2px' }}>INITIALIZING</div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
