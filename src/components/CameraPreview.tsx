/**
 * Camera Preview Component
 * Shows camera feed with hand landmark overlay
 */

import { useEffect, useRef, useState } from 'react';
import type { NormalizedLandmarkList } from '@mediapipe/hands';

// Hand landmark connections for drawing skeleton
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17],            // Palm
];

interface CameraPreviewProps {
    videoElement: HTMLVideoElement | null;
    landmarks: NormalizedLandmarkList[];
    isVisible: boolean;
    onToggle: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
    videoElement,
    landmarks,
    isVisible,
    onToggle,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size] = useState({ width: 320, height: 240 });

    useEffect(() => {
        if (!isVisible || !canvasRef.current || !videoElement) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            // Draw video feed (mirrored)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(videoElement, -size.width, 0, size.width, size.height);
            ctx.restore();

            // Draw hand landmarks
            landmarks.forEach((hand, handIndex) => {
                const color = handIndex === 0 ? '#00ff88' : '#ff8800';

                // Draw connections (lines)
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const p1 = hand[start];
                    const p2 = hand[end];
                    ctx.beginPath();
                    ctx.moveTo((1 - p1.x) * size.width, p1.y * size.height);
                    ctx.lineTo((1 - p2.x) * size.width, p2.y * size.height);
                    ctx.stroke();
                });

                // Draw points
                ctx.fillStyle = color;
                hand.forEach((point, i) => {
                    const x = (1 - point.x) * size.width;
                    const y = point.y * size.height;
                    ctx.beginPath();
                    ctx.arc(x, y, i === 0 ? 6 : 4, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw point number
                    ctx.fillStyle = '#000';
                    ctx.font = '8px Arial';
                    ctx.fillText(String(i), x - 3, y + 3);
                    ctx.fillStyle = color;
                });
            });

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [isVisible, videoElement, landmarks, size]);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 100,
            }}
        >
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="glass-button"
                style={{
                    marginBottom: isVisible ? '10px' : 0,
                    fontSize: '12px',
                    padding: '8px 12px',
                }}
            >
                📷 {isVisible ? 'Hide' : 'Show'} Camera
            </button>

            {/* Camera Preview */}
            {isVisible && (
                <div
                    className="glass-panel"
                    style={{
                        padding: '8px',
                        borderRadius: '12px',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={size.width}
                        height={size.height}
                        style={{
                            borderRadius: '8px',
                            display: 'block',
                        }}
                    />
                    <div
                        style={{
                            marginTop: '8px',
                            fontSize: '10px',
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                        }}
                    >
                        {landmarks.length > 0
                            ? `${landmarks.length} hand${landmarks.length > 1 ? 's' : ''} detected`
                            : 'No hands detected'}
                    </div>
                </div>
            )}
        </div>
    );
};
