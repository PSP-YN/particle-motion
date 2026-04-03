/**
 * Particle Engine - Iron Man Hologram Style
 * 3D rotation control, gesture-based actions
 */

import * as THREE from 'three';
import type { GestureResult } from './gestures';
import { PARTICLE_SHAPES, type ParticleShape } from './shapes';
import type { MovementMode } from './movements';

export type ParticlePreset = 'calm' | 'chaotic' | 'orbital' | 'swarm' | 'galaxy';

export interface ParticleConfig {
    count: number;
    color1: string;
    color2: string;
    preset: ParticlePreset;
    performanceMode: 'high' | 'low';
    bloomEnabled: boolean;
    motionBlurEnabled: boolean;
    shape: ParticleShape;
    movement: MovementMode;
    particleSize: number;
}

interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    basePosition: THREE.Vector3;
    life: number;
    size: number;
    colorLerp: number;
}

const PRESET_CONFIG: Record<ParticlePreset, {
    friction: number;
    maxSpeed: number;
    turbulence: number;
}> = {
    calm: { friction: 0.98, maxSpeed: 0.015, turbulence: 0.0001 },
    chaotic: { friction: 0.95, maxSpeed: 0.04, turbulence: 0.002 },
    orbital: { friction: 0.99, maxSpeed: 0.025, turbulence: 0.0002 },
    swarm: { friction: 0.97, maxSpeed: 0.02, turbulence: 0.0008 },
    galaxy: { friction: 0.995, maxSpeed: 0.03, turbulence: 0.0004 },
};

export class ParticleEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private particles: Particle[] = [];
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    private points: THREE.Points;
    private config: ParticleConfig;
    private time = 0;

    // Iron Man 3D rotation state
    private targetRotation = new THREE.Euler(0, 0, 0);
    private currentRotation = new THREE.Euler(0, 0, 0);
    private rotationGroup: THREE.Group;

    // Time scale for slow-mo/speed-up
    private timeScale = 1;
    private targetTimeScale = 1;

    // Scale for expand/compress
    private shapeScale = 1;
    private targetScale = 1;

    // Simple solid particle shader
    private vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    
    void main() {
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (150.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

    private fragmentShader = `
    varying vec3 vColor;
    
    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

    constructor(canvas: HTMLCanvasElement, config: ParticleConfig) {
        this.config = { ...config };

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 3;

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: false,
            antialias: config.performanceMode === 'high',
            powerPreference: config.performanceMode === 'high' ? 'high-performance' : 'low-power',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(config.performanceMode === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
        this.renderer.setClearColor(0x000000, 1);

        // Create rotation group for Iron Man style rotation
        this.rotationGroup = new THREE.Group();
        this.scene.add(this.rotationGroup);

        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: false,
            depthWrite: true,
            depthTest: true,
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.rotationGroup.add(this.points);

        this.initParticles();
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private initParticles(): void {
        const color1 = new THREE.Color(this.config.color1);
        const color2 = new THREE.Color(this.config.color2);
        const shapeGen = PARTICLE_SHAPES[this.config.shape].generate;

        this.particles = [];
        const baseSize = this.config.particleSize || 0.2;

        for (let i = 0; i < this.config.count; i++) {
            const pos = shapeGen(i, this.config.count);
            this.particles.push({
                position: new THREE.Vector3(pos.x, pos.y, pos.z),
                basePosition: new THREE.Vector3(pos.x, pos.y, pos.z),
                velocity: new THREE.Vector3(0, 0, 0),
                life: 0.5 + Math.random() * 0.5,
                size: baseSize + (Math.random() - 0.5) * baseSize * 0.3,
                colorLerp: Math.random(),
            });
        }

        this.updateGeometry(color1, color2);
    }

    private updateGeometry(color1: THREE.Color, color2: THREE.Color): void {
        const positions = new Float32Array(this.particles.length * 3);
        const colors = new Float32Array(this.particles.length * 3);
        const sizes = new Float32Array(this.particles.length);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            positions[i * 3] = p.position.x * this.shapeScale;
            positions[i * 3 + 1] = p.position.y * this.shapeScale;
            positions[i * 3 + 2] = p.position.z * this.shapeScale;

            const color = color1.clone().lerp(color2, p.colorLerp);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = p.size;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    }

    private handleResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Apply gesture - Iron Man hologram control
     */
    applyGesture(gesture: GestureResult): void {
        if (!gesture || gesture.gesture === 'none') {
            return;
        }

        switch (gesture.gesture) {
            case 'open_palm':
                // Iron Man style - hand position controls 3D rotation
                this.targetRotation.x = gesture.rotation.pitch * Math.PI * 0.5;
                this.targetRotation.y = gesture.rotation.yaw * Math.PI * 0.8;
                this.targetRotation.z = gesture.rotation.roll * Math.PI * 0.3;
                break;

            case 'closed_fist':
                // Explode particles outward
                this.explodeParticles();
                break;

            case 'peace':
                // Slow motion
                this.targetTimeScale = 0.2;
                break;

            case 'rock':
                // Speed up
                this.targetTimeScale = 3.0;
                break;

            case 'thumbs_up':
                // Reset to default
                this.resetShape();
                break;

            case 'pinch':
                // Grab mode - move particles toward pinch point
                this.attractToPoint(gesture.position, 0.5);
                break;

            case 'index_point':
                // Point - gentle attraction
                this.attractToPoint(gesture.position, 0.2);
                break;

            case 'two_hand_spread':
                // Expand
                this.targetScale = Math.min(2.5, this.shapeScale + 0.05);
                // Also use rotation from two hands
                if (gesture.rotation) {
                    this.targetRotation.x = gesture.rotation.pitch * Math.PI * 0.5;
                    this.targetRotation.y = gesture.rotation.yaw * Math.PI * 0.8;
                    this.targetRotation.z = gesture.rotation.roll * Math.PI;
                }
                break;

            case 'two_hand_close':
                // Compress
                this.targetScale = Math.max(0.3, this.shapeScale - 0.05);
                break;

            case 'two_hand_rotate':
                // Two hand rotation - use angle between hands
                if (gesture.twoHandRotation !== undefined) {
                    this.targetRotation.z = gesture.twoHandRotation;
                }
                if (gesture.rotation) {
                    this.targetRotation.x = gesture.rotation.pitch * Math.PI * 0.5;
                    this.targetRotation.y = gesture.rotation.yaw * Math.PI * 0.8;
                }
                break;
        }

        // Reset time scale when not peace or rock
        if (gesture.gesture !== 'peace' && gesture.gesture !== 'rock') {
            this.targetTimeScale = 1.0;
        }
    }

    private explodeParticles(): void {
        for (const p of this.particles) {
            const dir = p.position.clone().normalize();
            p.velocity.add(dir.multiplyScalar(0.1));
        }
    }

    private attractToPoint(point: { x: number; y: number; z: number }, strength: number): void {
        const targetPos = new THREE.Vector3(
            (point.x - 0.5) * 4,
            -(point.y - 0.5) * 3,
            0
        );

        for (const p of this.particles) {
            const toTarget = targetPos.clone().sub(p.position);
            const dist = toTarget.length();
            if (dist > 0.1) {
                toTarget.normalize().multiplyScalar(strength * 0.01 / (dist + 0.5));
                p.velocity.add(toTarget);
            }
        }
    }

    private resetShape(): void {
        this.targetRotation.set(0, 0, 0);
        this.targetScale = 1;
        this.targetTimeScale = 1;

        // Return particles to base positions
        for (const p of this.particles) {
            p.velocity.multiplyScalar(0.5);
            const toBase = p.basePosition.clone().sub(p.position).multiplyScalar(0.1);
            p.velocity.add(toBase);
        }
    }

    /**
     * Update physics with Iron Man style controls
     */
    update(deltaTime: number): void {
        // Smooth time scale transition
        this.timeScale += (this.targetTimeScale - this.timeScale) * 0.1;

        // Smooth scale transition
        this.shapeScale += (this.targetScale - this.shapeScale) * 0.1;

        // Smooth rotation transition (Iron Man style)
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
        this.currentRotation.z += (this.targetRotation.z - this.currentRotation.z) * 0.08;

        // Apply rotation to the group
        this.rotationGroup.rotation.x = this.currentRotation.x;
        this.rotationGroup.rotation.y = this.currentRotation.y;
        this.rotationGroup.rotation.z = this.currentRotation.z;

        const dt = deltaTime * this.timeScale;
        this.time += dt;

        const preset = PRESET_CONFIG[this.config.preset];
        const color1 = new THREE.Color(this.config.color1);
        const color2 = new THREE.Color(this.config.color2);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const force = new THREE.Vector3();

            // Apply movement mode
            this.applyMovement(p, i, force);

            // Gentle return to base position
            const toBase = p.basePosition.clone().sub(p.position);
            force.add(toBase.multiplyScalar(0.002));

            // Add turbulence
            force.add(new THREE.Vector3(
                (Math.random() - 0.5) * preset.turbulence,
                (Math.random() - 0.5) * preset.turbulence,
                (Math.random() - 0.5) * preset.turbulence
            ));

            // Apply forces
            p.velocity.add(force.multiplyScalar(dt * 60));
            p.velocity.multiplyScalar(preset.friction);

            if (p.velocity.length() > preset.maxSpeed) {
                p.velocity.normalize().multiplyScalar(preset.maxSpeed);
            }

            p.position.add(p.velocity.clone().multiplyScalar(dt * 60));

            // Soft boundary
            const bound = 3;
            ['x', 'y', 'z'].forEach((axis) => {
                const key = axis as 'x' | 'y' | 'z';
                if (Math.abs(p.position[key]) > bound) {
                    p.position[key] = Math.sign(p.position[key]) * bound;
                    p.velocity[key] *= -0.5;
                }
            });
        }

        this.updateGeometry(color1, color2);
    }

    private applyMovement(p: Particle, index: number, force: THREE.Vector3): void {
        const t = this.time;

        switch (this.config.movement) {
            case 'orbit':
                const orbitAngle = t * 0.5 + index * 0.01;
                force.x += Math.cos(orbitAngle) * 0.0003;
                force.y += Math.sin(orbitAngle) * 0.0003;
                break;
            case 'pulse':
                const pulseScale = Math.sin(t * 2) * 0.0002;
                force.add(p.position.clone().normalize().multiplyScalar(pulseScale));
                break;
            case 'wave':
                force.y += Math.sin(t * 2 + p.position.x * 2) * 0.0002;
                break;
            case 'vortex':
                const vortexForce = new THREE.Vector3(-p.position.y, p.position.x, 0);
                force.add(vortexForce.normalize().multiplyScalar(0.0003));
                break;
            case 'swarm':
                if (Math.random() < 0.01) {
                    force.set((Math.random() - 0.5) * 0.001, (Math.random() - 0.5) * 0.001, (Math.random() - 0.5) * 0.0005);
                }
                break;
            case 'flow':
                force.x += 0.0001;
                force.y += Math.sin(p.position.x * 3 + t) * 0.00005;
                break;
        }
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    updateConfig(newConfig: Partial<ParticleConfig>): void {
        const oldCount = this.config.count;
        const oldShape = this.config.shape;
        this.config = { ...this.config, ...newConfig };

        if (this.config.count !== oldCount || this.config.shape !== oldShape) {
            this.initParticles();
        }

        if (newConfig.performanceMode) {
            this.renderer.setPixelRatio(this.config.performanceMode === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
        }
    }

    getRenderer(): THREE.WebGLRenderer { return this.renderer; }
    getScene(): THREE.Scene { return this.scene; }
    getCamera(): THREE.PerspectiveCamera { return this.camera; }

    // Expose current state for HUD
    getTimeScale(): number { return this.timeScale; }
    getShapeScale(): number { return this.shapeScale; }
    getRotation(): { x: number; y: number; z: number } {
        return {
            x: Math.round(this.currentRotation.x * 180 / Math.PI),
            y: Math.round(this.currentRotation.y * 180 / Math.PI),
            z: Math.round(this.currentRotation.z * 180 / Math.PI),
        };
    }

    destroy(): void {
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
    }
}
