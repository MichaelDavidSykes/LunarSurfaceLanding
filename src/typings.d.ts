// Supplemental shims to satisfy Angular build resolution
// without overriding core typings.
declare module 'three/build/three.cjs';
declare module 'three/build/three.js';
declare module 'three/examples/jsm/controls/OrbitControls.js';
declare module 'three/examples/jsm/renderers/CSS2DRenderer.js';

// WebGPU placeholder to support older TS lib.dom without WebGPU.
// Safe because we only need it for ambient types used by @types/three.
type GPUTexture = any;
