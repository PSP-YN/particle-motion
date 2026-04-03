/**
 * Movement Modes Module
 * Different particle movement behaviors
 */

export type MovementMode =
    | 'float'
    | 'orbit'
    | 'pulse'
    | 'wave'
    | 'vortex'
    | 'bounce'
    | 'attract'
    | 'repel'
    | 'swarm'
    | 'flow';

export interface MovementConfig {
    name: string;
    icon: string;
    description: string;
}

export const MOVEMENT_MODES: Record<MovementMode, MovementConfig> = {
    float: {
        name: 'Float',
        icon: '🎈',
        description: 'Gentle floating motion',
    },
    orbit: {
        name: 'Orbit',
        icon: '🪐',
        description: 'Circular orbital paths',
    },
    pulse: {
        name: 'Pulse',
        icon: '💓',
        description: 'Rhythmic expansion/contraction',
    },
    wave: {
        name: 'Wave',
        icon: '🌊',
        description: 'Sine wave oscillation',
    },
    vortex: {
        name: 'Vortex',
        icon: '🌀',
        description: 'Spinning tornado effect',
    },
    bounce: {
        name: 'Bounce',
        icon: '⚽',
        description: 'Bouncing ball physics',
    },
    attract: {
        name: 'Attract',
        icon: '🧲',
        description: 'Pull toward center',
    },
    repel: {
        name: 'Repel',
        icon: '💨',
        description: 'Push away from center',
    },
    swarm: {
        name: 'Swarm',
        icon: '🐝',
        description: 'Flocking behavior',
    },
    flow: {
        name: 'Flow',
        icon: '💧',
        description: 'Fluid-like motion',
    },
};

export const MOVEMENT_LIST = Object.keys(MOVEMENT_MODES) as MovementMode[];
