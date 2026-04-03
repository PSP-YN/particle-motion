/**
 * Touch Gestures Module
 * Mobile fallback for hand gestures using touch events
 */

import type { GestureResult, GestureType } from './gestures';

interface TouchPoint {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    startTime: number;
}

export type TouchGestureCallback = (gesture: GestureResult) => void;

export class TouchGestureHandler {
    private element: HTMLElement;
    private touches: Map<number, TouchPoint> = new Map();
    private callbacks: Set<TouchGestureCallback> = new Set();
    private lastTap = 0;
    private lastPinchDistance = 0;

    constructor(element: HTMLElement) {
        this.element = element;
        this.bindEvents();
    }

    private bindEvents(): void {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = touch.clientX / window.innerWidth;
            const y = touch.clientY / window.innerHeight;

            this.touches.set(touch.identifier, {
                id: touch.identifier,
                x,
                y,
                startX: x,
                startY: y,
                startTime: Date.now(),
            });
        }

        // Check for double tap (explosion)
        if (this.touches.size === 2) {
            const now = Date.now();
            if (now - this.lastTap < 300) {
                this.emitGesture('pinch', this.getPinchCenter(), 1);
            }
            this.lastTap = now;
            this.lastPinchDistance = this.getPinchDistance();
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const point = this.touches.get(touch.identifier);

            if (point) {
                point.x = touch.clientX / window.innerWidth;
                point.y = touch.clientY / window.innerHeight;
            }
        }

        this.detectAndEmitGesture();
    }

    private handleTouchEnd(e: TouchEvent): void {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.touches.delete(touch.identifier);
        }

        if (this.touches.size === 0) {
            this.emitGesture('none', { x: 0.5, y: 0.5, z: 0 }, 0);
        } else {
            this.detectAndEmitGesture();
        }
    }

    private getPinchCenter(): { x: number; y: number; z: number } {
        const points = Array.from(this.touches.values());
        if (points.length < 2) {
            return points.length === 1
                ? { x: points[0].x, y: points[0].y, z: 0 }
                : { x: 0.5, y: 0.5, z: 0 };
        }

        return {
            x: (points[0].x + points[1].x) / 2,
            y: (points[0].y + points[1].y) / 2,
            z: 0,
        };
    }

    private getPinchDistance(): number {
        const points = Array.from(this.touches.values());
        if (points.length < 2) return 0;

        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private detectAndEmitGesture(): void {
        const touchCount = this.touches.size;

        if (touchCount === 1) {
            // Single finger = attractor (like index point)
            const point = Array.from(this.touches.values())[0];
            this.emitGesture('index_point', { x: point.x, y: point.y, z: 0 }, 0.9);
        } else if (touchCount === 2) {
            const currentDist = this.getPinchDistance();
            const center = this.getPinchCenter();

            if (this.lastPinchDistance > 0) {
                const delta = currentDist - this.lastPinchDistance;

                if (delta > 0.01) {
                    // Spreading = push (like open palm)
                    this.emitGesture('open_palm', center, Math.min(delta * 10, 1));
                } else if (delta < -0.01) {
                    // Pinching = pull (like closed fist)
                    this.emitGesture('closed_fist', center, Math.min(-delta * 10, 1));
                } else {
                    // Two fingers static = two-hand mode
                    this.emitGesture('two_hand_rotate', center, 0.9, currentDist);
                }
            }

            this.lastPinchDistance = currentDist;
        } else if (touchCount >= 3) {
            // Three fingers = rotation/time dilation (like two-hand)
            const center = this.getPinchCenter();
            this.emitGesture('two_hand_rotate', center, 1, 0.5);
        }
    }

    private emitGesture(
        gesture: GestureType,
        position: { x: number; y: number; z: number },
        strength: number,
        twoHandDistance?: number
    ): void {
        const result: GestureResult = {
            gesture,
            position,
            strength,
            rotation: { pitch: 0, yaw: (position.x - 0.5) * 2, roll: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            palmFacing: 'camera',
            twoHandDistance,
        };

        this.callbacks.forEach((cb) => cb(result));
    }

    /**
     * Register a callback for gesture updates
     */
    onGesture(callback: TouchGestureCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
        this.callbacks.clear();
    }
}

/**
 * Check if device is touch-primary
 */
export function isTouchDevice(): boolean {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
    );
}
