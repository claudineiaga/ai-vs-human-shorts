// =====================================================================
//  I'M NOT A ROBOT — animated short made 100% with code (episode 2)
//  Vertical 1080x1920, 30 fps. draw(ctx, t) paints the frame at instant t.
//  Language: set window.LANG = 'pt' before loading (default: English).
// =====================================================================

const W = 1080, H = 1920, FPS = 30;

const LANG = (typeof window !== 'undefined' && window.LANG) || 'en';
const TXT = {
  en: { notRobot: "I'm not a robot", detected: 'ROBOT DETECTED', tooFast: 'TOO FAST', verified: 'VERIFIED HUMAN',
        select: 'Select all squares with', lights: 'TRAFFIC LIGHTS', bikes: 'BICYCLES', verify: 'VERIFY',
        question: 'Are you even human?', end1: 'HUMAN VERIFICATION IN 2026', end2: 'MUSTACHE REQUIRED' },
  pt: { notRobot: 'Não sou um robô', detected: 'ROBÔ DETECTADO', tooFast: 'RÁPIDO DEMAIS', verified: 'HUMANO VERIFICADO',
        select: 'Selecione todos os quadrados com', lights: 'SEMÁFOROS', bikes: 'BICICLETAS', verify: 'VERIFICAR',
        question: 'Você é mesmo humano?', end1: 'VERIFICAÇÃO HUMANA EM 2026', end2: 'BIGODE OBRIGATÓRIO' },
}[LANG];

// ---------- TIMELINE (seconds) ----------
const TL = {
  dur: 19.5,
  click1: 0.5, spin1: [0.55, 1.25], err1: 1.25,          // robot clicks: ROBOT DETECTED
  grid1: 2.0, verify1: 2.95, err2: 3.15,                 // selects everything fast: TOO FAST
  think: [4.1, 4.6],                                     // light bulb
  mustache: 4.6, glasses: 4.9, hat: 5.2,                 // disguise
  click2: 5.7, spin2: [5.75, 6.9], ok1: 6.9,             // VERIFIED HUMAN
  ashIn: [7.9, 8.35],                                    // the ash pile enters
  click3: 8.9, spin3: [8.95, 9.6], err3: 9.6,            // ash pile: ROBOT DETECTED
  grid2: 10.3, swaps: [11.5, 12.3, 12.95],               // grid keeps getting smaller
  errs: [11.2, 12.05, 12.7], bigErr: 13.25,
  question: 13.75, lookDown: [14.2, 14.95],              // "Are you even human?"
  give: [14.9, 15.5], fly: [15.05, 15.55],               // robot lends its mustache
  check4: 15.6, click4: 15.9, spin4: [15.95, 16.6], ok2: 16.6,
  endCard: 17.4,
};

const C = {
  ink: '#2B2622', white: '#FFFFFF', paper: '#FFFDF6', bg: '#E8DBC0',
  metal: '#C6CFD5', metalDark: '#B4BEC5', screen: '#1C2622', glow: '#62F5A0',
  red: '#D9442E', green: '#22A35A', blue: '#4A8AF4', ash: '#57514C', yellow: '#FFD84D',
  stache: '#3A2A20',
};

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const bump = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOutBack = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const mix2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const inWin = (t, a, b) => t >= a && t < b;

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillStroke(ctx, fill, lw = 7) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
}
function circle(ctx, x, y, r, fill, lw = 7) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); fillStroke(ctx, fill, lw); }
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
function fitFont(ctx, str, weight, size, maxW) {
  ctx.font = `${weight} ${size}px Inter`;
  const k = Math.min(1, maxW / ctx.measureText(str).width);
  return `${weight} ${Math.floor(size * k)}px Inter`;
}
function checkMark(ctx, x, y, s, col, lw) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.42); ctx.stroke();
}
function xMark(ctx, x, y, s, col, lw) {
  line(ctx, x - s / 2, y - s / 2, x + s / 2, y + s / 2, lw, col);
  line(ctx, x + s / 2, y - s / 2, x - s / 2, y + s / 2, lw, col);
}

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
  paperCanvas = c; return c;
}

// =====================================================================
//  CAPTCHA CARD
// =====================================================================
const RECT = {
  check: { x: 90, y: 560, w: 900, h: 230 },
  question: { x: 90, y: 560, w: 900, h: 230 },
  grid: { x: 90, y: 120, w: 900, h: 920 },
};
const PH = [
  { t0: 0, mode: 'check' },
  { t0: TL.grid1, mode: 'grid', word: 'lights' },
  { t0: 3.9, mode: 'check' },
  { t0: TL.grid2, mode: 'grid', word: 'bikes' },
  { t0: TL.question, mode: 'question' },
  { t0: TL.check4, mode: 'check' },
];
const BOX = [205, 675];          // checkbox center
const G = 600, GX = 240, GY = 320; // grid (when the card is open)
const VERIFY = [835, 982];
const tileC = (n, i) => [GX + ((i % n) + 0.5) * G / n, GY + (Math.floor(i / n) + 0.5) * G / n];

// tile selections: [window, n, indices, start, step]
const SEL_SPEC = [
  ['a', 3, [0, 1, 2, 3, 4, 5, 6, 7, 8], 2.5, 0.035],
  ['b', 3, [1, 4, 8], 10.65, 0.15],
  ['c', 6, [7, 14, 21, 28], 11.62, 0.08],
  ['d', 12, [13, 40, 77, 101, 118, 130], 12.38, 0.03],
  ['e', 30, [465], 13.05, 0],
];
const SELS = [];
SEL_SPEC.forEach(([w, n, idx, t0, dt]) => idx.forEach((i, k) => SELS.push({ w, n, i, t: t0 + k * dt })));
function gridWin(t) { return t < TL.grid2 ? 'a' : t < 11.5 ? 'b' : t < 12.3 ? 'c' : t < 12.95 ? 'd' : 'e'; }
const WIN_N = { a: 3, b: 3, c: 6, d: 12, e: 30 };

function checkState(t) {
  if (t < TL.spin1[0]) return 'empty';
  if (t < TL.spin1[1]) return 'spin';
  if (t < TL.grid1) return 'x';
  if (t < TL.spin2[0]) return 'empty';
  if (t < TL.spin2[1]) return 'spin';
  if (t < TL.ashIn[1] - 0.05) return 'check';
  if (t < TL.spin3[0]) return 'empty';
  if (t < TL.spin3[1]) return 'spin';
  if (t < TL.grid2) return 'x';
  if (t < TL.spin4[0]) return 'empty';
  if (t < TL.spin4[1]) return 'spin';
  return 'check';
}

function drawCheckContent(ctx, r, t) {
  const cy = r.y + r.h / 2;
  rr(ctx, r.x + 70, cy - 45, 90, 90, 14); fillStroke(ctx, '#FFFFFF', 6);
  const st = checkState(t), bx = r.x + 115;
  if (st === 'spin') {
    ctx.strokeStyle = C.blue; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(bx, cy, 28, t * 11, t * 11 + Math.PI * 1.4); ctx.stroke();
  } else if (st === 'x') xMark(ctx, bx, cy, 44, C.red, 12);
  else if (st === 'check') checkMark(ctx, bx, cy, 60, C.green, 13);
  text(ctx, TXT.notRobot, r.x + 200, cy + 2, fitFont(ctx, TXT.notRobot, 700, 58, r.w - 380), C.ink, 'left');
  // generic shield
  const sx = r.x + r.w - 95, sy = cy;
  ctx.beginPath(); ctx.moveTo(sx, sy - 52); ctx.lineTo(sx + 42, sy - 36); ctx.quadraticCurveTo(sx + 40, sy + 30, sx, sy + 54);
  ctx.quadraticCurveTo(sx - 40, sy + 30, sx - 42, sy - 36); ctx.closePath(); fillStroke(ctx, '#DCE6F7', 6);
  checkMark(ctx, sx, sy, 34, C.blue, 8);
}
function drawQuestionContent(ctx, r) {
  text(ctx, TXT.question, r.x + r.w / 2, r.y + r.h / 2, fitFont(ctx, TXT.question, 900, 66, r.w - 100), C.ink);
}
function drawBike(ctx, cx, cy, s) {
  const lw = Math.max(2, s * 0.07);
  for (const dx of [-0.55, 0.55]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy, s * 0.38, 0, 7); ctx.strokeStyle = C.ink; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.strokeStyle = C.red; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 0.55 * s, cy); ctx.lineTo(cx - 0.05 * s, cy); ctx.lineTo(cx - 0.22 * s, cy - 0.58 * s);
  ctx.lineTo(cx + 0.36 * s, cy - 0.58 * s); ctx.lineTo(cx - 0.05 * s, cy);
  ctx.moveTo(cx + 0.55 * s, cy); ctx.lineTo(cx + 0.36 * s, cy - 0.58 * s); ctx.lineTo(cx + 0.33 * s, cy - 0.78 * s);
  ctx.moveTo(cx - 0.55 * s, cy); ctx.lineTo(cx - 0.22 * s, cy - 0.58 * s);
  ctx.stroke();
  line(ctx, cx + 0.22 * s, cy - 0.8 * s, cx + 0.46 * s, cy - 0.78 * s, lw, C.ink);
  line(ctx, cx - 0.34 * s, cy - 0.66 * s, cx - 0.1 * s, cy - 0.66 * s, lw * 1.4, C.ink);
}
function drawStreet(ctx, x, y, S, word) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + S * 0.62);
  g.addColorStop(0, '#BFE0F5'); g.addColorStop(1, '#EEF7FC'); ctx.fillStyle = g; ctx.fillRect(x, y, S, S);
  for (let i = 0; i < 8; i++) {
    const bw = S * (0.12 + hash(i * 3.1) * 0.08), bh = S * (0.22 + hash(i * 5.3) * 0.3), bx = x + i * S * 0.135 - 8;
    ctx.fillStyle = ['#C9CED6', '#B7BEC9', '#D5D9E0'][i % 3]; ctx.fillRect(bx, y + S * 0.62 - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let wy = y + S * 0.62 - bh + S * 0.03; wy < y + S * 0.58; wy += S * 0.06)
      for (let wx = bx + S * 0.02; wx < bx + bw - S * 0.03; wx += S * 0.045) ctx.fillRect(wx, wy, S * 0.022, S * 0.03);
  }
  ctx.fillStyle = '#D8CBB0'; ctx.fillRect(x, y + S * 0.62, S, S * 0.08);
  ctx.fillStyle = '#8E9399'; ctx.fillRect(x, y + S * 0.7, S, S * 0.3);
  ctx.fillStyle = '#FFFFFF';
  for (let dx = 0; dx < S; dx += S * 0.16) ctx.fillRect(x + dx, y + S * 0.845, S * 0.08, S * 0.015);
  if (word === 'lights') {
    const tl = (px, top, k) => {
      ctx.fillStyle = '#3A3F45'; ctx.fillRect(px - S * 0.017 * k, top + S * 0.2 * k, S * 0.034 * k, y + S * 0.7 - top - S * 0.2 * k);
      rr(ctx, px - S * 0.06 * k, top, S * 0.12 * k, S * 0.28 * k, 10 * k); fillStroke(ctx, '#3A3F45', 4 * k);
      ['#FF4D3D', '#7A6A2A', '#2E5A3A'].forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, top + S * (0.05 + j * 0.09) * k, S * 0.032 * k, 0, 7); ctx.fill(); });
    };
    tl(x + S * 0.66, y + S * 0.06, 1);
    tl(x + S * 0.17, y + S * 0.36, 0.5);
  } else {
    ctx.fillStyle = '#7A5A3A'; ctx.fillRect(x + S * 0.13, y + S * 0.38, S * 0.04, S * 0.3);
    ctx.fillStyle = '#7DBB5A'; ctx.beginPath(); ctx.arc(x + S * 0.15, y + S * 0.33, S * 0.12, 0, 7); ctx.fill();
    drawBike(ctx, x + S * 0.4, y + S * 0.86, S * 0.2);
    drawBike(ctx, x + S * 0.8, y + S * 0.9, S * 0.13);
  }
  ctx.restore();
}
function drawGridContent(ctx, r, t, word) {
  const err = TL.errs.concat([TL.bigErr]).some(e => inWin(t, e, e + 0.3));
  rr(ctx, r.x + 24, r.y + 24, r.w - 48, 156, 14); fillStroke(ctx, err ? C.red : C.blue, 5);
  text(ctx, TXT.select, r.x + 60, r.y + 70, fitFont(ctx, TXT.select, 600, 38, r.w - 120), '#FFFFFF', 'left');
  const wTxt = word === 'lights' ? TXT.lights : TXT.bikes;
  text(ctx, wTxt, r.x + 60, r.y + 130, fitFont(ctx, wTxt, 900, 76, r.w - 120), '#FFFFFF', 'left');
  const gx = r.x + (r.w - G) / 2, gy = r.y + 200;
  drawStreet(ctx, gx, gy, G, word);
  const win = gridWin(t), n = WIN_N[win], ts = G / n;
  for (const s of SELS) {
    if (s.w !== win || s.t > t) continue;
    const cx = gx + (s.i % n) * ts, cy = gy + Math.floor(s.i / n) * ts;
    ctx.fillStyle = 'rgba(74,138,244,0.42)'; ctx.fillRect(cx, cy, ts, ts);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(2, 10 / Math.sqrt(n)); ctx.strokeRect(cx + 4, cy + 4, ts - 8, ts - 8);
    if (n <= 6) { const rad = ts * 0.13; ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(cx + rad + 10, cy + rad + 10, rad, 0, 7); ctx.fill(); checkMark(ctx, cx + rad + 10, cy + rad + 10, rad * 1.1, '#FFFFFF', rad * 0.3); }
  }
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = n <= 6 ? 8 : n <= 12 ? 4 : 2;
  for (let k = 1; k < n; k++) {
    ctx.beginPath(); ctx.moveTo(gx + k * ts, gy); ctx.lineTo(gx + k * ts, gy + G); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy + k * ts); ctx.lineTo(gx + G, gy + k * ts); ctx.stroke();
  }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.strokeRect(gx, gy, G, G);
  for (const s of TL.swaps) { const a = 1 - seg(t, s, s + 0.14); if (t >= s && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(gx, gy, G, G); } }
  for (const e of TL.errs) if (inWin(t, e, e + 0.3)) { ctx.globalAlpha *= 0.85; xMark(ctx, gx + G / 2, gy + G / 2, G * 0.5, C.red, 40); ctx.globalAlpha /= 0.85; }
  // footer
  ctx.strokeStyle = '#9AA0A6'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(r.x + 80, gy + G + 62, 22, 0.3, Math.PI * 1.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(r.x + 150, gy + G + 66, 18, Math.PI, 0); ctx.stroke();
  const press = [TL.verify1, 11.1, 11.95, 12.6, 13.15].reduce((m, v) => Math.max(m, bump(t, v - 0.05, v, v + 0.05, v + 0.15)), 0);
  ctx.save(); ctx.translate(r.x + r.w - 155, gy + G + 62); ctx.scale(1 - 0.1 * press, 1 - 0.1 * press);
  rr(ctx, -115, -40, 230, 80, 14); fillStroke(ctx, C.blue, 5);
  text(ctx, TXT.verify, 0, 2, fitFont(ctx, TXT.verify, 900, 36, 200), '#FFFFFF');
  ctx.restore();
}
function drawCard(ctx, t) {
  let i = 0; for (let k = 0; k < PH.length; k++) if (t >= PH[k].t0) i = k;
  const cur = PH[i], prev = PH[Math.max(0, i - 1)];
  const p = i > 0 ? easeInOutCubic(seg(t, cur.t0, cur.t0 + 0.25)) : 1;
  const A = RECT[prev.mode], B = RECT[cur.mode];
  const r = { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), w: lerp(A.w, B.w, p), h: lerp(A.h, B.h, p) };
  ctx.save(); ctx.globalAlpha = 0.18; rr(ctx, r.x + 12, r.y + 14, r.w, r.h, 26); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
  rr(ctx, r.x, r.y, r.w, r.h, 26); fillStroke(ctx, '#FFFFFF', 7);
  const a = i > 0 ? seg(t, cur.t0 + 0.12, cur.t0 + 0.3) : 1;
  if (a <= 0) return;
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 26); ctx.clip(); ctx.globalAlpha = a;
  if (cur.mode === 'check') drawCheckContent(ctx, r, t);
  else if (cur.mode === 'question') drawQuestionContent(ctx, r);
  else drawGridContent(ctx, r, t, cur.word);
  ctx.restore();
}

// =====================================================================
//  ROBOT (standing) + DISGUISE
// =====================================================================
const RX = 800, FOOT = 1620, RS = 1.35;
const R_TOP = FOOT - 360 * RS, R_FACE = [RX, R_TOP + 71 * RS], RK = RS * 0.95;

function drawFace(ctx, cx, cy, s, face) {
  const [kind, fx = 0, fy = 0] = face;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.strokeStyle = C.glow; ctx.fillStyle = C.glow; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = C.glow; ctx.shadowBlur = 14 * s; ctx.lineWidth = 7;
  const E = [[-30, -12], [30, -12]];
  const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const sg = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  if (kind === 'smile') { E.forEach(([x, y]) => dot(x, y, 9)); ctx.beginPath(); ctx.arc(0, 10, 24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  if (kind === 'happy') {
    E.forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 13, y + 6); ctx.lineTo(x, y - 8); ctx.lineTo(x + 13, y + 6); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(0, 12, 26, 0.05 * Math.PI, 0.95 * Math.PI); ctx.closePath(); ctx.fill();
  }
  if (kind === 'look') { E.forEach(([x, y]) => dot(x + fx, y + fy, 9)); sg(-14 + fx * 0.5, 26, 14 + fx * 0.5, 26); }
  if (kind === 'shock') { E.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.stroke(); dot(x, y, 4); }); ctx.beginPath(); ctx.arc(0, 28, 9, 0, 7); ctx.stroke(); }
  if (kind === 'smug') {
    E.forEach(([x, y]) => { sg(x - 14, y - 4, x + 14, y - 4); ctx.beginPath(); ctx.arc(x, y - 4, 9, 0, Math.PI); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(-16, 26); ctx.quadraticCurveTo(4, 32, 20, 16); ctx.stroke();
  }
  ctx.restore();
}
function robotFace(t) {
  if (t < 0.5) return ['smile'];
  if (t < TL.err1) return ['look', 0, -14];
  if (t < TL.grid1) return ['shock'];
  if (t < TL.err2) return ['happy'];
  if (t < 3.9) return ['shock'];
  if (t < TL.mustache) return ['look', -14, -14];
  if (t < 5.6) return ['smile'];
  if (t < TL.ok1) return ['look', 0, -14];
  if (t < 8.0) return ['happy'];
  if (t < TL.err3) return ['look', -16, 6];
  if (t < TL.question) return ['smug'];
  if (t < TL.give[0]) return ['look', -16, 8];
  if (t < TL.check4) return ['smile'];
  if (t < TL.ok2) return ['look', 0, -14];
  return ['happy'];
}
function drawMustache(ctx, x, y, w) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  // pass 0: light outline (sticker look); pass 1: the mustache
  for (const pass of [0, 1]) {
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sd * w * 0.22, 0, w * 0.25, w * 0.12, sd * 0.28, 0, 7);
      if (pass === 0) { ctx.strokeStyle = C.paper; ctx.lineWidth = w * 0.1; ctx.stroke(); }
      else { ctx.fillStyle = C.stache; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(sd * w * 0.38, w * 0.02);
      ctx.quadraticCurveTo(sd * w * 0.58, -w * 0.01, sd * w * 0.52, -w * 0.15);
      ctx.strokeStyle = pass === 0 ? C.paper : C.stache; ctx.lineWidth = pass === 0 ? w * 0.19 : w * 0.09; ctx.stroke();
    }
  }
  ctx.restore();
}
function drawGlasses(ctx, cx, cy, k) {
  for (const [col, lw] of [[C.paper, 14], [C.ink, 7]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sd * 30 * k, cy - 12 * k, 25 * k, 0, 7); ctx.stroke(); }
    line(ctx, cx - 6 * k, cy - 14 * k, cx + 6 * k, cy - 14 * k, lw, col);
    line(ctx, cx - 55 * k, cy - 18 * k, cx - 72 * k, cy - 22 * k, lw, col);
    line(ctx, cx + 55 * k, cy - 18 * k, cx + 72 * k, cy - 22 * k, lw, col);
  }
}
function drawHat(ctx, cx, y) {
  ctx.beginPath(); ctx.ellipse(cx, y, 150, 22, 0, 0, 7); fillStroke(ctx, '#2B2622', 6);
  ctx.beginPath(); ctx.ellipse(cx, y - 4, 92, 88, 0, Math.PI, 0); ctx.closePath(); fillStroke(ctx, '#2B2622', 6);
  ctx.fillStyle = '#7A5A3A'; ctx.fillRect(cx - 90, y - 26, 180, 16);
}
// item that flies into place and "pops" on arrival
function itemPose(t, tArr, tx, ty) {
  if (t < tArr - 0.3) return null;
  const p = easeInOutCubic(seg(t, tArr - 0.3, tArr));
  const x = lerp(tx + 420, tx, p), y = lerp(ty - 560, ty, p) - Math.sin(p * Math.PI) * 120;
  const pop = t >= tArr ? 1 + 0.3 * Math.exp(-(t - tArr) * 9) * Math.cos((t - tArr) * 30) : 1;
  return { x, y, s: pop };
}
function robotArms(t) {
  const S = RS, cx = RX, f = FOOT;
  const shL = [cx - 58 * S, f - 190 * S], shR = [cx + 58 * S, f - 190 * S];
  const raise = Math.max(bump(t, 0.25, 0.45, 0.6, 0.8), bump(t, 2.25, 2.45, 3.0, 3.2), bump(t, 5.45, 5.62, 5.8, 6.0));
  const cel = Math.max(bump(t, TL.ok1, TL.ok1 + 0.15, 7.7, 7.9), bump(t, TL.ok2, TL.ok2 + 0.15, 30, 31));
  const reach = bump(t, TL.give[0], TL.give[0] + 0.15, TL.give[1] - 0.2, TL.give[1]);
  let eL = [cx - 80 * S, f - 155 * S], hL = [cx - 92 * S, f - 118 * S];
  let eR = [cx + 80 * S, f - 155 * S], hR = [cx + 92 * S, f - 118 * S];
  eL = mix2(eL, [cx - 112 * S, f - 250 * S], raise); hL = mix2(hL, [cx - 150 * S, f - 330 * S], raise);
  if (inWin(t, 2.45, 2.95)) { hL[0] += Math.sin(t * 90) * 14; hL[1] += Math.cos(t * 70) * 10; }
  eL = mix2(eL, [cx - 112 * S, f - 245 * S], cel); hL = mix2(hL, [cx - 128 * S, f - 335 * S], cel);
  eR = mix2(eR, [cx + 112 * S, f - 245 * S], cel); hR = mix2(hR, [cx + 128 * S, f - 335 * S], cel);
  const wave = cel * Math.sin(t * 14) * 12; hL[0] += wave; hR[0] -= wave;
  eL = mix2(eL, [cx - 135 * S, f - 185 * S], reach); hL = mix2(hL, [cx - 215 * S, f - 205 * S], reach);
  return { shL, shR, eL, hL, eR, hR };
}
function drawRobot(ctx, t) {
  const S = RS, cx = RX, f = FOOT;
  const bob = Math.sin(t * 4) * 3;
  limb(ctx, [[cx - 26 * S, f - 75 * S], [cx - 26 * S, f - 4]], 24 * S, C.metal);
  limb(ctx, [[cx + 26 * S, f - 75 * S], [cx + 26 * S, f - 4]], 24 * S, C.metal);
  ctx.save(); ctx.translate(0, bob);
  const A = robotArms(t);
  limb(ctx, [A.shR, A.eR, A.hR], 20 * S, C.metalDark);
  rr(ctx, A.hR[0] - 17, A.hR[1] - 14, 34, 28, 8); fillStroke(ctx, C.metalDark, 6);
  rr(ctx, cx - 62 * S, f - 216 * S, 124 * S, 146 * S, 18 * S); fillStroke(ctx, C.metal);
  rr(ctx, cx - 32, f - 180 * S, 64, 46, 9); fillStroke(ctx, C.screen, 5);
  ['#FF5A4F', '#FFD23F', C.glow].forEach((c, i) => {
    ctx.fillStyle = Math.floor(t * 6 + i * 2) % 3 ? c : '#3A4440';
    ctx.beginPath(); ctx.arc(cx - 18 + i * 18, f - 180 * S + 23, 6, 0, 7); ctx.fill();
  });
  line(ctx, cx + 40 * S, R_TOP + 2, cx + 52 * S, R_TOP - 44 * S, 7);
  circle(ctx, cx + 52 * S, R_TOP - 48 * S, 11, Math.floor(t * 2) % 2 ? '#FF5A4F' : C.glow, 5);
  rr(ctx, cx - 95 * S, R_TOP, 190 * S, 150 * S, 22 * S); fillStroke(ctx, C.metalDark);
  rr(ctx, cx - 80 * S, R_TOP + 15 * S, 160 * S, 112 * S, 14 * S); fillStroke(ctx, C.screen, 5);
  drawFace(ctx, R_FACE[0], R_FACE[1], RK, robotFace(t));
  // disguise
  const g = itemPose(t, TL.glasses, R_FACE[0], R_FACE[1]);
  if (g) { ctx.save(); ctx.translate(g.x, g.y); ctx.scale(g.s, g.s); drawGlasses(ctx, 0, 0, RK); ctx.restore(); }
  if (t < TL.fly[0]) {
    const m = itemPose(t, TL.mustache, R_FACE[0], R_FACE[1] + 20 * RK);
    if (m) { ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.s, m.s); drawMustache(ctx, 0, 0, 95 * RK); ctx.restore(); }
  }
  const h = itemPose(t, TL.hat, cx, R_TOP + 4);
  if (h) { ctx.save(); ctx.translate(h.x, h.y); ctx.scale(h.s, h.s); drawHat(ctx, 0, 0); ctx.restore(); }
  // left arm drawn over the body
  limb(ctx, [A.shL, A.eL, A.hL], 20 * S, C.metal);
  rr(ctx, A.hL[0] - 17, A.hL[1] - 14, 34, 28, 8); fillStroke(ctx, C.metal, 6);
  ctx.restore();
  // idea light bulb
  const lb = bump(t, TL.think[0], TL.think[0] + 0.12, TL.think[1] - 0.1, TL.think[1]);
  if (lb > 0) {
    const lx = cx - 30, ly = R_TOP - 150, sc = easeOutBack(lb);
    ctx.save(); ctx.translate(lx, ly); ctx.scale(sc, sc);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line(ctx, Math.cos(a) * 58, Math.sin(a) * 58, Math.cos(a) * 80, Math.sin(a) * 80, 7, '#E8A21A'); }
    circle(ctx, 0, -6, 40, C.yellow, 6);
    rr(ctx, -20, 30, 40, 26, 6); fillStroke(ctx, '#B4BEC5', 5);
    ctx.restore();
  }
}

// =====================================================================
//  ASH PILE (the human from episode 1)
// =====================================================================
const ASC = 2.0;
function ashState(t) {
  if (t < TL.ashIn[0]) return null;
  const p = easeOutCubic(seg(t, TL.ashIn[0], TL.ashIn[1]));
  const st = { x: lerp(-260, 300, p), hop: Math.abs(Math.sin(p * Math.PI * 3)) * 45 * (1 - p), eyes: 'normal', look: [4, 0], stache: t >= TL.fly[1] };
  if (t >= TL.ashIn[1]) st.look = [2, -5];
  if (inWin(t, TL.err3, TL.grid2)) st.eyes = 'shock';
  for (const e of TL.errs.concat([TL.bigErr])) if (inWin(t, e, e + 0.35)) st.eyes = 'shock';
  if (inWin(t, TL.question, TL.lookDown[0])) st.look = [0, -6];
  if (inWin(t, TL.lookDown[0], TL.lookDown[1])) { st.look = [0, 6]; st.eyes = 'sad'; }
  if (inWin(t, TL.lookDown[1], TL.check4)) st.look = [6, -2];
  if (inWin(t, TL.check4, TL.ok2)) st.look = [2, -5];
  if (t >= TL.ok2) { st.eyes = 'happy'; st.hop = Math.abs(Math.sin((t - TL.ok2) * 9)) * 40 * Math.exp(-(t - TL.ok2) * 1.1); }
  return st;
}
function ashFaceScreen(st, t) { // mustache position on screen
  const br = 1 + 0.02 * Math.sin(t * 3);
  return [st.x, FOOT - st.hop - 24 * ASC * br];
}
function drawAsh(ctx, t, st) {
  const br = 1 + 0.02 * Math.sin(t * 3);
  ctx.save(); ctx.translate(st.x, FOOT - st.hop); ctx.scale(ASC, ASC * br);
  ctx.beginPath(); ctx.moveTo(-85, 0);
  ctx.quadraticCurveTo(-80, -40, -45, -48); ctx.quadraticCurveTo(-30, -82, 0, -78);
  ctx.quadraticCurveTo(30, -84, 42, -52); ctx.quadraticCurveTo(82, -42, 85, 0); ctx.closePath();
  fillStroke(ctx, C.ash, 3.5);
  const blink = st.eyes === 'normal' && (t % 2.6) < 0.12;
  for (const ex of [-18, 16]) {
    if (st.eyes === 'happy') { ctx.strokeStyle = C.paper; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, -38, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); continue; }
    if (blink) { line(ctx, ex - 9, -42, ex + 9, -42, 3.5, C.paper); continue; }
    const r = st.eyes === 'shock' ? 15 : 11, pr = st.eyes === 'shock' ? 3.5 : 5;
    ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(ex, -42, r, 0, 7); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ex + st.look[0], -42 + st.look[1], pr, 0, 7); ctx.fill();
    if (st.eyes === 'sad') {
      const inner = ex < 0 ? 1 : -1;
      line(ctx, ex - 11 * inner, -55, ex + 9 * inner, -61, 3, C.paper);
    }
  }
  ctx.restore();
  if (st.stache) {
    const [mx, my] = ashFaceScreen(st, t);
    const pop = 1 + 0.35 * Math.exp(-(t - TL.fly[1]) * 9) * Math.cos((t - TL.fly[1]) * 30);
    ctx.save(); ctx.translate(mx, my); ctx.scale(pop, pop); drawMustache(ctx, 0, 0, 100); ctx.restore();
  }
  // constant little smoke
  for (let i = 0; i < 6; i++) {
    const age = ((t * 0.6 + i / 6) % 1);
    ctx.globalAlpha = (1 - age) * 0.35;
    ctx.fillStyle = '#8B857F'; ctx.beginPath();
    ctx.arc(st.x + (hash(i * 3.3) - 0.5) * 60 + Math.sin(age * 6 + i) * 10, FOOT - st.hop - 160 * br - age * 140, 8 + age * 18, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // question marks
  if (inWin(t, TL.lookDown[0], TL.lookDown[1] + 0.2)) {
    for (let i = 0; i < 3; i++) {
      const a = seg(t, TL.lookDown[0] + i * 0.15, TL.lookDown[0] + i * 0.15 + 0.2);
      if (a <= 0) continue;
      const fade = 1 - seg(t, TL.lookDown[1], TL.lookDown[1] + 0.2);
      ctx.globalAlpha = fade;
      text(ctx, '?', st.x - 70 + i * 70, FOOT - 230 - i * 22 - (t - TL.lookDown[0]) * 30, `900 ${Math.round(70 * easeOutBack(a))}px Inter`, C.ink, 'center', C.bg, 10);
      ctx.globalAlpha = 1;
    }
  }
}
// mustache flying from the robot to the ash pile
function drawFlyingMustache(ctx, t, st) {
  if (!st || t < TL.fly[0] || t >= TL.fly[1]) return;
  const p = easeInOutCubic(seg(t, TL.fly[0], TL.fly[1]));
  const [ax, ay] = ashFaceScreen(st, t);
  const x = lerp(R_FACE[0], ax, p), y = lerp(R_FACE[1] + 20 * RK, ay, p) - Math.sin(p * Math.PI) * 260;
  ctx.save(); ctx.translate(x, y); ctx.rotate(p * Math.PI * 2); drawMustache(ctx, 0, 0, lerp(95 * RK, 100, p)); ctx.restore();
}

// =====================================================================
//  CURSOR
// =====================================================================
const KEYS = [], CLICKS = [];
const key = (t, x, y) => KEYS.push({ t, x, y });
const clk = (t, [x, y], kind = 'click') => { key(t, x, y); CLICKS.push({ t, x, y, kind }); };
(function buildCursor() {
  key(0, 640, 860); clk(TL.click1, BOX); key(1.4, ...BOX); key(2.3, 520, 700);
  SELS.filter(s => s.w === 'a').forEach(s => clk(s.t, tileC(3, s.i), 'tile'));
  clk(TL.verify1, VERIFY); key(3.95, ...VERIFY); key(5.3, 480, 760); clk(TL.click2, BOX); key(7.0, ...BOX);
  key(TL.ashIn[1], 330, 1440); clk(TL.click3, BOX); key(TL.grid2, ...BOX); key(10.5, 540, 700);
  for (const [w, n, , , ] of SEL_SPEC.slice(1)) {
    SELS.filter(s => s.w === w).forEach(s => clk(s.t, tileC(n, s.i), 'tile'));
    clk({ b: 11.1, c: 11.95, d: 12.6, e: 13.15 }[w], VERIFY);
  }
  key(13.6, ...VERIFY); key(TL.check4, 330, 1440); clk(TL.click4, BOX); key(TL.dur, ...BOX);
})();
const CURSOR_ON = [[0, 7.0], [TL.ashIn[1], TL.question], [TL.check4, TL.endCard]];
function cursorPos(t) {
  let k = 0; while (k < KEYS.length - 1 && KEYS[k + 1].t <= t) k++;
  const a = KEYS[k], b = KEYS[Math.min(k + 1, KEYS.length - 1)];
  if (b.t <= a.t) return [a.x, a.y];
  const p = easeInOutCubic(seg(t, a.t, b.t));
  return [lerp(a.x, b.x, p), lerp(a.y, b.y, p)];
}
function drawCursor(ctx, t) {
  if (!CURSOR_ON.some(([a, b]) => inWin(t, a, b))) return;
  const [x, y] = cursorPos(t);
  let press = 0;
  for (const c of CLICKS) {
    press = Math.max(press, bump(t, c.t - 0.04, c.t, c.t + 0.02, c.t + 0.1));
    const age = t - c.t;
    if (age >= 0 && age < 0.35 && c.kind === 'click') {
      ctx.strokeStyle = `rgba(74,138,244,${1 - age / 0.35})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(c.x, c.y, 20 + age * 220, 0, 7); ctx.stroke();
    }
  }
  const s = 1.25 * (1 - 0.18 * press);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 62); ctx.lineTo(16, 48); ctx.lineTo(27, 72);
  ctx.lineTo(38, 67); ctx.lineTo(27, 44); ctx.lineTo(46, 44); ctx.closePath();
  fillStroke(ctx, '#FFFFFF', 5);
  ctx.restore();
}

// =====================================================================
//  STAMPS, CONFETTI, END CARD
// =====================================================================
const STAMPS = [
  [TL.err1, 0.75, TXT.detected, C.red, 'x', 675],
  [TL.err2, 0.75, TXT.tooFast, C.red, 'x', 620],
  [TL.ok1, 1.0, TXT.verified, C.green, 'ok', 675],
  [TL.err3, 0.7, TXT.detected, C.red, 'x', 675],
  [TL.bigErr, 0.7, TXT.detected, C.red, 'x', 620],
  [TL.ok2, 0.85, TXT.verified, C.green, 'ok', 675],
];
function drawStamp(ctx, t, [t0, dur, str, col, icon, cy]) {
  if (t < t0 || t > t0 + dur) return;
  const p = seg(t, t0, t0 + 0.16), a = 1 - seg(t, t0 + dur - 0.18, t0 + dur);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(540, cy); ctx.rotate(-0.09);
  ctx.font = '900 92px Inter';
  const tw = ctx.measureText(str).width, w = tw + 200, h = 160;
  const s = lerp(2.3, 1, easeOutBack(p)) * Math.min(1, 980 / w);
  ctx.scale(s, s);
  rr(ctx, -w / 2, -h / 2, w, h, 20); ctx.fillStyle = 'rgba(255,253,246,0.9)'; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.stroke();
  rr(ctx, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 12); ctx.lineWidth = 4; ctx.stroke();
  const ix = -w / 2 + 85;
  if (icon === 'x') xMark(ctx, ix, 0, 56, col, 16); else checkMark(ctx, ix, 0, 76, col, 16);
  text(ctx, str, ix + 55, 4, '900 92px Inter', col, 'left');
  ctx.restore();
}
function drawConfetti(ctx, t, t0) {
  const a = t - t0; if (a < 0 || a > 1.9) return;
  const pal = ['#FF5A4F', '#FFD23F', '#62F5A0', '#4A8AF4', '#F28AD0'];
  for (let i = 0; i < 100; i++) {
    const vx = (hash(i * 1.3 + t0) - 0.5) * 1300, vy = -(500 + hash(i * 2.7 + t0) * 900);
    const x = 540 + vx * a, y = 675 + vy * a + 0.5 * 1600 * a * a;
    ctx.save(); ctx.globalAlpha = 1 - seg(a, 1.3, 1.9); ctx.translate(x, y); ctx.rotate(a * (5 + hash(i) * 12));
    ctx.fillStyle = pal[i % 5]; ctx.fillRect(-11, -6, 22, 12); ctx.restore();
  }
}
function drawEndCard(ctx, t) {
  const p = seg(t, TL.endCard, TL.endCard + 0.3);
  if (p <= 0) return;
  const y = lerp(-200, 250, easeOutBack(p));
  rr(ctx, 50, y - 115, 980, 230, 30); ctx.fillStyle = 'rgba(32,28,25,0.93)'; ctx.fill();
  text(ctx, TXT.end1, 540, y - 28, fitFont(ctx, TXT.end1, 900, 80, 900), C.paper);
  text(ctx, TXT.end2, 540, y + 62, fitFont(ctx, TXT.end2, 800, 48, 900), C.yellow);
}
function shake(t) {
  let a = 0;
  for (const [t0, amp, k] of [[TL.err1, 12, 14], [TL.err2, 14, 14], [TL.err3, 14, 14], [TL.bigErr, 22, 10], [TL.ok1, 6, 10], [TL.ok2, 6, 10]])
    if (t >= t0) a += amp * Math.exp(-(t - t0) * k);
  return { x: a * Math.sin(t * 93), y: a * Math.cos(t * 71) };
}

// =====================================================================
//  FULL FRAME
// =====================================================================
function draw(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(getPaper(), 0, 0);
  const sh = shake(t), st = ashState(t);
  ctx.save(); ctx.translate(sh.x, sh.y);
  ctx.fillStyle = 'rgba(150,110,60,0.13)'; ctx.fillRect(-100, FOOT, W + 200, 400);
  line(ctx, -100, FOOT, W + 100, FOOT, 6);
  drawCard(ctx, t);
  if (st) drawAsh(ctx, t, st);
  drawRobot(ctx, t);
  drawFlyingMustache(ctx, t, st);
  drawCursor(ctx, t);
  ctx.restore();
  STAMPS.forEach(s => drawStamp(ctx, t, s));
  drawConfetti(ctx, t, TL.ok1); drawConfetti(ctx, t, TL.ok2);
  drawEndCard(ctx, t);
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,10,0.24)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// =====================================================================
//  SOUNDS (same timeline as the picture)
// =====================================================================
function audioEvents() {
  const ev = []; const add = (t, type, p = {}) => ev.push({ t, type, ...p });
  CLICKS.forEach(c => c.kind === 'tile' ? add(c.t, 'tick', { f: 1900 }) : add(c.t, 'click'));
  for (const [a, b] of [TL.spin1, TL.spin3]) for (let x = a; x < b; x += 0.09) add(x, 'tick', { f: 950 });
  add(TL.spin2[0], 'drumroll', { d: TL.spin2[1] - TL.spin2[0] });
  add(TL.spin4[0], 'drumroll', { d: TL.spin4[1] - TL.spin4[0] });
  for (const e of [TL.err1, TL.err2, TL.err3]) add(e, 'buzz', { n: 2 });
  for (const e of TL.errs) add(e, 'buzz', { n: 1, v: 0.7 });
  add(TL.bigErr, 'buzz', { n: 2, v: 1.1 });
  for (const o of [TL.ok1, TL.ok2]) { add(o, 'ding', { f: 1568 }); add(o + 0.05, 'tada'); add(o, 'sparkle'); }
  add(TL.think[0] + 0.05, 'pop', { f: 1100 });
  [[TL.mustache, 500], [TL.glasses, 650], [TL.hat, 850]].forEach(([x, f]) => { add(x - 0.3, 'swish', { v: 0.5 }); add(x, 'pop', { f }); });
  add(TL.ashIn[0], 'whoosh', { v: 0.6 }); add(TL.ashIn[1], 'poof');
  add(TL.err3 + 0.05, 'gasp');
  [TL.grid1, TL.grid2, ...TL.swaps].forEach(x => add(x, 'swish', { v: 0.45 }));
  add(TL.lookDown[0] - 0.1, 'cricket', { d: 1.3 });
  add(TL.fly[0], 'whoosh', { v: 0.5 }); add(TL.fly[1], 'pop', { f: 700 });
  add(TL.endCard, 'swish', { v: 0.5 });
  return { events: ev, dur: TL.dur, music: { bpm: 120, mute: [[13.4, TL.check4 + 0.05]], end: TL.ok2 - 0.05 } };
}
