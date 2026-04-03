/**
 * Canvas Component
 * WebGL rendering canvas for particles
 */

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CanvasProps {
    onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export interface CanvasRef {
    getCanvas: () => HTMLCanvasElement | null;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ onCanvasReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
        if (canvasRef.current && onCanvasReady) {
            onCanvasReady(canvasRef.current);
        }
    }, [onCanvasReady]);

    return (
        <canvas
            ref={canvasRef}
            className="particle-canvas"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}
        />
    );
});

Canvas.displayName = 'Canvas';
