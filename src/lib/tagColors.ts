export interface TagColor {
  color: string;
  border: string;
  bg: string;
}

const PALETTES: TagColor[] = [
  { color: '#61dafb', border: 'rgba(97,218,251,0.25)', bg: 'rgba(97,218,251,0.06)' }, // react
  { color: '#3178c6', border: 'rgba(49,120,198,0.25)', bg: 'rgba(49,120,198,0.06)' }, // typescript
  { color: '#ece8e3', border: 'rgba(236,232,227,0.25)', bg: 'rgba(236,232,227,0.06)' }, // next.js
  { color: '#4fc08d', border: 'rgba(79,192,141,0.25)', bg: 'rgba(79,192,141,0.06)' }, // vue-3
  { color: '#c97d5c', border: 'rgba(201,125,92,0.25)', bg: 'rgba(201,125,92,0.06)' }, // ai
  { color: '#a8d5ff', border: 'rgba(168,213,255,0.25)', bg: 'rgba(168,213,255,0.06)' }, // llm
  { color: '#3776ab', border: 'rgba(55,118,171,0.25)', bg: 'rgba(55,118,171,0.06)' }, // python
  { color: '#ab7bc9', border: 'rgba(171,123,201,0.25)', bg: 'rgba(171,123,201,0.06)' }, // stable-diffusion
  { color: '#f9a03c', border: 'rgba(249,160,60,0.25)', bg: 'rgba(249,160,60,0.06)' }, // d3js
  { color: '#339933', border: 'rgba(51,153,51,0.25)', bg: 'rgba(51,153,51,0.06)' }, // nodejs
  { color: '#e74c3c', border: 'rgba(231,76,60,0.25)', bg: 'rgba(231,76,60,0.06)' }, // dashboard
  { color: '#2ecc71', border: 'rgba(46,204,113,0.25)', bg: 'rgba(46,204,113,0.06)' }, // nlp
  { color: '#f39c12', border: 'rgba(243,156,18,0.25)', bg: 'rgba(243,156,18,0.06)' }, // productivity
  { color: '#0078d7', border: 'rgba(0,120,215,0.25)', bg: 'rgba(0,120,215,0.06)' }, // vs-code
  { color: '#6c5ce7', border: 'rgba(108,92,231,0.25)', bg: 'rgba(108,92,231,0.06)' }, // developer-tools
  { color: '#e17055', border: 'rgba(225,112,85,0.25)', bg: 'rgba(225,112,85,0.06)' }, // writing
  { color: '#00b894', border: 'rgba(0,184,148,0.25)', bg: 'rgba(0,184,148,0.06)' }, // saas
  { color: '#e84393', border: 'rgba(232,67,147,0.25)', bg: 'rgba(232,67,147,0.06)' }, // webrtc
  { color: '#74b9ff', border: 'rgba(116,185,255,0.25)', bg: 'rgba(116,185,255,0.06)' }, // audio
  { color: '#fdcb6e', border: 'rgba(253,203,110,0.25)', bg: 'rgba(253,203,110,0.06)' }, // education
  { color: '#636e72', border: 'rgba(99,110,114,0.25)', bg: 'rgba(99,110,114,0.06)' }, // recommendation
  { color: '#a29bfe', border: 'rgba(162,155,254,0.25)', bg: 'rgba(162,155,254,0.06)' }, // low-code
  { color: '#6ab04c', border: 'rgba(106,176,76,0.25)', bg: 'rgba(106,176,76,0.06)' }, // ffmpeg
  { color: '#e056fd', border: 'rgba(224,86,253,0.25)', bg: 'rgba(224,86,253,0.06)' }, // media
];

/** Deterministic hash: tag name → palette index */
export function hashTagColor(tag: string): TagColor {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!;
}
