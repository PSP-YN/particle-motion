/**
 * Enhanced Control Panel Component
 * Full controls for particles, shapes, movements, and settings
 */

import { useState } from 'react';
import type { ParticlePreset } from '../core/particles';
import type { ParticleShape } from '../core/shapes';
import type { MovementMode } from '../core/movements';
import type { PerformanceLevel } from '../features/performance';
import type { RecorderState } from '../features/recorder';
import { PARTICLE_SHAPES, SHAPE_LIST } from '../core/shapes';
import { MOVEMENT_MODES, MOVEMENT_LIST } from '../core/movements';

interface ControlPanelProps {
    particleCount: number;
    onParticleCountChange: (count: number) => void;
    particleSize: number;
    onParticleSizeChange: (size: number) => void;
    color1: string;
    color2: string;
    onColor1Change: (color: string) => void;
    onColor2Change: (color: string) => void;
    preset: ParticlePreset;
    onPresetChange: (preset: ParticlePreset) => void;
    shape: ParticleShape;
    onShapeChange: (shape: ParticleShape) => void;
    autoChangeShape: boolean;
    onAutoChangeToggle: () => void;
    movement: MovementMode;
    onMovementChange: (movement: MovementMode) => void;
    performanceMode: PerformanceLevel;
    onPerformanceModeChange: (mode: PerformanceLevel) => void;
    audioEnabled: boolean;
    onAudioToggle: () => void;
    recorderState: RecorderState;
    onRecordToggle: () => void;
    onScreenshot: () => void;
    onFullscreen: () => void;
}

const PRESETS: { id: ParticlePreset; name: string; icon: string }[] = [
    { id: 'calm', name: 'Calm', icon: '🌊' },
    { id: 'chaotic', name: 'Chaos', icon: '⚡' },
    { id: 'orbital', name: 'Orbit', icon: '🪐' },
    { id: 'swarm', name: 'Swarm', icon: '🐝' },
    { id: 'galaxy', name: 'Galaxy', icon: '🌌' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
    particleCount,
    onParticleCountChange,
    particleSize,
    onParticleSizeChange,
    color1,
    color2,
    onColor1Change,
    onColor2Change,
    preset,
    onPresetChange,
    shape,
    onShapeChange,
    autoChangeShape,
    onAutoChangeToggle,
    movement,
    onMovementChange,
    performanceMode,
    onPerformanceModeChange,
    audioEnabled,
    onAudioToggle,
    recorderState,
    onRecordToggle,
    onScreenshot,
    onFullscreen,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'main' | 'shapes' | 'movement' | 'actions'>('main');
    const [inputValue, setInputValue] = useState(String(particleCount));

    const handleCountInput = (value: string) => {
        setInputValue(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 2 && num <= 30000) {
            onParticleCountChange(num);
        }
    };

    const adjustCount = (delta: number) => {
        const newCount = Math.max(2, Math.min(30000, particleCount + delta));
        setInputValue(String(newCount));
        onParticleCountChange(newCount);
    };

    return (
        <div
            className="glass-panel fade-in"
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                width: isCollapsed ? '60px' : '320px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: isCollapsed ? '12px' : '16px',
                zIndex: 100,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '12px' }}>
                {!isCollapsed && <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>CONTROLS</h2>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="glass-button" style={{ padding: '6px 10px', fontSize: '11px' }}>
                    {isCollapsed ? '◀' : '▶'}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                        {(['main', 'shapes', 'movement', 'actions'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`glass-button ${activeTab === tab ? 'active' : ''}`}
                                style={{ flex: 1, padding: '6px 4px', fontSize: '10px', textTransform: 'uppercase' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Main Tab */}
                    {activeTab === 'main' && (
                        <>
                            {/* Particle Count with Number Input */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    PARTICLES (2 - 30,000)
                                </label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <button onClick={() => adjustCount(-100)} className="glass-button" style={{ padding: '4px 8px', fontSize: '12px' }}>-100</button>
                                    <button onClick={() => adjustCount(-10)} className="glass-button" style={{ padding: '4px 8px', fontSize: '12px' }}>-10</button>
                                    <input
                                        type="number"
                                        min="2"
                                        max="30000"
                                        value={inputValue}
                                        onChange={(e) => handleCountInput(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '6px',
                                            padding: '6px 8px',
                                            color: 'var(--accent-primary)',
                                            fontSize: '14px',
                                            textAlign: 'center',
                                            outline: 'none',
                                        }}
                                    />
                                    <button onClick={() => adjustCount(10)} className="glass-button" style={{ padding: '4px 8px', fontSize: '12px' }}>+10</button>
                                    <button onClick={() => adjustCount(100)} className="glass-button" style={{ padding: '4px 8px', fontSize: '12px' }}>+100</button>
                                </div>
                            </div>

                            {/* Particle Size Slider */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    SIZE: {particleSize.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="3"
                                    step="0.05"
                                    value={particleSize}
                                    onChange={(e) => onParticleSizeChange(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
                                    <span>Tiny</span>
                                    <span>Large</span>
                                </div>
                            </div>

                            {/* Colors */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>COLORS</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="color" value={color1} onChange={(e) => onColor1Change(e.target.value)} />
                                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                    <input type="color" value={color2} onChange={(e) => onColor2Change(e.target.value)} />
                                </div>
                            </div>

                            {/* Presets */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>BEHAVIOR</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                                    {PRESETS.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => onPresetChange(p.id)}
                                            className={`preset-card ${preset === p.id ? 'selected' : ''}`}
                                            style={{ textAlign: 'center', padding: '8px 2px' }}
                                            title={p.name}
                                        >
                                            <span style={{ fontSize: '16px' }}>{p.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Performance */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => onPerformanceModeChange('low')}
                                        className={`glass-button ${performanceMode === 'low' ? 'active' : ''}`}
                                        style={{ flex: 1, fontSize: '11px' }}
                                    >🔋 Low</button>
                                    <button
                                        onClick={() => onPerformanceModeChange('high')}
                                        className={`glass-button ${performanceMode === 'high' ? 'active' : ''}`}
                                        style={{ flex: 1, fontSize: '11px' }}
                                    >🚀 High</button>
                                </div>
                            </div>

                            {/* Audio & Capture */}
                            <div style={{ marginBottom: '16px' }}>
                                <button
                                    onClick={onAudioToggle}
                                    className={`glass-button ${audioEnabled ? 'active' : ''}`}
                                    style={{ width: '100%', fontSize: '11px', marginBottom: '6px' }}
                                >🎤 {audioEnabled ? 'Audio ON' : 'Audio'}</button>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={onRecordToggle} className={`glass-button ${recorderState === 'recording' ? 'active' : ''}`} style={{ flex: 1, fontSize: '11px' }}>
                                        {recorderState === 'recording' ? '⏹️ Stop' : '⏺️ Rec'}
                                    </button>
                                    <button onClick={onScreenshot} className="glass-button" style={{ flex: 1, fontSize: '11px' }}>📷</button>
                                    <button onClick={onFullscreen} className="glass-button" style={{ flex: 1, fontSize: '11px' }}>⛶</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Shapes Tab */}
                    {activeTab === 'shapes' && (
                        <div>
                            {/* Auto-change toggle */}
                            <button
                                onClick={onAutoChangeToggle}
                                className={`glass-button ${autoChangeShape ? 'active' : ''}`}
                                style={{ width: '100%', marginBottom: '12px', fontSize: '11px', padding: '8px' }}
                            >
                                🎲 {autoChangeShape ? 'Auto-Change ON (5s)' : 'Auto-Change Shape'}
                            </button>
                            {/* Shape grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                                {SHAPE_LIST.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => onShapeChange(s)}
                                        className={`preset-card ${shape === s ? 'selected' : ''}`}
                                        style={{ textAlign: 'center', padding: '6px 2px' }}
                                        title={PARTICLE_SHAPES[s].name}
                                    >
                                        <div style={{ fontSize: '16px' }}>{PARTICLE_SHAPES[s].icon}</div>
                                        <div style={{ fontSize: '7px', marginTop: '1px', opacity: 0.6 }}>{PARTICLE_SHAPES[s].name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Movement Tab */}
                    {activeTab === 'movement' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                            {MOVEMENT_LIST.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => onMovementChange(m)}
                                    className={`preset-card ${movement === m ? 'selected' : ''}`}
                                    style={{ textAlign: 'left', padding: '10px' }}
                                >
                                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>{MOVEMENT_MODES[m].icon} {MOVEMENT_MODES[m].name}</div>
                                    <div style={{ fontSize: '9px', opacity: 0.6 }}>{MOVEMENT_MODES[m].description}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Sensitivity Tab */}
                    {activeTab === 'actions' && (
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                SENSITIVITY CONTROL
                            </div>
                            <div style={{ fontSize: '11px', lineHeight: 1.8, marginBottom: '16px' }}>
                                <p style={{ marginBottom: '12px' }}>
                                    <strong style={{ color: 'var(--accent-primary)' }}>How it works:</strong>
                                </p>
                                <p>Move your hand to attract particles toward your position.</p>
                                <p style={{ marginTop: '8px' }}>
                                    <strong>More visible points = Higher sensitivity</strong>
                                </p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ fontSize: '10px', marginBottom: '8px', opacity: 0.7 }}>SENSITIVITY SCALE</div>
                                <div style={{ fontSize: '11px', lineHeight: 1.6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>5 points</span>
                                        <span style={{ color: '#00ff88' }}>~83%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>21 points (1 hand)</span>
                                        <span style={{ color: '#ffaa00' }}>~190%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>42 points (2 hands)</span>
                                        <span style={{ color: '#ff4444' }}>~330%</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Show more fingers for stronger control
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
