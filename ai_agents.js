// =====================================================================
//  AI AGENTS AT WORK — animated short made 100% with code (episode 1)
//  Vertical 1080x1920, 30 fps.
//  Everything is a function of time t: draw(ctx, t) paints the frame at instant t.
//  To change the story, edit the TIMELINE (TL) and the drawing functions.
// =====================================================================

const W = 1080, H = 1920, FPS = 30;

// ---------- TIMELINE (seconds) ----------
const TL = {
  dur: 17.5,
  typeStart: 0.3,        // human starts typing
  meFillEnd: 2.8,        // his bar reaches 67%
  robotIn: [2.8, 3.35],  // robot slides in
  aiSlam: 3.4,           // AI bar jumps to 101%
  shock: [3.45, 3.95],   // human gets startled
  frantic: [3.9, 7.75],  // human types frantically
  ai250: 5.3, ai999: 6.8,
  ignite: 7.4,           // human catches fire
  burnout1: 8.0,         // "BURNOUT"
  ashFrom: 8.3,          // turns into a little ash pile
  barsOut: 9.3,
  hand: [9.4, 10.2],     // boss's hand drops the task pile
  taskDrop: 9.85,
  agents: [10.95, 11.55, 12.15, 12.75], // robot delegates... recursively
  ignite2: 13.65,
  burnout2: 14.0,
  glance: [14.45, 14.95], // the ones below look up... and go back to -_-
  zoomOut: [15.0, 15.5],
  endCard: 15.5,
};

const C = {
  ink: '#2B2622', white: '#FBF8F1', paper: '#FFFDF6', bg: '#E8DBC0',
  floor: '#DCC9A3', wood: '#C99A63', metal: '#C6CFD5', metalDark: '#B4BEC5',
  me: '#5B8DEF', ai: '#3DBE6E', red: '#D9442E', screen: '#1C2622',
  glow: '#62F5A0', suit: '#2F3652', skin: '#F1DFCB', ash: '#57514C',
};

// ---------- TEXTS (language: set window.LANG = 'pt' before loading the scene) ----------
const LANG = (typeof window !== 'undefined' && window.LANG) || 'en';
const TXT = {
  en: { eff: 'EFFICIENCY', me: 'ME', ai: 'AI', off: 'OFFLINE', burn: 'BURNOUT', tasks: 'TASKS',
        agents: ['AGENT', 'SUB-AGENT', 'SUB-SUB-AGENT', 'INTERN'], end1: 'AI AGENTS IN 2026', end2: 'DELEGATION: COMPLETE' },
  pt: { eff: 'EFICIÊNCIA', me: 'EU', ai: 'IA', off: 'OFFLINE', burn: 'BURNOUT', tasks: 'TAREFAS',
        agents: ['AGENTE', 'SUB-AGENTE', 'SUB-SUB-AGENTE', 'ESTAGIÁRIO'], end1: 'AGENTES DE IA EM 2026', end2: 'DELEGAÇÃO: CONCLUÍDA' },
}[LANG];

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const bump = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOutBack = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const easeInQuad = p => p * p;
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function mixHex(a, b, p) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(p))).toString(16).padStart(2, '0')).join('');
}
const mix2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

// ---------- drawing primitives ----------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillStroke(ctx, fill, lw = 7) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
}
function circle(ctx, x, y, r, fill, lw = 7) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); fillStroke(ctx, fill, lw); }
// outlined limb: thick dark line underneath + light line on top
function limb(ctx, pts, w, fill = C.white) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = C.ink; ctx.lineWidth = w + 13; ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
}
function line(ctx, x1, y1, x2, y2, lw = 7, col = C.ink) {
  ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function text(ctx, str, x, y, font, fill, align = 'center', stroke = null, sw = 0) {
  ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
}
function flame(ctx, x, y, s, col, a, outline = false) {
  ctx.globalAlpha = a; ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.5);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.05, y - s * 0.2, x, y + s * 0.65);
  ctx.bezierCurveTo(x - s * 1.05, y - s * 0.2, x - s * 0.4, y - s * 0.9, x, y - s * 1.5);
  ctx.fill();
  if (outline) { ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); }
  ctx.globalAlpha = 1;
}

// ---------- paper background (generated once) ----------
let paperCanvas = null;
function getPaper() {
  if (paperCanvas) return paperCanvas;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    const x = hash(i * 1.1) * W, y = hash(i * 2.3 + 5) * H, r = hash(i * 3.7 + 9) * 1.8 + 0.4;
    g.fillStyle = hash(i * 5.1) > 0.5 ? 'rgba(90,65,30,0.07)' : 'rgba(255,255,255,0.12)';
    g.fillRect(x, y, r, r);
  }
  for (let i = 0; i < 160; i++) {
    const x = hash(i * 7.7) * W, y = hash(i * 8.9) * H, a = hash(i * 9.1) * Math.PI, l = 10 + hash(i * 1.3) * 40;
    g.strokeStyle = 'rgba(90,70,40,0.08)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  paperCanvas = c; return c;
}

// =====================================================================
//  VALUES THAT CHANGE OVER TIME
// =====================================================================
function mePct(t) {
  if (t < TL.typeStart) return 0;
  if (t < TL.meFillEnd) return 67 * easeOutCubic(seg(t, TL.typeStart, TL.meFillEnd));
  if (t < TL.frantic[0]) return 67;
  if (t < 7.6) return 67 + 5 * seg(t, TL.frantic[0], 7.6);
  if (t < TL.burnout1) return 72;
  return 72 * (1 - easeInOutCubic(seg(t, TL.burnout1, TL.burnout1 + 0.5)));
}
function aiPct(t) {
  if (t < TL.aiSlam) return 0;
  if (t < 4.6) return 101 * easeOutCubic(seg(t, TL.aiSlam, TL.aiSlam + 0.15));
  if (t < 6.0) return lerp(101, 250, easeInOutCubic(seg(t, 4.6, TL.ai250)));
  return lerp(250, 999, easeInOutCubic(seg(t, 6.0, TL.ai999)));
}
function camera(t) {
  const p1 = easeInOutCubic(seg(t, 3.7, 6.5)) * (1 - easeInOutCubic(seg(t, 8.6, 9.4)));
  let z = lerp(1, 1.12, p1), x = lerp(540, 470, p1), y = lerp(960, 1120, p1);
  const p2 = easeInOutCubic(seg(t, 13.25, 13.75)) * (1 - easeInOutCubic(seg(t, TL.zoomOut[0], TL.zoomOut[1])));
  z = lerp(z, 2.3, p2); x = lerp(x, 810, p2); y = lerp(y, 600, p2);
  return { z, x, y };
}
function shake(t) {
  let a = 0;
  for (const [t0, amp, k] of [[TL.burnout1, 28, 7], [TL.burnout2, 24, 7], [TL.taskDrop, 12, 12], [TL.aiSlam, 8, 14]])
    if (t >= t0) a += amp * Math.exp(-(t - t0) * k);
  return { x: a * Math.sin(t * 93), y: a * Math.cos(t * 71) };
}
const robotX = t => lerp(1400, 830, easeOutBack(seg(t, TL.robotIn[0], TL.robotIn[1])));

// agent tower (scale, foot, top of head)
const AG_S = [0.5, 0.33, 0.21, 0.135];
const AG = (() => {
  const out = []; let foot = 945;
  for (const s of AG_S) { const top = foot - 360 * s; out.push({ s, foot, top, cx: 810, headCy: top + 75 * s }); foot = top; }
  return out;
})();
const AG_LABELS = TXT.agents;

// =====================================================================
//  SET
// =====================================================================
function drawFloor(ctx) {
  ctx.fillStyle = 'rgba(150,110,60,0.13)'; ctx.fillRect(-700, 1760, 2500, 1200);
  line(ctx, -700, 1760, 1800, 1760, 6);
}
function drawClock(ctx, t) {
  const x = 170, y = 760, r = 72;
  circle(ctx, x, y, r + 10, C.paper);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    line(ctx, x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14), x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4), i % 3 ? 3 : 6);
  }
  const spin = Math.max(0, Math.min(t, 7.6) - 3.7) * 11 + Math.max(0, t - 9.4) * 4;
  const m = -Math.PI / 2 + t * 0.25 + spin, h = -Math.PI / 2 + 1.2 + (t * 0.25 + spin) / 12;
  line(ctx, x, y, x + Math.cos(h) * 34, y + Math.sin(h) * 34, 8);
  line(ctx, x, y, x + Math.cos(m) * 54, y + Math.sin(m) * 54, 6);
  circle(ctx, x, y, 7, C.ink, 2);
}
function drawDeskAndLaptops(ctx) {
  limb(ctx, [[382, 1310], [382, 1757]], 20, C.wood);
  limb(ctx, [[712, 1310], [712, 1757]], 20, C.wood);
  rr(ctx, 350, 1288, 395, 32, 8); fillStroke(ctx, C.wood);
  // laptops seen from the side, back to back
  rr(ctx, 392, 1271, 135, 17, 5); fillStroke(ctx, '#DAD5CB', 6);
  limb(ctx, [[517, 1280], [527, 1124]], 12, '#DAD5CB');
  rr(ctx, 568, 1271, 135, 17, 5); fillStroke(ctx, '#DAD5CB', 6);
  limb(ctx, [[578, 1280], [568, 1124]], 12, '#DAD5CB');
}
function drawChair(ctx) {
  limb(ctx, [[180, 1395], [176, 1757]], 14, C.wood);
  limb(ctx, [[318, 1395], [322, 1757]], 14, C.wood);
  limb(ctx, [[168, 1385], [150, 1150]], 16, C.wood);
  rr(ctx, 122, 1105, 52, 135, 16); fillStroke(ctx, C.wood);
  rr(ctx, 145, 1372, 195, 22, 8); fillStroke(ctx, C.wood);
}
function drawStool(ctx, RX) {
  limb(ctx, [[RX, 1392], [RX, 1730]], 14, '#9AA4AA');
  limb(ctx, [[RX - 75, 1752], [RX + 75, 1752]], 12, '#9AA4AA');
  rr(ctx, RX - 92, 1372, 184, 22, 10); fillStroke(ctx, '#9AA4AA');
}

// =====================================================================
//  HUMAN
// =====================================================================
function humanState(t) {
  const lean = 18 * easeInOutCubic(seg(t, 3.7, 4.2)) * (1 - seg(t, 7.8, 8.2));
  const frantic = t >= TL.frantic[0] && t < TL.frantic[1];
  const q = Math.floor(t * 24);
  const jit = frantic ? (hash(q) - 0.5) * 8 : 0, jitY = frantic ? (hash(q + 99) - 0.5) * 6 : 0;
  let fill = mixHex(C.white, '#F2A28A', seg(t, 4.5, 7.4));
  fill = mixHex(fill, '#3B3532', seg(t, 7.7, 8.2));
  return { lean, frantic, jit, jitY, fill, alpha: 1 - seg(t, TL.ashFrom - 0.05, TL.ashFrom + 0.3), hx: 265 + lean + jit, hy: 1010 + jitY };
}
function drawHumanFace(ctx, t, x, y) {
  ctx.fillStyle = C.ink;
  const charred = t >= 7.75;
  if (t < TL.shock[0]) {                       // focused
    const blink = (t > 1.55 && t < 1.65);
    for (const ex of [28, 62]) {
      if (blink) line(ctx, x + ex - 10, y - 8, x + ex + 10, y - 8, 6);
      else { ctx.beginPath(); ctx.ellipse(x + ex, y - 8, 10, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    line(ctx, x + 36, y + 36, x + 58, y + 34, 6);
  } else if (t < 4.1 || charred) {             // startled (or toasted)
    const pr = charred ? 4 : 8;
    for (const [ex, ey] of [[22, -12], [64, -14]]) {
      circle(ctx, x + ex, y + ey, 21, C.paper, 5);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + ex + (charred ? 0 : 8), y + ey, pr, 0, 7); ctx.fill();
    }
    if (!charred) {
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + 22, y - 44, 16, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 64, y - 46, 16, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(x + 46, y + 40, 11, 15, 0, 0, 7); ctx.fill();
    }
  } else {                                      // despair: clenched teeth
    line(ctx, x + 6, y - 42, x + 36, y - 28, 7);
    line(ctx, x + 52, y - 30, x + 82, y - 44, 7);
    for (const ex of [26, 64]) { ctx.beginPath(); ctx.ellipse(x + ex, y - 10, 10, 13, 0, 0, 7); ctx.fill(); }
    rr(ctx, x + 22, y + 24, 54, 26, 6); fillStroke(ctx, C.paper, 5);
    line(ctx, x + 22, y + 37, x + 76, y + 37, 4);
    for (const dx of [36, 49, 62]) line(ctx, x + dx, y + 24, x + dx, y + 50, 4);
    if (t > 5.4) {                              // anger vein
      const vx = x + 52, vy = y - 70, s = 1 + 0.12 * Math.sin(t * 20);
      ctx.lineWidth = 6; ctx.strokeStyle = C.red;
      for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
        const ang = (a * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath(); ctx.arc(vx + Math.cos(ang) * 14 * s, vy + Math.sin(ang) * 14 * s, 9 * s, ang + Math.PI * 0.6, ang + Math.PI * 1.4); ctx.stroke();
      }
    }
  }
}
function drawSweatAndSteam(ctx, t, S) {
  // sweat drops
  for (let i = 0; i < 14; i++) {
    const b = 3.55 + i * 0.3, age = t - b;
    if (age < 0 || age > 0.75 || b > 7.7) continue;
    const side = i % 2 ? 1 : -1;
    const x = S.hx + side * (60 + age * 50), y = S.hy - 40 + age * age * 500;
    ctx.globalAlpha = 1 - age / 0.75;
    ctx.beginPath(); ctx.moveTo(x, y - 22);
    ctx.quadraticCurveTo(x + 13, y + 2, x, y + 9); ctx.quadraticCurveTo(x - 13, y + 2, x, y - 22);
    fillStroke(ctx, '#BFE3F5', 4); ctx.globalAlpha = 1;
  }
  // steam coming out of the head
  for (let i = 0; i < 16; i++) {
    const b = 5.6 + i * 0.14, age = t - b;
    if (age < 0 || age > 0.9 || b > 7.75) continue;
    const x = S.hx + (hash(i * 4.1) - 0.5) * 70 + Math.sin(age * 8 + i) * 10, y = S.hy - 90 - age * 170;
    ctx.globalAlpha = (1 - age / 0.9) * 0.85;
    circle(ctx, x, y, 12 + age * 30, '#FFFFFF', 4); ctx.globalAlpha = 1;
  }
}
function drawHumanBody(ctx, t, S) {
  if (S.alpha <= 0) return;
  ctx.globalAlpha = S.alpha;
  limb(ctx, [[285, 1365], [392, 1385], [402, 1742], [452, 1748]], 34, S.fill);
  limb(ctx, [[262 + S.lean * 0.6 + S.jit * 0.5, 1128], [272, 1342]], 112, S.fill);
  circle(ctx, S.hx, S.hy, 84, S.fill);
  drawHumanFace(ctx, t, S.hx, S.hy);
  ctx.globalAlpha = 1;
  drawSweatAndSteam(ctx, t, S);
}
function drawHumanArms(ctx, t, S) {
  if (S.alpha <= 0) return;
  ctx.globalAlpha = S.alpha;
  const shX = 268 + S.lean * 0.6 + S.jit * 0.5, shY = 1142;
  const typing = (t >= TL.typeStart && t < TL.shock[0]) || (t >= TL.frantic[0] + 0.05 && t < TL.frantic[1]);
  const f = S.frantic ? 7.5 : 4.2, amp = S.frantic ? 17 : 9;
  const w = bump(t, 3.45, 3.55, 3.85, 3.95);           // startled pose: hands up
  for (const k of [0, 1]) {
    const base = k ? [428, 1268] : [482, 1266];
    const dy = typing ? -amp * Math.abs(Math.sin(2 * Math.PI * f * t + k * 1.6)) : 0;
    let hand = [base[0] + (S.frantic ? S.jit : 0), base[1] + dy];
    let elbow = [shX + (k ? 58 : 80), 1236 - (k ? 0 : 6)];
    hand = mix2(hand, [k ? 380 : 415, 1150], w); elbow = mix2(elbow, [shX + 40, 1215], w);
    const col = k ? S.fill : mixHex(S.fill, '#000000', 0.08);
    limb(ctx, [[shX, shY], elbow, hand], 30, col);
    circle(ctx, hand[0], hand[1], 17, col, 6);
  }
  ctx.globalAlpha = 1;
}
function drawAshPile(ctx, t) {
  const p = easeOutBack(seg(t, TL.ashFrom, TL.ashFrom + 0.45));
  if (p <= 0) return;
  ctx.save(); ctx.translate(245, 1372); ctx.scale(p, p);
  ctx.beginPath(); ctx.moveTo(-85, 0);
  ctx.quadraticCurveTo(-80, -40, -45, -48); ctx.quadraticCurveTo(-30, -82, 0, -78);
  ctx.quadraticCurveTo(30, -84, 42, -52); ctx.quadraticCurveTo(82, -42, 85, 0); ctx.closePath();
  fillStroke(ctx, C.ash);
  // little eyes on the ash pile
  const blink = ((t * 1.0) % 2.6) < 0.12;
  const look = t > TL.burnout2 - 0.3 ? [5, -5] : [4, 1];
  for (const ex of [-18, 16]) {
    if (blink) { line(ctx, ex - 9, -42, ex + 9, -42, 4, C.paper); continue; }
    ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(ex, -42, 11, 0, 7); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ex + look[0], -42 + look[1], 5, 0, 7); ctx.fill();
  }
  ctx.restore();
  // little smoke
  for (let i = 0; i < 18; i++) {
    const b = TL.ashFrom + 0.2 + i * 0.16, age = t - b;
    if (age < 0 || age > 1.2) continue;
    const x = 245 + (hash(i * 2.2) - 0.5) * 80 + Math.sin(age * 5 + i) * 14, y = 1300 - age * 220;
    ctx.globalAlpha = (1 - age / 1.2) * 0.5;
    ctx.fillStyle = '#8B857F'; ctx.beginPath(); ctx.arc(x, y, 10 + age * 26, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// =====================================================================
//  ROBOT and AGENTS
// =====================================================================
function robotFace(t) {
  if (t < TL.aiSlam) return ['smile'];
  if (t < TL.burnout1) return ['happy'];
  if (t < TL.hand[0]) return ['look', -16, 8];
  if (t < TL.taskDrop) return ['look', 0, -14];
  if (t < 10.45) return ['shock'];
  if (t < TL.agents[0] + 0.6) return t < 10.7 ? ['meh'] : ['shock'];
  if (t >= TL.glance[0] && t < TL.glance[1]) return ['look', 0, -14];
  return ['chill'];
}
function drawFace(ctx, cx, cy, s, face, t) {
  const [kind, fx = 0, fy = 0] = face;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.strokeStyle = C.glow; ctx.fillStyle = C.glow; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = C.glow; ctx.shadowBlur = 14 * s; ctx.lineWidth = 7;
  const E = [[-30, -12], [30, -12]];
  const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const seg2 = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  if (kind === 'smile') { E.forEach(([x, y]) => dot(x, y, 9)); ctx.beginPath(); ctx.arc(0, 10, 24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  if (kind === 'happy') {
    E.forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 13, y + 6); ctx.lineTo(x, y - 8); ctx.lineTo(x + 13, y + 6); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(0, 12, 26, 0.05 * Math.PI, 0.95 * Math.PI); ctx.closePath(); ctx.fill();
  }
  if (kind === 'look') { E.forEach(([x, y]) => dot(x + fx, y + fy, 9)); seg2(-14 + fx * 0.5, 26, 14 + fx * 0.5, 26); }
  if (kind === 'shock') { E.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.stroke(); dot(x, y, 4); }); ctx.beginPath(); ctx.arc(0, 28, 9, 0, 7); ctx.stroke(); }
  if (kind === 'meh') { E.forEach(([x, y]) => dot(x, y - 2, 6)); seg2(-6, 24, 6, 24); }
  if (kind === 'chill') { E.forEach(([x, y]) => seg2(x - 13, y, x + 13, y)); seg2(-12, 26, 14, 21); }
  if (kind === 'xx') {
    E.forEach(([x, y]) => { seg2(x - 11, y - 11, x + 11, y + 11); seg2(x + 11, y - 11, x - 11, y + 11); });
    ctx.beginPath(); ctx.moveTo(-24, 28);
    for (let i = 1; i <= 6; i++) ctx.lineTo(-24 + i * 8, 28 + (i % 2 ? -7 : 7));
    ctx.stroke();
  }
  ctx.restore();
}
function drawRobotBody(ctx, t, RX) {
  drawStool(ctx, RX);
  limb(ctx, [[RX - 15, 1365], [RX - 128, 1385], [RX - 138, 1742], [RX - 188, 1748]], 34, C.metal);
  rr(ctx, RX - 58, 1125, 116, 250, 28); fillStroke(ctx, C.metal);
  rr(ctx, RX - 32, 1182, 64, 48, 9); fillStroke(ctx, C.screen, 5);
  ['#FF5A4F', '#FFD23F', C.glow].forEach((c, i) => {
    const on = Math.floor(t * 6 + i * 2) % 3 !== 0;
    ctx.fillStyle = on ? c : '#3A4440'; ctx.beginPath(); ctx.arc(RX - 18 + i * 18, 1206, 6, 0, 7); ctx.fill();
  });
  rr(ctx, RX - 18, 1090, 36, 40, 6); fillStroke(ctx, C.metalDark);
  // antenna
  line(ctx, RX + 40, 948, RX + 52, 893, 7);
  circle(ctx, RX + 52, 888, 11, Math.floor(t * 2) % 2 ? '#FF5A4F' : C.glow, 5);
  rr(ctx, RX - 102, 945, 204, 150, 24); fillStroke(ctx, C.metalDark);
  rr(ctx, RX - 84, 962, 168, 116, 16); fillStroke(ctx, C.screen, 5);
  drawFace(ctx, RX - 8, 1020, 1, robotFace(t), t);
}
function drawRobotArms(ctx, t, RX) {
  const sh = [RX - 35, 1168];
  const fast = t >= TL.aiSlam && t < TL.burnout1;
  for (const k of [0, 1]) {
    const base = [RX - 188 + k * 42, 1268], elbow = [RX - 102 + k * 22, 1246];
    const col = k ? C.metal : C.metalDark;
    if (fast) {
      for (let g = 3; g >= 1; g--) {
        const ph = 2 * Math.PI * 13 * t - g * 0.55 + k * 2;
        const hnd = [base[0] + Math.sin(ph) * 16, base[1] - Math.abs(Math.sin(ph * 1.3)) * 14];
        ctx.globalAlpha = 0.16 * (4 - g);
        limb(ctx, [sh, elbow, hnd], 24, col); ctx.globalAlpha = 1;
      }
    }
    const ph = 2 * Math.PI * 13 * t + k * 2;
    const hand = fast ? [base[0] + Math.sin(ph) * 16, base[1] - Math.abs(Math.sin(ph * 1.3)) * 14] : base;
    limb(ctx, [sh, elbow, hand], 24, col);
    rr(ctx, hand[0] - 17, hand[1] - 13, 34, 26, 8); fillStroke(ctx, col, 6);
  }
  if (fast) { // speed lines
    for (let i = 0; i < 3; i++) {
      const y = 1205 + i * 18, o = (t * 400 + i * 40) % 60;
      line(ctx, RX - 250 + o, y, RX - 215 + o, y, 5);
    }
  }
}
function drawAgent(ctx, cx, foot, s, face, t) {
  limb(ctx, [[cx - 24 * s, foot - 75 * s], [cx - 24 * s, foot - 4 * s]], 22 * s, C.metal);
  limb(ctx, [[cx + 24 * s, foot - 75 * s], [cx + 24 * s, foot - 4 * s]], 22 * s, C.metal);
  limb(ctx, [[cx - 58 * s, foot - 190 * s], [cx - 88 * s, foot - 120 * s]], 18 * s, C.metalDark);
  limb(ctx, [[cx + 58 * s, foot - 190 * s], [cx + 88 * s, foot - 120 * s]], 18 * s, C.metalDark);
  const lw = Math.max(3, 7 * s * 1.4);
  rr(ctx, cx - 60 * s, foot - 215 * s, 120 * s, 145 * s, 18 * s); fillStroke(ctx, C.metal, lw);
  const top = foot - 360 * s;
  rr(ctx, cx - 95 * s, top, 190 * s, 150 * s, 22 * s); fillStroke(ctx, C.metalDark, lw);
  rr(ctx, cx - 80 * s, top + 15 * s, 160 * s, 112 * s, 14 * s); fillStroke(ctx, C.screen, Math.max(2, lw * 0.7));
  drawFace(ctx, cx, top + 71 * s, s * 0.95, face, t);
}
function agentFace(i, t) {
  const a = TL.agents;
  const got = a[i] + 0.6;                       // got the task
  const passed = i < 3 ? a[i + 1] + 0.6 : 99;   // passed it on
  if (t < got) return ['meh'];
  if (t >= passed) return (t >= TL.glance[0] && t < TL.glance[1]) ? ['look', 0, -14] : ['chill'];
  if (i === 3 && t > 13.45) return ['xx'];
  return ['shock'];
}
function drawAgents(ctx, t) {
  for (let i = 0; i < 4; i++) {
    const a = TL.agents[i], A = AG[i];
    if (t < a) continue;
    const p = seg(t, a, a + 0.35);
    const parent = i === 0 ? [812, 1020] : [810, AG[i - 1].headCy];
    const sc = easeOutBack(p);
    const x = lerp(parent[0], A.cx, p);
    let foot = lerp(parent[1], A.foot, p) - Math.sin(p * Math.PI) * 120 * A.s;
    let cx = x;
    if (i === 3 && t > 13.45) cx += Math.sin(t * 90) * 3;
    ctx.save(); ctx.translate(cx, foot); ctx.scale(sc, sc); ctx.translate(-cx, -foot);
    drawAgent(ctx, cx, foot, A.s, agentFace(i, t), t);
    ctx.restore();
    // label
    const zoomOut = 1 - seg(t, 13.2, 13.45) * (1 - seg(t, TL.zoomOut[1] - 0.1, TL.zoomOut[1] + 0.2));
    const la = seg(t, a + 0.25, a + 0.45) * (i === 3 ? 1 : zoomOut); // INTERN stays visible during the zoom
    if (la > 0) {
      ctx.globalAlpha = la;
      const fs = 40;
      const xr = A.cx - 95 * A.s - 30;
      text(ctx, AG_LABELS[i], xr, A.headCy, `900 ${fs}px Inter`, C.ink, 'right', C.bg, 10);
      line(ctx, xr + 8, A.headCy, A.cx - 95 * A.s - 6, A.headCy, 4);
      ctx.globalAlpha = 1;
    }
  }
}
// task sheet climbing up the tower
function sheetSpot(i) {
  if (i < 0) return { x: 640, y: 1060, s: 1 };
  if (i === 0 && false) return null;
  if (i === 99) return { x: 975, y: 1000, s: 0.9 };
  const A = AG[i]; const s = Math.max(0.3, A.s * 1.6);
  return { x: A.cx + 95 * A.s + 40 * s, y: A.headCy, s };
}
function drawSheet(ctx, t) {
  if (t < 10.35) return;
  const steps = [[10.35, 10.7, -1, 99]];
  TL.agents.forEach((a, i) => steps.push([a + 0.35, a + 0.6, i === 0 ? 99 : i - 1, i]));
  let from = sheetSpot(-1), to = sheetSpot(-1), p = 0;
  for (const [t0, t1, f, k] of steps) {
    if (t >= t0) { from = sheetSpot(f); to = sheetSpot(k); p = easeInOutCubic(seg(t, t0, t1)); }
  }
  const x = lerp(from.x, to.x, p), y = lerp(from.y, to.y, p) - Math.sin(p * Math.PI) * 60;
  const s = lerp(from.s, to.s, p);
  const burn = seg(t, TL.ignite2, TL.ignite2 + 0.4);
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * 0.08); ctx.scale(s, s);
  ctx.globalAlpha = 1 - burn;
  rr(ctx, -30, -38, 60, 76, 6); fillStroke(ctx, mixHex(C.paper, '#3B3532', burn * 2), 6);
  for (let j = 0; j < 4; j++) line(ctx, -18, -20 + j * 13, 18 - (j === 3 ? 14 : 0), -20 + j * 13, 4);
  ctx.restore(); ctx.globalAlpha = 1;
}
// task pile + boss's hand
function drawTasksAndHand(ctx, t) {
  if (t < TL.hand[0]) return;
  const X = 640;
  const down = easeOutCubic(seg(t, TL.hand[0], 9.7)), up = easeInQuad(seg(t, 9.8, TL.hand[1]));
  const wristY = lerp(-320, 820, down) - up * 1200;
  let bottom;
  if (t < 9.7) bottom = wristY + 60 + 216;
  else bottom = lerp(820 + 276, 1290, easeInQuad(seg(t, 9.7, TL.taskDrop)));
  const squash = t > TL.taskDrop ? 1 - 0.1 * Math.exp(-(t - TL.taskDrop) * 9) * Math.cos((t - TL.taskDrop) * 30) : 1;
  ctx.save(); ctx.translate(X, bottom); ctx.scale(2 - squash, squash);
  for (let i = 0; i < 12; i++) {
    const y = -(i + 1) * 18, dx = (hash(i * 3.3) - 0.5) * 16;
    rr(ctx, -85 + dx, y, 170, 18, 4); fillStroke(ctx, C.paper, 5);
  }
  ctx.save(); ctx.translate(40, -205); ctx.rotate(0.12);
  rr(ctx, -58, -34, 116, 68, 6); fillStroke(ctx, '#FFD84D', 6);
  text(ctx, 'x1000', 0, 2, '900 38px Inter', C.red);
  ctx.restore();
  text(ctx, TXT.tasks, -20, -80, '900 36px Inter', C.ink, 'center', C.paper, 8);
  ctx.restore();
  // impact dust
  const dp = seg(t, TL.taskDrop, TL.taskDrop + 0.5);
  if (dp > 0 && dp < 1) {
    for (const side of [-1, 1]) for (let j = 0; j < 3; j++) {
      ctx.globalAlpha = (1 - dp) * 0.8;
      circle(ctx, X + side * (95 + dp * 90 + j * 24), 1280 - j * 10 - dp * 20, 14 - j * 3, C.paper, 4);
    }
    ctx.globalAlpha = 1;
  }
  // hand
  if (wristY > -300) {
    rr(ctx, X - 62, wristY - 900, 124, 870, 10); fillStroke(ctx, C.suit);
    rr(ctx, X - 68, wristY - 42, 136, 40, 8); fillStroke(ctx, C.paper);
    rr(ctx, X - 56, wristY - 4, 112, 66, 24); fillStroke(ctx, C.skin);
    for (let f = 0; f < 4; f++) line(ctx, X - 36 + f * 24, wristY + 48, X - 36 + f * 24, wristY + 72, 6);
    // gold cufflink: it's the boss
    circle(ctx, X + 40, wristY - 22, 8, '#FFD23F', 4);
  }
}

// =====================================================================
//  FIRE
// =====================================================================
function drawFire(ctx, t, t0, t1, cx, cy, w, h, sc) {
  const env = seg(t, t0, t0 + 0.4) * (1 - seg(t, t1 - 0.5, t1));
  if (env <= 0) return;
  const big = h * 0.42 * env * (1 + 0.07 * Math.sin(t * 31));
  flame(ctx, cx, cy + h * 0.12, big, '#FF7A2A', 1, true);
  flame(ctx, cx, cy + h * 0.22, big * 0.62, '#FFD24A', 1);
  const life = 0.55, dt = 0.02;
  const i0 = Math.max(0, Math.floor((t - life - t0) / dt)), i1 = Math.floor((t - t0) / dt);
  for (let i = i0; i <= i1; i++) {
    const b = t0 + i * dt, age = t - b;
    if (age < 0 || age > life || b > t1) continue;
    const f = age / life, r1 = hash(i * 1.7 + cx), r2 = hash(i * 3.3 + cy), r3 = hash(i * 5.9 + w);
    const x = cx + (r1 - 0.5) * w + Math.sin(age * 14 + i) * 10 * sc;
    const y = cy + h / 2 - r2 * h * 0.7 - age * 380 * sc;
    const s = (24 + r3 * 34) * sc * env * (1 - f * 0.7);
    flame(ctx, x, y, s, f < 0.3 ? '#FFE36E' : f < 0.6 ? '#FF9A2E' : '#E5452E', (1 - f) * 0.95);
  }
  // sparks
  for (let i = 0; i < 12; i++) {
    const b = t0 + i * 0.13, age = (t - b) % 0.8;
    if (t < b || b > t1) continue;
    ctx.globalAlpha = (1 - age / 0.8) * env;
    ctx.fillStyle = '#FFD24A';
    ctx.beginPath(); ctx.arc(cx + (hash(i * 9.1) - 0.5) * w * 1.3 + Math.sin(age * 9) * 12 * sc, cy - h * 0.4 - age * 420 * sc, 5 * sc + 2, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// =====================================================================
//  SCREEN LAYERS (don't follow the camera)
// =====================================================================
function drawBar(ctx, label, cy, pct, col, status, pulse) {
  const x0 = 210, w0 = 800, h = 78;
  ctx.save(); ctx.translate(0, cy); ctx.scale(1, 1 + pulse);
  text(ctx, label, 72, 2, '900 66px Inter', C.ink, 'left');
  rr(ctx, x0, -h / 2, w0, h, h / 2); fillStroke(ctx, '#FFF6E3');
  const fw = w0 * pct / 100;
  if (fw > 1) {
    ctx.save();
    if (pct <= 100) { rr(ctx, x0, -h / 2, w0, h, h / 2); ctx.clip(); rr(ctx, x0, -h / 2, fw, h, h / 2); }
    else rr(ctx, x0, -h / 2, fw, h, h / 2);
    fillStroke(ctx, col);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x0 + 20, -h / 2 + 12, Math.max(0, fw - 40), 10);
    ctx.restore();
  }
  if (status) text(ctx, status, x0 + w0 / 2, 3, '900 46px Inter', C.red);
  else {
    const s = Math.floor(pct) + '%';
    if (fw > 170) text(ctx, s, Math.min(x0 + fw - 26, W - 70), 3, '900 46px Inter', C.paper, 'right', C.ink, 10);
    else text(ctx, s, x0 + Math.max(fw, 0) + 18, 3, '900 46px Inter', C.ink, 'left');
  }
  ctx.restore();
}
function drawBars(ctx, t) {
  const A = 1 - seg(t, TL.barsOut, TL.barsOut + 0.5);
  if (A <= 0) return;
  ctx.globalAlpha = A;
  text(ctx, TXT.eff, 540, 158, '900 50px Inter', C.ink);
  const pulse = (t0) => (t >= t0 ? 0.3 * Math.exp(-(t - t0) * 10) : 0);
  drawBar(ctx, TXT.me, 262, mePct(t), C.me, t >= TL.burnout1 + 0.3 ? TXT.off : null, 0);
  const aiA = easeOutCubic(seg(t, 2.9, 3.25));
  if (aiA > 0) {
    ctx.globalAlpha = A * aiA;
    drawBar(ctx, TXT.ai, 388, aiPct(t), C.ai, null, pulse(TL.aiSlam) + pulse(TL.ai250) + pulse(TL.ai999));
  }
  ctx.globalAlpha = 1;
}
function drawSlam(ctx, t, t0, str, y) {
  if (t < t0 || t > t0 + 1.3) return;
  const p = seg(t, t0, t0 + 0.22), a = 1 - seg(t, t0 + 1.05, t0 + 1.3);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(540, y);
  // impact rays
  ctx.save(); ctx.rotate(t * 0.4);
  for (let i = 0; i < 20; i++) {
    const ang = i / 20 * Math.PI * 2, r0 = 260 + 40 * Math.sin(i * 3), r1 = 900;
    ctx.fillStyle = i % 2 ? 'rgba(217,68,46,0.20)' : 'rgba(255,210,74,0.22)';
    ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
    ctx.lineTo(Math.cos(ang + 0.13) * r1, Math.sin(ang + 0.13) * r1); ctx.lineTo(Math.cos(ang - 0.13) * r1, Math.sin(ang - 0.13) * r1); ctx.fill();
  }
  ctx.restore();
  ctx.rotate(-0.07);
  const sc = lerp(2.4, 1, easeOutBack(p)); ctx.scale(sc, sc);
  ctx.font = '900 190px Inter';
  const k = Math.min(1, 960 / ctx.measureText(str).width); ctx.scale(k, k);
  text(ctx, str, 10, 14, '900 190px Inter', C.ink, 'center', C.ink, 22);
  text(ctx, str, 0, 0, '900 190px Inter', C.red, 'center', C.ink, 20);
  text(ctx, str, 0, 0, '900 190px Inter', C.red);
  ctx.restore();
}
function drawFlash(ctx, t) {
  let a = 0;
  for (const t0 of [TL.burnout1, TL.burnout2]) if (t >= t0) a += 0.6 * (1 - seg(t, t0, t0 + 0.18)) * (t < t0 + 0.18 ? 1 : 0);
  if (a > 0) { ctx.fillStyle = `rgba(255,250,235,${a})`; ctx.fillRect(0, 0, W, H); }
}
function fitFont(ctx, str, weight, size, maxW) {
  ctx.font = `${weight} ${size}px Inter`;
  const k = Math.min(1, maxW / ctx.measureText(str).width);
  return `${weight} ${Math.floor(size * k)}px Inter`;
}
function drawEndCard(ctx, t) {
  const p = seg(t, TL.endCard, TL.endCard + 0.3);
  if (p <= 0) return;
  const y = lerp(-200, 250, easeOutBack(p));
  ctx.save();
  rr(ctx, 50, y - 115, 980, 230, 30); ctx.fillStyle = 'rgba(32,28,25,0.93)'; ctx.fill();
  text(ctx, TXT.end1, 540, y - 28, fitFont(ctx, TXT.end1, 900, 92, 900), C.paper);
  text(ctx, TXT.end2, 540, y + 62, fitFont(ctx, TXT.end2, 800, 44, 900), C.glow);
  ctx.restore();
}
function drawVignette(ctx) {
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,10,0.24)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// =====================================================================
//  FULL FRAME
// =====================================================================
function draw(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(getPaper(), 0, 0);
  const sh = shake(t), cam = camera(t), S = humanState(t), RX = robotX(t);
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  drawFloor(ctx); drawClock(ctx, t); drawChair(ctx);
  drawHumanBody(ctx, t, S);
  if (RX < 1350) drawRobotBody(ctx, t, RX);
  drawDeskAndLaptops(ctx);
  drawHumanArms(ctx, t, S);
  if (RX < 1350) drawRobotArms(ctx, t, RX);
  drawFire(ctx, t, TL.ignite, 9.1, 272, 1150, 170, 400, 1);
  drawAshPile(ctx, t);
  drawTasksAndHand(ctx, t);
  drawAgents(ctx, t);
  drawSheet(ctx, t);
  const A4 = AG[3];
  drawFire(ctx, t, TL.ignite2, TL.dur + 2, A4.cx, A4.top + 22, 34, 70, 0.22);
  ctx.restore();
  ctx.save(); ctx.translate(sh.x * 0.4, sh.y * 0.4); drawBars(ctx, t); ctx.restore();
  drawSlam(ctx, t, TL.burnout1, TXT.burn, 760);
  drawSlam(ctx, t, TL.burnout2, TXT.burn, 360);
  drawFlash(ctx, t);
  drawEndCard(ctx, t);
  drawVignette(ctx);
}

// =====================================================================
//  SOUND EVENTS (same timeline: sound and picture never drift apart)
// =====================================================================
function audioEvents() {
  const ev = []; const add = (t, type, p = {}) => ev.push({ t, type, ...p });
  let tt = TL.typeStart, i = 0;
  while (tt < TL.shock[0]) { add(tt, 'key', { v: 0.5 }); tt += 0.07 + hash(i++ * 3.1) * 0.08; }
  tt = TL.frantic[0] + 0.05;
  while (tt < TL.frantic[1]) { add(tt, 'key', { v: 0.85 }); tt += 0.035 + hash(i++ * 3.1) * 0.03; }
  tt = TL.aiSlam + 0.1;
  while (tt < TL.burnout1) { add(tt, 'rkey', { v: 0.3 }); tt += 0.032; }
  let lastMe = 0, lastAi = 0, lastTick = -1;
  for (let s = 0; s <= 9.3 * 200; s++) {
    const t = s / 200, m = Math.floor(mePct(t)), a = Math.floor(aiPct(t));
    if ((m !== lastMe || a !== lastAi) && t - lastTick >= 0.05) { add(t, 'tick', { f: a !== lastAi ? 1650 : 1150 }); lastTick = t; }
    lastMe = m; lastAi = a;
  }
  add(TL.robotIn[0], 'whoosh');
  add(TL.aiSlam, 'ding', { f: 1568 }); add(TL.ai250, 'ding', { f: 1760 }); add(TL.ai999, 'ding', { f: 2093 });
  add(TL.shock[0], 'gasp');
  add(TL.ignite, 'fwoosh'); add(TL.ignite, 'crackle', { d: 1.7 });
  add(TL.burnout1, 'boom'); add(TL.ashFrom, 'poof');
  add(TL.hand[0], 'whoosh'); add(TL.taskDrop, 'thud'); add(10.25, 'beep2');
  TL.agents.forEach((a, k) => { add(a, 'pop', { f: 480 * Math.pow(1.38, k) }); add(a + 0.38, 'swish', { v: 0.5 }); });
  add(13.45, 'alarm'); add(TL.ignite2, 'fwoosh', { v: 0.55 }); add(TL.ignite2, 'crackle', { d: 2.3, v: 0.45 });
  add(TL.burnout2, 'boom'); add(TL.endCard, 'sting');
  return { events: ev, dur: TL.dur, music: { bpm: 120, mute: [[TL.burnout1 - 0.05, 9.35], [TL.burnout2 - 0.05, TL.endCard - 0.1]], end: TL.endCard - 0.1 } };
}
