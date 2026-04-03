/**
 * 3D Particle Shapes Module
 * 50 3D-only shapes with surface/boundary particles
 */

export type ParticleShape =
    // Basic 3D Shapes
    | 'sphere'
    | 'cube'
    | 'torus'
    | 'cylinder'
    | 'cone'
    | 'pyramid'
    | 'octahedron'
    | 'tetrahedron'
    | 'icosahedron'
    | 'dodecahedron'
    // Advanced 3D Shapes
    | 'globe'
    | 'capsule'
    | 'prism'
    | 'hemisphere'
    | 'ellipsoid'
    | 'egg'
    | 'donut'
    | 'barrel'
    | 'hourglass'
    | 'spindle'
    // Complex 3D Shapes
    | 'helix'
    | 'dna'
    | 'spring'
    | 'mobius'
    | 'knot'
    | 'trefoil'
    | 'shell'
    | 'nautilus'
    | 'vortex'
    | 'tornado'
    // Structural 3D Shapes
    | 'cage'
    | 'wireframe_cube'
    | 'lattice'
    | 'geodesic'
    | 'fullerene'
    | 'diamond_lattice'
    | 'crystal'
    | 'quartz'
    | 'snowflake_3d'
    | 'stellated'
    // Organic 3D Shapes
    | 'atom'
    | 'molecule'
    | 'cell'
    | 'nucleus'
    | 'galaxy'
    | 'nebula'
    | 'pulsar'
    | 'blackhole'
    | 'wormhole'
    | 'corona'
    // Random
    | 'random';

export interface ShapeConfig {
    name: string;
    icon: string;
    generate: (index: number, total: number) => { x: number; y: number; z: number };
}

const TWO_PI = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2;  // Golden ratio

// Generate point on sphere surface
function onSphere(i: number, total: number, r: number = 1.2): { x: number; y: number; z: number } {
    const phi = Math.acos(1 - 2 * (i + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta),
    };
}

export const PARTICLE_SHAPES: Record<ParticleShape, ShapeConfig> = {
    // ===== BASIC 3D SHAPES =====
    sphere: {
        name: 'Sphere',
        icon: '🔮',
        generate: (i, total) => onSphere(i, total, 1.2),
    },
    cube: {
        name: 'Cube',
        icon: '🧊',
        generate: (i, total) => {
            const face = Math.floor((i / total) * 6);
            const t1 = ((i * 7) % 100) / 100 * 2 - 1;
            const t2 = ((i * 13) % 100) / 100 * 2 - 1;
            const s = 1;
            switch (face) {
                case 0: return { x: s, y: t1, z: t2 };
                case 1: return { x: -s, y: t1, z: t2 };
                case 2: return { x: t1, y: s, z: t2 };
                case 3: return { x: t1, y: -s, z: t2 };
                case 4: return { x: t1, y: t2, z: s };
                default: return { x: t1, y: t2, z: -s };
            }
        },
    },
    torus: {
        name: 'Torus',
        icon: '🍩',
        generate: (i, total) => {
            const u = (i / Math.sqrt(total)) * TWO_PI;
            const v = ((i % Math.sqrt(total)) / Math.sqrt(total)) * TWO_PI;
            const R = 1, r = 0.4;
            return {
                x: (R + r * Math.cos(v)) * Math.cos(u),
                y: (R + r * Math.cos(v)) * Math.sin(u),
                z: r * Math.sin(v),
            };
        },
    },
    cylinder: {
        name: 'Cylinder',
        icon: '🛢️',
        generate: (i, total) => {
            const angle = (i / total) * TWO_PI * 10;
            const height = (i / total) * 2 - 1;
            return { x: Math.cos(angle) * 0.8, y: height * 1.2, z: Math.sin(angle) * 0.8 };
        },
    },
    cone: {
        name: 'Cone',
        icon: '🔻',
        generate: (i, total) => {
            const t = i / total;
            const angle = t * TWO_PI * 8;
            const r = t * 1.2;
            return { x: Math.cos(angle) * r, y: 1.2 - t * 2.4, z: Math.sin(angle) * r };
        },
    },
    pyramid: {
        name: 'Pyramid',
        icon: '🔺',
        generate: (i, total) => {
            const edge = i % 4;
            const t = (i / total);
            const apex = { x: 0, y: 1.2, z: 0 };
            const base = [
                { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
                { x: 1, y: -1, z: 1 }, { x: -1, y: -1, z: 1 }
            ];
            const b = base[edge];
            return {
                x: apex.x + (b.x - apex.x) * t,
                y: apex.y + (b.y - apex.y) * t,
                z: apex.z + (b.z - apex.z) * t,
            };
        },
    },
    octahedron: {
        name: 'Octahedron',
        icon: '🔷',
        generate: (i, total) => {
            const vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
            const edges = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]];
            const e = edges[i % edges.length];
            const t = (i / total) * edges.length % 1;
            const v1 = vertices[e[0]], v2 = vertices[e[1]];
            return { x: (v1[0] + (v2[0] - v1[0]) * t) * 1.2, y: (v1[1] + (v2[1] - v1[1]) * t) * 1.2, z: (v1[2] + (v2[2] - v1[2]) * t) * 1.2 };
        },
    },
    tetrahedron: {
        name: 'Tetrahedron',
        icon: '🔼',
        generate: (i, total) => {
            const vertices = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => v.map(c => c * 0.8));
            const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
            const e = edges[i % edges.length];
            const t = (i / total) * edges.length % 1;
            return { x: vertices[e[0]][0] + (vertices[e[1]][0] - vertices[e[0]][0]) * t, y: vertices[e[0]][1] + (vertices[e[1]][1] - vertices[e[0]][1]) * t, z: vertices[e[0]][2] + (vertices[e[1]][2] - vertices[e[0]][2]) * t };
        },
    },
    icosahedron: {
        name: 'Icosahedron',
        icon: '⬡',
        generate: (i, _total) => {
            const vertices = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]];
            const idx = i % vertices.length;
            const v = vertices[idx];
            const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return { x: v[0] / norm * 1.2, y: v[1] / norm * 1.2, z: v[2] / norm * 1.2 };
        },
    },
    dodecahedron: {
        name: 'Dodecahedron',
        icon: '⬢',
        generate: (i, _total) => {
            const a = 1 / PHI, b = PHI;
            const vertices = [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [0, a, b], [0, a, -b], [0, -a, b], [0, -a, -b], [a, b, 0], [a, -b, 0], [-a, b, 0], [-a, -b, 0], [b, 0, a], [b, 0, -a], [-b, 0, a], [-b, 0, -a]];
            const idx = i % vertices.length;
            const v = vertices[idx];
            const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return { x: v[0] / norm * 1.2, y: v[1] / norm * 1.2, z: v[2] / norm * 1.2 };
        },
    },

    // ===== ADVANCED 3D SHAPES =====
    globe: {
        name: 'Globe',
        icon: '🌍',
        generate: (i, total) => {
            const lat = Math.floor((i / total) * 18);
            const lon = (i % Math.floor(total / 18)) / Math.floor(total / 18);
            const phi = (lat / 18) * Math.PI;
            const theta = lon * TWO_PI;
            return { x: 1.2 * Math.sin(phi) * Math.cos(theta), y: 1.2 * Math.cos(phi), z: 1.2 * Math.sin(phi) * Math.sin(theta) };
        },
    },
    capsule: {
        name: 'Capsule',
        icon: '💊',
        generate: (i, total) => {
            const t = i / total;
            if (t < 0.25 || t > 0.75) {
                const sphereT = t < 0.25 ? t * 4 : (t - 0.75) * 4;
                const y = t < 0.25 ? 0.8 : -0.8;
                const angle = sphereT * TWO_PI * 5;
                return { x: Math.cos(angle) * 0.5 * (1 - sphereT * 0.5), y: y + (t < 0.25 ? sphereT * 0.5 : -sphereT * 0.5), z: Math.sin(angle) * 0.5 * (1 - sphereT * 0.5) };
            }
            const angle = ((t - 0.25) * 2) * TWO_PI * 8;
            const y = 0.8 - (t - 0.25) * 3.2;
            return { x: Math.cos(angle) * 0.5, y, z: Math.sin(angle) * 0.5 };
        },
    },
    prism: {
        name: 'Prism',
        icon: '📐',
        generate: (i, total) => {
            const sides = 6;
            const angle = (i % sides) / sides * TWO_PI;
            const y = (i / total) * 2 - 1;
            return { x: Math.cos(angle) * 0.8, y: y * 1.2, z: Math.sin(angle) * 0.8 };
        },
    },
    hemisphere: {
        name: 'Hemisphere',
        icon: '🌓',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1.2);
            return { x: pos.x, y: Math.abs(pos.y), z: pos.z };
        },
    },
    ellipsoid: {
        name: 'Ellipsoid',
        icon: '🥚',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1);
            return { x: pos.x * 0.6, y: pos.y * 1.2, z: pos.z * 0.8 };
        },
    },
    egg: {
        name: 'Egg',
        icon: '🥚',
        generate: (i, total) => {
            const phi = Math.acos(1 - 2 * (i + 0.5) / total);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const r = 0.8 + 0.4 * Math.cos(phi);
            return { x: r * Math.sin(phi) * Math.cos(theta) * 0.8, y: Math.cos(phi) * 1.2, z: r * Math.sin(phi) * Math.sin(theta) * 0.8 };
        },
    },
    donut: {
        name: 'Donut',
        icon: '🍩',
        generate: (i, total) => {
            const u = (i / Math.sqrt(total)) * TWO_PI * 2;
            const v = ((i % Math.sqrt(total)) / Math.sqrt(total)) * TWO_PI;
            const R = 0.9, r = 0.35;
            return { x: (R + r * Math.cos(v)) * Math.cos(u), y: r * Math.sin(v) * 0.8, z: (R + r * Math.cos(v)) * Math.sin(u) };
        },
    },
    barrel: {
        name: 'Barrel',
        icon: '🛢️',
        generate: (i, total) => {
            const t = i / total;
            const y = t * 2 - 1;
            const bulge = 1 - y * y * 0.3;
            const angle = t * TWO_PI * 12;
            return { x: Math.cos(angle) * 0.7 * bulge, y: y * 1.2, z: Math.sin(angle) * 0.7 * bulge };
        },
    },
    hourglass: {
        name: 'Hourglass',
        icon: '⏳',
        generate: (i, total) => {
            const t = (i / total) * 2 - 1;
            const angle = (i * 0.5) % TWO_PI;
            const r = Math.abs(t) * 0.8 + 0.1;
            return { x: Math.cos(angle) * r, y: t * 1.3, z: Math.sin(angle) * r };
        },
    },
    spindle: {
        name: 'Spindle',
        icon: '🧵',
        generate: (i, total) => {
            const t = (i / total) * 2 - 1;
            const angle = (i * 0.3) % TWO_PI;
            const r = (1 - t * t) * 0.7;
            return { x: Math.cos(angle) * r, y: t * 1.4, z: Math.sin(angle) * r };
        },
    },

    // ===== COMPLEX 3D SHAPES =====
    helix: {
        name: 'Helix',
        icon: '🧬',
        generate: (i, total) => {
            const t = (i / total) * TWO_PI * 4;
            return { x: Math.cos(t) * 0.8, y: (i / total - 0.5) * 2.5, z: Math.sin(t) * 0.8 };
        },
    },
    dna: {
        name: 'DNA',
        icon: '🧬',
        generate: (i, total) => {
            const t = (i / total) * 8;
            const strand = i % 2;
            const offset = strand * Math.PI;
            return { x: Math.cos(t * Math.PI + offset) * 0.6, y: t - 4, z: Math.sin(t * Math.PI + offset) * 0.6 };
        },
    },
    spring: {
        name: 'Spring',
        icon: '🔩',
        generate: (i, total) => {
            const t = (i / total) * TWO_PI * 6;
            const y = (i / total) * 2.5 - 1.25;
            return { x: Math.cos(t) * 0.6, y, z: Math.sin(t) * 0.6 };
        },
    },
    mobius: {
        name: 'Möbius',
        icon: '🔁',
        generate: (i, total) => {
            const u = (i / total) * TWO_PI;
            const v = ((i * 3) % 10) / 10 - 0.5;
            return { x: (1 + v * 0.5 * Math.cos(u / 2)) * Math.cos(u), y: (1 + v * 0.5 * Math.cos(u / 2)) * Math.sin(u) * 0.5, z: v * 0.5 * Math.sin(u / 2) };
        },
    },
    knot: {
        name: 'Knot',
        icon: '🪢',
        generate: (i, total) => {
            const t = (i / total) * TWO_PI * 2;
            return { x: (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.35, y: (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.35, z: -Math.sin(3 * t) * 0.35 };
        },
    },
    trefoil: {
        name: 'Trefoil',
        icon: '☘️',
        generate: (i, total) => {
            const t = (i / total) * TWO_PI * 2;
            const x = Math.sin(t) + 2 * Math.sin(2 * t);
            const y = Math.cos(t) - 2 * Math.cos(2 * t);
            const z = -Math.sin(3 * t);
            return { x: x * 0.3, y: y * 0.3, z: z * 0.5 };
        },
    },
    shell: {
        name: 'Shell',
        icon: '🐚',
        generate: (i, total) => {
            const t = (i / total) * 4 * Math.PI;
            const r = Math.exp(t * 0.12);
            return { x: r * Math.cos(t) * 0.12, y: r * Math.sin(t) * 0.12, z: t * 0.08 - 0.5 };
        },
    },
    nautilus: {
        name: 'Nautilus',
        icon: '🐚',
        generate: (i, total) => {
            const t = (i / total) * 3 * Math.PI;
            const r = Math.pow(PHI, t / Math.PI) * 0.15;
            return { x: r * Math.cos(t), y: (i / total - 0.5) * 0.8, z: r * Math.sin(t) };
        },
    },
    vortex: {
        name: 'Vortex',
        icon: '🌀',
        generate: (i, total) => {
            const t = i / total;
            const angle = t * TWO_PI * 8;
            const y = t * 2.5 - 1.25;
            const r = (1 - t) * 1.2;
            return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
        },
    },
    tornado: {
        name: 'Tornado',
        icon: '🌪️',
        generate: (i, total) => {
            const t = i / total;
            const angle = t * TWO_PI * 10;
            const y = t * 3 - 1.5;
            const r = t * 1.2 + 0.1;
            return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
        },
    },

    // ===== STRUCTURAL 3D SHAPES =====
    cage: {
        name: 'Cage',
        icon: '🏗️',
        generate: (i, total) => {
            const bar = i % 16;
            const t = (i / total) * 16 % 1;
            if (bar < 8) {
                const angle = (bar / 8) * TWO_PI;
                return { x: Math.cos(angle) * 1, y: t * 2 - 1, z: Math.sin(angle) * 1 };
            }
            const ring = bar < 12 ? -1 : 1;
            const angle = ((bar - 8) % 4) / 4 * TWO_PI + t * TWO_PI / 4;
            return { x: Math.cos(angle) * 1, y: ring, z: Math.sin(angle) * 1 };
        },
    },
    wireframe_cube: {
        name: 'Wireframe',
        icon: '📦',
        generate: (i, total) => {
            const edge = i % 12;
            const t = (i / total) * 12 % 1;
            const edges = [
                [[1, 1, 1], [1, 1, -1]], [[1, 1, -1], [1, -1, -1]], [[1, -1, -1], [1, -1, 1]], [[1, -1, 1], [1, 1, 1]],
                [[-1, 1, 1], [-1, 1, -1]], [[-1, 1, -1], [-1, -1, -1]], [[-1, -1, -1], [-1, -1, 1]], [[-1, -1, 1], [-1, 1, 1]],
                [[1, 1, 1], [-1, 1, 1]], [[1, 1, -1], [-1, 1, -1]], [[1, -1, 1], [-1, -1, 1]], [[1, -1, -1], [-1, -1, -1]]
            ];
            const e = edges[edge];
            return { x: e[0][0] + (e[1][0] - e[0][0]) * t, y: e[0][1] + (e[1][1] - e[0][1]) * t, z: e[0][2] + (e[1][2] - e[0][2]) * t };
        },
    },
    lattice: {
        name: 'Lattice',
        icon: '🔲',
        generate: (i, total) => {
            const grid = Math.ceil(Math.cbrt(total));
            const x = (i % grid) / (grid - 1) * 2 - 1;
            const y = (Math.floor(i / grid) % grid) / (grid - 1) * 2 - 1;
            const z = Math.floor(i / (grid * grid)) / (grid - 1) * 2 - 1;
            return { x, y, z };
        },
    },
    geodesic: {
        name: 'Geodesic',
        icon: '🔮',
        generate: (i, total) => {
            const freq = 4;
            const pos = onSphere(i, total, 1.2);
            const snapAngle = Math.round((Math.atan2(pos.z, pos.x) / TWO_PI) * freq * 6) / (freq * 6) * TWO_PI;
            return { x: Math.cos(snapAngle) * Math.sqrt(pos.x * pos.x + pos.z * pos.z), y: pos.y, z: Math.sin(snapAngle) * Math.sqrt(pos.x * pos.x + pos.z * pos.z) };
        },
    },
    fullerene: {
        name: 'Fullerene',
        icon: '⚽',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1.2);
            const hexAngle = Math.floor((Math.atan2(pos.z, pos.x) / TWO_PI + 0.5) * 12) / 12 * TWO_PI;
            const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            return { x: Math.cos(hexAngle) * r, y: pos.y, z: Math.sin(hexAngle) * r };
        },
    },
    diamond_lattice: {
        name: 'Diamond',
        icon: '💎',
        generate: (i, total) => {
            const t = i / total;
            const layer = Math.floor(t * 10);
            const y = layer / 5 - 1;
            const layerPhase = (layer % 2) * Math.PI / 4;
            const angle = (i % 8) / 8 * TWO_PI + layerPhase;
            const r = 1 - Math.abs(y) * 0.6;
            return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
        },
    },
    crystal: {
        name: 'Crystal',
        icon: '💠',
        generate: (i, total) => {
            const t = i / total;
            const y = t * 2 - 1;
            const r = 1 - Math.abs(y);
            const sides = 6;
            const angle = Math.floor((i % (total / 10)) / (total / 10 / sides)) / sides * TWO_PI;
            return { x: Math.cos(angle) * r * 0.8, y: y * 1.5, z: Math.sin(angle) * r * 0.8 };
        },
    },
    quartz: {
        name: 'Quartz',
        icon: '🪨',
        generate: (i, total) => {
            const t = i / total;
            const y = t * 2.5 - 1.25;
            const r = Math.min(1, 1.5 - Math.abs(y));
            const sides = 6;
            const angle = (i % sides) / sides * TWO_PI + y * 0.2;
            return { x: Math.cos(angle) * r * 0.6, y, z: Math.sin(angle) * r * 0.6 };
        },
    },
    snowflake_3d: {
        name: 'Snowflake',
        icon: '❄️',
        generate: (i, total) => {
            const arm = i % 6;
            const t = (i / total) * 6;
            const angle = arm / 6 * TWO_PI;
            const r = (t % 1) * 1.2;
            const branch = Math.floor(t * 3) % 3;
            const branchAngle = angle + (branch - 1) * 0.3;
            return { x: Math.cos(branchAngle) * r, y: Math.sin(t * Math.PI) * 0.3, z: Math.sin(branchAngle) * r };
        },
    },
    stellated: {
        name: 'Stellated',
        icon: '✴️',
        generate: (i, total) => {
            const spike = i % 20;
            const t = (i / total) * 20 % 1;
            const phi = Math.acos(1 - 2 * (spike + 0.5) / 20);
            const theta = Math.PI * (1 + Math.sqrt(5)) * spike;
            const baseR = 0.6, spikeR = 1.3;
            const r = baseR + (spikeR - baseR) * (1 - t);
            return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta) };
        },
    },

    // ===== ORGANIC 3D SHAPES =====
    atom: {
        name: 'Atom',
        icon: '⚛️',
        generate: (i, total) => {
            const orbit = Math.floor((i / total) * 3);
            const t = ((i % Math.floor(total / 3)) / Math.floor(total / 3)) * TWO_PI;
            const r = 1.2;
            if (orbit === 0) return { x: Math.cos(t) * r, y: Math.sin(t) * r, z: 0 };
            if (orbit === 1) return { x: Math.cos(t) * r, y: 0, z: Math.sin(t) * r };
            return { x: 0, y: Math.cos(t) * r, z: Math.sin(t) * r };
        },
    },
    molecule: {
        name: 'Molecule',
        icon: '🧪',
        generate: (i, total) => {
            const node = i % 5;
            const t = (i / total) * 5 % 1;
            const positions = [[0, 0, 0], [1, 0, 0], [-0.5, 0.86, 0], [-0.5, -0.86, 0], [0, 0, 1]];
            const bonds = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2]];
            const bond = bonds[node];
            const p1 = positions[bond[0]], p2 = positions[bond[1]];
            return { x: p1[0] + (p2[0] - p1[0]) * t, y: p1[1] + (p2[1] - p1[1]) * t, z: p1[2] + (p2[2] - p1[2]) * t };
        },
    },
    cell: {
        name: 'Cell',
        icon: '🦠',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1);
            const wobble = Math.sin(i * 0.5) * 0.2 + 1;
            return { x: pos.x * wobble, y: pos.y * wobble * 0.8, z: pos.z * wobble };
        },
    },
    nucleus: {
        name: 'Nucleus',
        icon: '🔴',
        generate: (i, total) => {
            const pos = onSphere(i, total, 0.8);
            const cluster = Math.sin(i * 2) * 0.15;
            return { x: pos.x + cluster, y: pos.y + cluster, z: pos.z + cluster };
        },
    },
    galaxy: {
        name: 'Galaxy',
        icon: '🌌',
        generate: (i, total) => {
            const arm = i % 4;
            const t = (i / total) * 4;
            const angle = t * TWO_PI + (arm * Math.PI / 2);
            const r = t * 1.3;
            return { x: Math.cos(angle) * r, y: Math.sin(t * Math.PI) * 0.15, z: Math.sin(angle) * r };
        },
    },
    nebula: {
        name: 'Nebula',
        icon: '🌫️',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1.2);
            const spread = (Math.sin(i * 0.7) + 1) * 0.3;
            return { x: pos.x * (1 + spread), y: pos.y * (1 + spread * 0.5), z: pos.z * (1 + spread) };
        },
    },
    pulsar: {
        name: 'Pulsar',
        icon: '💫',
        generate: (i, total) => {
            const t = i / total;
            const beam = i % 2;
            if (beam === 0) {
                const y = t * 3 - 1.5;
                return { x: 0, y, z: 0 };
            }
            if (t < 0.5) {
                const angle = t * 2 * TWO_PI * 5;
                return { x: Math.cos(angle) * 0.3, y: t * 2 - 0.5, z: Math.sin(angle) * 0.3 };
            }
            const angle = (t - 0.5) * 2 * TWO_PI * 5;
            return { x: Math.cos(angle) * 0.3, y: -(t - 0.5) * 2 - 0.5, z: Math.sin(angle) * 0.3 };
        },
    },
    blackhole: {
        name: 'Black Hole',
        icon: '🕳️',
        generate: (i, total) => {
            const t = i / total;
            const angle = t * TWO_PI * 15;
            const r = 0.2 + t * 1.2;
            return { x: Math.cos(angle) * r, y: Math.sin(t * TWO_PI) * 0.2 * (1 - t), z: Math.sin(angle) * r };
        },
    },
    wormhole: {
        name: 'Wormhole',
        icon: '🌀',
        generate: (i, total) => {
            const t = i / total;
            const angle = t * TWO_PI * 8;
            const y = t * 2.5 - 1.25;
            const r = 0.3 + Math.abs(y) * 0.3;
            return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
        },
    },
    corona: {
        name: 'Corona',
        icon: '☀️',
        generate: (i, total) => {
            const pos = onSphere(i, total, 1);
            const spike = (Math.sin(i * 3) + 1) * 0.3 + 1;
            return { x: pos.x * spike, y: pos.y * spike, z: pos.z * spike };
        },
    },

    // ===== RANDOM =====
    random: {
        name: 'Random',
        icon: '🎲',
        generate: (_i, _total) => {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * TWO_PI;
            const r = 0.3 + Math.random() * 1;
            return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) };
        },
    },
};

export const SHAPE_LIST = Object.keys(PARTICLE_SHAPES) as ParticleShape[];

// Get a random shape (excluding 'random' itself)
export function getRandomShape(): ParticleShape {
    const shapes = SHAPE_LIST.filter(s => s !== 'random');
    return shapes[Math.floor(Math.random() * shapes.length)];
}
