/**
 * Hand Point Actions Module
 * Maps number of detected hand points to different actions
 */

export type PointAction =
    | 'none'
    | 'attract_weak'
    | 'attract_strong'
    | 'repel'
    | 'explode'
    | 'orbit'
    | 'scatter'
    | 'freeze'
    | 'colorshift';

export interface PointActionConfig {
    name: string;
    description: string;
    minPoints: number;
    maxPoints: number;
}

// Actions based on number of visible hand points
export const POINT_ACTIONS: Record<PointAction, PointActionConfig> = {
    none: {
        name: 'None',
        description: 'No action',
        minPoints: 0,
        maxPoints: 4,
    },
    attract_weak: {
        name: 'Weak Attract',
        description: 'Gentle pull toward hand',
        minPoints: 5,
        maxPoints: 9,
    },
    attract_strong: {
        name: 'Strong Attract',
        description: 'Strong pull toward hand',
        minPoints: 10,
        maxPoints: 19,
    },
    repel: {
        name: 'Repel',
        description: 'Push particles away',
        minPoints: 20,
        maxPoints: 39,
    },
    explode: {
        name: 'Explode',
        description: 'Burst particles outward',
        minPoints: 40,
        maxPoints: 59,
    },
    orbit: {
        name: 'Orbit',
        description: 'Particles orbit around hand',
        minPoints: 60,
        maxPoints: 100,
    },
    scatter: {
        name: 'Scatter',
        description: 'Random scatter',
        minPoints: 0,
        maxPoints: 0,
    },
    freeze: {
        name: 'Freeze',
        description: 'Stop all motion',
        minPoints: 0,
        maxPoints: 0,
    },
    colorshift: {
        name: 'Color Shift',
        description: 'Change colors',
        minPoints: 0,
        maxPoints: 0,
    },
};

/**
 * Determine action based on number of detected hand points
 */
export function getActionFromPointCount(pointCount: number): PointAction {
    if (pointCount >= 60) return 'orbit';
    if (pointCount >= 40) return 'explode';
    if (pointCount >= 20) return 'repel';
    if (pointCount >= 10) return 'attract_strong';
    if (pointCount >= 5) return 'attract_weak';
    return 'none';
}

/**
 * Point ranges for UI display
 */
export const POINT_RANGES = [
    { points: '0-4', action: 'None' },
    { points: '5-9', action: 'Weak Attract' },
    { points: '10-19', action: 'Strong Attract' },
    { points: '20-39', action: 'Repel' },
    { points: '40-59', action: 'Explode' },
    { points: '60+', action: 'Orbit' },
];
