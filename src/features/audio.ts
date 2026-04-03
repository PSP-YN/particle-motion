/**
 * Audio Reactive Module
 * Microphone input analysis for audio-reactive particle effects
 */

export interface AudioData {
    bass: number;      // 0-1 low frequency intensity
    mid: number;       // 0-1 mid frequency intensity
    treble: number;    // 0-1 high frequency intensity
    volume: number;    // 0-1 overall volume
    isBeat: boolean;   // Beat detection flag
}

export type AudioCallback = (data: AudioData) => void;

export class AudioAnalyzer {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array<ArrayBuffer> | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private callbacks: Set<AudioCallback> = new Set();
    private isRunning = false;
    private animationId: number | null = null;
    private lastBeatTime = 0;
    private beatThreshold = 0.6;
    private beatCooldown = 150; // ms

    async initialize(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    start(): void {
        if (this.isRunning || !this.analyser || !this.dataArray) return;
        this.isRunning = true;
        this.processAudio();
    }

    private processAudio(): void {
        if (!this.isRunning || !this.analyser || !this.dataArray) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        const bufferLength = this.dataArray.length;

        // Divide frequency spectrum into bands
        const bassEnd = Math.floor(bufferLength * 0.1);      // 0-10% = bass
        const midEnd = Math.floor(bufferLength * 0.5);        // 10-50% = mid

        let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;

        for (let i = 0; i < bufferLength; i++) {
            const value = this.dataArray[i] / 255;
            totalSum += value;

            if (i < bassEnd) {
                bassSum += value;
            } else if (i < midEnd) {
                midSum += value;
            } else {
                trebleSum += value;
            }
        }

        const bass = bassSum / bassEnd;
        const mid = midSum / (midEnd - bassEnd);
        const treble = trebleSum / (bufferLength - midEnd);
        const volume = totalSum / bufferLength;

        // Beat detection on bass frequencies
        const now = Date.now();
        const isBeat = bass > this.beatThreshold && (now - this.lastBeatTime) > this.beatCooldown;

        if (isBeat) {
            this.lastBeatTime = now;
        }

        const audioData: AudioData = { bass, mid, treble, volume, isBeat };
        this.callbacks.forEach((cb) => cb(audioData));

        this.animationId = requestAnimationFrame(() => this.processAudio());
    }

    stop(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    onAudio(callback: AudioCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    setBeatThreshold(threshold: number): void {
        this.beatThreshold = Math.max(0, Math.min(1, threshold));
    }

    destroy(): void {
        this.stop();

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.callbacks.clear();
    }
}
