/**
 * Hand Tracking Module
 * Handles MediaPipe Hands integration for real-time hand landmark detection
 */

import { Hands } from '@mediapipe/hands';
import type { Results, NormalizedLandmarkList } from '@mediapipe/hands';

export interface HandData {
    landmarks: NormalizedLandmarkList;
    isLeft: boolean;
}

export interface TrackingResult {
    hands: HandData[];
    timestamp: number;
}

export type TrackingCallback = (result: TrackingResult) => void;

export class HandTracker {
    private hands: Hands | null = null;
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isRunning = false;
    private callbacks: Set<TrackingCallback> = new Set();
    private animationId: number | null = null;

    async initialize(): Promise<boolean> {
        try {
            // Create hidden video element for camera feed
            this.video = document.createElement('video');
            this.video.setAttribute('playsinline', '');
            this.video.style.display = 'none';
            document.body.appendChild(this.video);

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5,
            });

            this.hands.onResults(this.handleResults.bind(this));

            // Create processing canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.video.videoWidth || 1280;
            this.canvas.height = this.video.videoHeight || 720;
            this.ctx = this.canvas.getContext('2d');

            return true;
        } catch (error) {
            console.error('Failed to initialize hand tracking:', error);
            return false;
        }
    }

    private handleResults(results: Results): void {
        const handData: HandData[] = [];

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                handData.push({
                    landmarks,
                    isLeft: handedness.label === 'Left',
                });
            }
        }

        const trackingResult: TrackingResult = {
            hands: handData,
            timestamp: performance.now(),
        };

        // Notify all listeners
        this.callbacks.forEach((callback) => callback(trackingResult));
    }

    start(): void {
        if (this.isRunning || !this.hands || !this.video || !this.ctx) return;
        this.isRunning = true;
        this.processFrame();
    }

    private async processFrame(): Promise<void> {
        if (!this.isRunning || !this.hands || !this.video || !this.ctx || !this.canvas) return;

        // Draw video frame to canvas and send to MediaPipe
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        await this.hands.send({ image: this.canvas });

        this.animationId = requestAnimationFrame(() => this.processFrame());
    }

    stop(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Get the video element for camera preview
     */
    getVideoElement(): HTMLVideoElement | null {
        return this.video;
    }

    onTrack(callback: TrackingCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    destroy(): void {
        this.stop();

        if (this.video) {
            const stream = this.video.srcObject as MediaStream;
            stream?.getTracks().forEach((track) => track.stop());
            this.video.remove();
            this.video = null;
        }

        if (this.hands) {
            this.hands.close();
            this.hands = null;
        }

        this.callbacks.clear();
    }
}

// Singleton instance
let trackerInstance: HandTracker | null = null;

export function getHandTracker(): HandTracker {
    if (!trackerInstance) {
        trackerInstance = new HandTracker();
    }
    return trackerInstance;
}
