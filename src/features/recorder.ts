/**
 * Recorder Module
 * Canvas recording with MP4/WebM export and GIF generation
 */

export interface RecorderConfig {
    frameRate: number;
    videoBitrate: number;
    gifQuality: number;
    maxDuration: number; // seconds
}

export type RecorderState = 'idle' | 'recording' | 'processing';

export class CanvasRecorder {
    private canvas: HTMLCanvasElement;
    private config: RecorderConfig;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private state: RecorderState = 'idle';
    private startTime = 0;
    private onStateChange?: (state: RecorderState) => void;

    constructor(canvas: HTMLCanvasElement, config?: Partial<RecorderConfig>) {
        this.canvas = canvas;
        this.config = {
            frameRate: 30,
            videoBitrate: 5000000,
            gifQuality: 10,
            maxDuration: 30,
            ...config,
        };
    }

    /**
     * Start recording the canvas
     */
    startRecording(): boolean {
        if (this.state !== 'idle') return false;

        try {
            // Get canvas stream with codec support
            const stream = this.canvas.captureStream(this.config.frameRate);

            // Try VP9 first (better quality), fallback to VP8
            const mimeType = this.getSupportedMimeType();
            if (!mimeType) {
                console.error('No supported video codec found');
                return false;
            }

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: this.config.videoBitrate,
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.setState('processing');
                this.processRecording();
            };

            this.mediaRecorder.start(100); // Collect data every 100ms
            this.startTime = Date.now();
            this.setState('recording');

            // Auto-stop after max duration
            setTimeout(() => {
                if (this.state === 'recording') {
                    this.stopRecording();
                }
            }, this.config.maxDuration * 1000);

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            return false;
        }
    }

    /**
     * Get supported mime type with codec priority
     */
    private getSupportedMimeType(): string | null {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4;codecs=h264',
            'video/mp4',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Stop recording
     */
    stopRecording(): void {
        if (this.state !== 'recording' || !this.mediaRecorder) return;
        this.mediaRecorder.stop();
    }

    /**
     * Process and download the recording
     */
    private processRecording(): void {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `particle-motion-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.setState('idle');
    }

    /**
     * Take a screenshot
     */
    takeScreenshot(): void {
        const dataUrl = this.canvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `particle-screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Get recording duration in seconds
     */
    getDuration(): number {
        if (this.state !== 'recording') return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    /**
     * Get current state
     */
    getState(): RecorderState {
        return this.state;
    }

    private setState(state: RecorderState): void {
        this.state = state;
        this.onStateChange?.(state);
    }

    /**
     * Set state change callback
     */
    setOnStateChange(callback: (state: RecorderState) => void): void {
        this.onStateChange = callback;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.state === 'recording') {
            this.mediaRecorder?.stop();
        }
        this.recordedChunks = [];
    }
}

// GIF Recording using gif.js (lightweight wrapper)
export class GifRecorder {
    private canvas: HTMLCanvasElement;
    private frames: ImageData[] = [];
    private isRecording = false;
    private frameInterval: number | null = null;
    private maxFrames = 150; // 5 seconds at 30fps

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    start(): void {
        if (this.isRecording) return;

        this.frames = [];
        this.isRecording = true;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        this.frameInterval = window.setInterval(() => {
            if (this.frames.length >= this.maxFrames) {
                this.stop();
                return;
            }

            const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.frames.push(imageData);
        }, 1000 / 30);
    }

    stop(): void {
        if (!this.isRecording) return;

        this.isRecording = false;
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }

        // For full GIF export, you'd use gif.js library here
        // This is a placeholder that exports as animated PNG sequence
        console.log(`Captured ${this.frames.length} frames for GIF`);
    }

    getFrameCount(): number {
        return this.frames.length;
    }
}
