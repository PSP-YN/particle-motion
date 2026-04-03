/**
 * Performance Module
 * Device capability detection and automatic quality scaling
 */

export type PerformanceLevel = 'high' | 'low';

export interface PerformanceMetrics {
    fps: number;
    frameTime: number; // ms
    gpuTier: number;   // 0-3 (0=unknown, 1=low, 2=mid, 3=high)
    memoryUsage?: number;
}

export interface PerformanceConfig {
    targetFPS: number;
    minFPS: number;
    adaptiveQuality: boolean;
    particleScaleFactor: number;
}

export class PerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 60;
    private frameTime = 16.67;
    private fpsHistory: number[] = [];
    private config: PerformanceConfig;
    private onLevelChange?: (level: PerformanceLevel) => void;
    private currentLevel: PerformanceLevel = 'high';
    private gpuTier = 0;

    constructor(config?: Partial<PerformanceConfig>) {
        this.config = {
            targetFPS: 60,
            minFPS: 30,
            adaptiveQuality: true,
            particleScaleFactor: 1,
            ...config,
        };

        this.detectGPUTier();
    }

    /**
     * Detect GPU capabilities
     */
    private detectGPUTier(): void {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            this.gpuTier = 1; // Assume low if no WebGL
            return;
        }

        const glContext = gl as WebGLRenderingContext;

        // Check for high-end extensions
        const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;

            // Simple heuristics for GPU tier
            const highEnd = ['nvidia', 'geforce rtx', 'radeon rx 6', 'radeon rx 7', 'apple m1', 'apple m2', 'apple m3'];
            const midEnd = ['geforce gtx', 'radeon rx 5', 'intel iris', 'intel uhd'];

            const rendererLower = renderer.toLowerCase();

            if (highEnd.some(h => rendererLower.includes(h))) {
                this.gpuTier = 3;
            } else if (midEnd.some(m => rendererLower.includes(m))) {
                this.gpuTier = 2;
            } else {
                this.gpuTier = 1;
            }
        } else {
            // Fallback: check max texture size as a proxy
            const maxTexture = glContext.getParameter(glContext.MAX_TEXTURE_SIZE);
            this.gpuTier = maxTexture >= 16384 ? 3 : maxTexture >= 8192 ? 2 : 1;
        }
    }

    /**
     * Call this every frame to update metrics
     */
    tick(): void {
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameTime = delta / this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;

            // Track FPS history
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }

            // Adaptive quality
            if (this.config.adaptiveQuality) {
                this.checkAndAdaptQuality();
            }
        }
    }

    /**
     * Check FPS and recommend quality changes
     */
    private checkAndAdaptQuality(): void {
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        if (avgFps < this.config.minFPS && this.currentLevel === 'high') {
            this.currentLevel = 'low';
            this.onLevelChange?.('low');
        } else if (avgFps > this.config.targetFPS * 0.9 && this.currentLevel === 'low') {
            // Only upgrade if consistently hitting target
            if (this.fpsHistory.every(f => f > this.config.targetFPS * 0.8)) {
                this.currentLevel = 'high';
                this.onLevelChange?.('high');
            }
        }
    }

    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            gpuTier: this.gpuTier,
            memoryUsage: (performance as any).memory?.usedJSHeapSize,
        };
    }

    /**
     * Get recommended particle count based on device
     */
    getRecommendedParticleCount(): number {
        const baseCounts: Record<number, number> = {
            1: 2000,   // Low-end
            2: 5000,   // Mid-range
            3: 15000,  // High-end
        };

        return baseCounts[this.gpuTier] || 5000;
    }

    /**
     * Get current performance level
     */
    getCurrentLevel(): PerformanceLevel {
        return this.currentLevel;
    }

    /**
     * Set level manually
     */
    setLevel(level: PerformanceLevel): void {
        this.currentLevel = level;
        this.onLevelChange?.(level);
    }

    /**
     * Set callback for level changes
     */
    setOnLevelChange(callback: (level: PerformanceLevel) => void): void {
        this.onLevelChange = callback;
    }

    /**
     * Get initial recommended level based on device
     */
    getInitialLevel(): PerformanceLevel {
        return this.gpuTier >= 2 ? 'high' : 'low';
    }
}

/**
 * Singleton performance monitor
 */
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
    if (!monitorInstance) {
        monitorInstance = new PerformanceMonitor();
    }
    return monitorInstance;
}
