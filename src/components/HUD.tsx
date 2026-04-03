/**
 * HUD Component - Iron Man Hologram Style
 * Shows gesture, rotation, time scale, and state info
 */

import type { GestureType } from '../core/gestures';
import { GESTURE_DISPLAY_NAMES, GESTURE_ACTIONS } from '../core/gestures';
import type { RecorderState } from '../features/recorder';

interface HUDProps {
    fps: number;
    gesture: GestureType;
    handCount: number;
    isTracking: boolean;
    recorderState: RecorderState;
    recordingDuration?: number;
    // Iron Man display
    rotation?: { x: number; y: number; z: number };
    timeScale?: number;
    shapeScale?: number;
}

export const HUD: React.FC<HUDProps> = ({
    fps,
    gesture,
    handCount,
    isTracking,
    recorderState,
    recordingDuration = 0,
    rotation = { x: 0, y: 0, z: 0 },
    timeScale = 1,
    shapeScale = 1,
}) => {
    const getFPSColor = () => {
        if (fps >= 55) return '#00ff88';
        if (fps >= 30) return '#ffaa00';
        return '#ff4444';
    };

    const isActiveGesture = gesture !== 'none';

    return (
        <>
            {/* Top Left - Status */}
            <div className="hud fade-in" style={{ top: '20px', left: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                        <span style={{ opacity: 0.5 }}>FPS </span>
                        <span className="hud-value" style={{ color: getFPSColor(), fontSize: '16px' }}>{fps}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isTracking ? '#00ff88' : '#ff4444',
                            boxShadow: isTracking ? '0 0 10px #00ff88' : 'none',
                        }} />
                        <span style={{ opacity: 0.7 }}>
                            {isTracking ? `${handCount} hand${handCount !== 1 ? 's' : ''}` : 'No tracking'}
                        </span>
                    </div>
                </div>

                {/* Current Gesture */}
                {isActiveGesture && (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                            {GESTURE_DISPLAY_NAMES[gesture]}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.6 }}>
                            {GESTURE_ACTIONS[gesture]}
                        </div>
                    </div>
                )}
            </div>

            {/* Top Right - 3D Rotation Display */}
            {isActiveGesture && (
                <div className="hud fade-in" style={{ top: '20px', right: '20px', textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '8px' }}>3D ROTATION</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <div>
                            <span style={{ opacity: 0.5 }}>X </span>
                            <span style={{ color: '#ff4466' }}>{rotation.x}°</span>
                        </div>
                        <div>
                            <span style={{ opacity: 0.5 }}>Y </span>
                            <span style={{ color: '#44ff66' }}>{rotation.y}°</span>
                        </div>
                        <div>
                            <span style={{ opacity: 0.5 }}>Z </span>
                            <span style={{ color: '#4466ff' }}>{rotation.z}°</span>
                        </div>
                    </div>

                    {/* Time Scale */}
                    {timeScale !== 1 && (
                        <div style={{ marginTop: '8px' }}>
                            <span style={{ opacity: 0.5 }}>Time: </span>
                            <span style={{ color: timeScale < 1 ? '#44aaff' : '#ff8844' }}>
                                {timeScale.toFixed(1)}x
                            </span>
                        </div>
                    )}

                    {/* Scale */}
                    {Math.abs(shapeScale - 1) > 0.05 && (
                        <div style={{ marginTop: '4px' }}>
                            <span style={{ opacity: 0.5 }}>Scale: </span>
                            <span style={{ color: '#aa44ff' }}>{(shapeScale * 100).toFixed(0)}%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Recording indicator */}
            {recorderState === 'recording' && (
                <div className="hud fade-in" style={{ bottom: '20px', left: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#ff4444',
                            animation: 'pulse 1s ease-in-out infinite',
                        }} />
                        <span>REC {Math.floor(recordingDuration)}s</span>
                    </div>
                </div>
            )}

            {/* Gesture guide when no hand */}
            {!isTracking && (
                <div className="hud fade-in" style={{
                    bottom: '60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '20px 30px',
                    borderRadius: '12px',
                }}>
                    <div style={{ fontSize: '14px', marginBottom: '12px' }}>🖐️ Show your hand to control</div>
                    <div style={{ fontSize: '10px', opacity: 0.6, lineHeight: 1.8 }}>
                        <div>Open Palm → 3D Rotation</div>
                        <div>Fist → Explode</div>
                        <div>Peace ✌️ → Slow Motion</div>
                        <div>Rock 🤘 → Speed Up</div>
                        <div>Two Hands → Scale & Rotate</div>
                    </div>
                </div>
            )}
        </>
    );
};
