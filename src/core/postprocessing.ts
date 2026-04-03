/**
 * Post-Processing Module
 * Handles bloom, glow, motion blur, and visual effects using Three.js EffectComposer
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Custom motion blur shader
const MotionBlurShader = {
    uniforms: {
        tDiffuse: { value: null },
        tPrev: { value: null },
        mixRatio: { value: 0.5 },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrev;
    uniform float mixRatio;
    varying vec2 vUv;
    
    void main() {
      vec4 current = texture2D(tDiffuse, vUv);
      vec4 previous = texture2D(tPrev, vUv);
      gl_FragColor = mix(current, previous, mixRatio);
    }
  `,
};

// Vignette shader for depth effect
const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        darkness: { value: 0.6 },
        offset: { value: 1.0 },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float vignette = smoothstep(offset, offset - 0.5, dist * (darkness + offset));
      texel.rgb *= vignette;
      gl_FragColor = texel;
    }
  `,
};

export interface PostProcessingConfig {
    bloomEnabled: boolean;
    motionBlurEnabled: boolean;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    motionBlurAmount: number;
    vignetteEnabled: boolean;
}

export class PostProcessor {
    private composer: EffectComposer;
    private renderPass: RenderPass;
    private bloomPass: UnrealBloomPass;
    private motionBlurPass: ShaderPass;
    private vignettePass: ShaderPass;
    private prevFrameTexture: THREE.WebGLRenderTarget;
    private config: PostProcessingConfig;
    private renderer: THREE.WebGLRenderer;

    constructor(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
        config: PostProcessingConfig
    ) {
        this.renderer = renderer;
        this.config = config;

        // Create composer
        this.composer = new EffectComposer(renderer);

        // Render pass
        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        // Bloom pass
        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.bloomPass = new UnrealBloomPass(
            resolution,
            config.bloomStrength,
            config.bloomRadius,
            config.bloomThreshold
        );
        this.bloomPass.enabled = config.bloomEnabled;
        this.composer.addPass(this.bloomPass);

        // Motion blur pass
        this.prevFrameTexture = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight
        );
        this.motionBlurPass = new ShaderPass(MotionBlurShader);
        this.motionBlurPass.uniforms['mixRatio'].value = config.motionBlurAmount;
        this.motionBlurPass.enabled = config.motionBlurEnabled;
        this.composer.addPass(this.motionBlurPass);

        // Vignette pass
        this.vignettePass = new ShaderPass(VignetteShader);
        this.vignettePass.enabled = config.vignetteEnabled;
        this.composer.addPass(this.vignettePass);

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private handleResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
        this.prevFrameTexture.setSize(width, height);
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<PostProcessingConfig>): void {
        this.config = { ...this.config, ...newConfig };

        this.bloomPass.enabled = this.config.bloomEnabled;
        this.bloomPass.strength = this.config.bloomStrength;
        this.bloomPass.radius = this.config.bloomRadius;
        this.bloomPass.threshold = this.config.bloomThreshold;

        this.motionBlurPass.enabled = this.config.motionBlurEnabled;
        this.motionBlurPass.uniforms['mixRatio'].value = this.config.motionBlurAmount;

        this.vignettePass.enabled = this.config.vignetteEnabled;
    }

    /**
     * Enable/disable all effects (for performance toggle)
     */
    setEnabled(enabled: boolean): void {
        this.bloomPass.enabled = enabled && this.config.bloomEnabled;
        this.motionBlurPass.enabled = enabled && this.config.motionBlurEnabled;
        this.vignettePass.enabled = enabled && this.config.vignetteEnabled;
    }

    /**
     * Render with post-processing
     */
    render(): void {
        // Save previous frame for motion blur
        if (this.config.motionBlurEnabled) {
            this.motionBlurPass.uniforms['tPrev'].value = this.prevFrameTexture.texture;
        }

        this.composer.render();

        // Store current frame for next iteration
        if (this.config.motionBlurEnabled) {
            this.renderer.setRenderTarget(this.prevFrameTexture);
            this.renderer.render(this.renderPass.scene, this.renderPass.camera);
            this.renderer.setRenderTarget(null);
        }
    }

    /**
     * Get the composer for external access
     */
    getComposer(): EffectComposer {
        return this.composer;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.prevFrameTexture.dispose();
        this.composer.dispose();
    }
}

/**
 * Create default post-processing configuration
 */
export function createDefaultPostConfig(performanceMode: 'high' | 'low'): PostProcessingConfig {
    if (performanceMode === 'high') {
        return {
            bloomEnabled: true,
            motionBlurEnabled: false,
            bloomStrength: 0.08,   // Very subtle - barely visible neon
            bloomRadius: 0.1,     // Tight glow close to particle
            bloomThreshold: 0.9,  // Only the brightest core glows
            motionBlurAmount: 0,
            vignetteEnabled: false,
        };
    } else {
        return {
            bloomEnabled: false,
            motionBlurEnabled: false,
            bloomStrength: 0,
            bloomRadius: 0,
            bloomThreshold: 1,
            motionBlurAmount: 0,
            vignetteEnabled: false,
        };
    }
}
