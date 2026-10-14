// usage: node onion.js <posedump.json (every frame)> <out.png> [hitFrame|-1] [ghostEvery=4]
// One picture of the whole motion: side / front / top panels with ghosted poses (blue before the hit, orange after),
// per-frame trails of both hands and feet (dot spacing = speed, red = a 4-frame window over the snap limit),
// the hit pose drawn solid, and a spacing chart (studs per frame for each extremity) along the bottom.
const fs = require("fs");
const { execFileSync } = require("child_process");
const M = require("./posemetrics");
const [, , inFile, outFile, hitArg = "-1", everyArg = "4"] = process.argv;
const poses = M.sorted(JSON.parse(fs.readFileSync(inFile, "utf8")));
const hit = Number(hitArg) >= 0 ? Number(hitArg) : null;
const every = Number(everyArg);
const first = poses[0].frame, last = poses[poses.length - 1].frame;
const SNAP = 0.6, WIN = 4;

const P = 600, CH = 300, W = P * 3, H = P + CH;
const img = new Float32Array(W * H * 3);
for (let i = 0; i < W * H; i++) { img[i * 3] = 40; img[i * 3 + 1] = 42; img[i * 3 + 2] = 48; }
let CLIP = { x0: 0, x1: W - 1, y0: 0, y1: H - 1 };
const put = (x, y, c, a = 1) => {
	x = Math.round(x); y = Math.round(y);
	if (x < CLIP.x0 || x > CLIP.x1 || y < CLIP.y0 || y > CLIP.y1) return;
	const i = (y * W + x) * 3;
	for (let k = 0; k < 3; k++) img[i + k] = img[i + k] * (1 - a) + c[k] * a;
};
function fillPoly(pts, col, a, clip) {
	let minY = Infinity, maxY = -Infinity;
	for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
	for (let y = Math.max(clip.y0, Math.ceil(minY)); y <= Math.min(clip.y1, Math.floor(maxY)); y++) {
		const xs = [];
		for (let i = 0; i < pts.length; i++) {
			const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
			if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
		}
		xs.sort((p, q) => p - q);
		for (let k = 0; k + 1 < xs.length; k += 2)
			for (let x = Math.max(clip.x0, Math.ceil(xs[k])); x <= Math.min(clip.x1, Math.floor(xs[k + 1])); x++) put(x, y, col, a);
	}
}
function line(x0, y0, x1, y1, col, a = 1, w = 1) {
	const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
	for (let t = 0; t <= n; t++) {
		const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n;
		for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < w; dy++) put(x + dx - (w >> 1), y + dy - (w >> 1), col, a);
	}
}
const dot = (x, y, r, col, a = 1) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) put(x + dx, y + dy, col, a); };

const FONT = {
	0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001", 5: "111100111001111",
	6: "111100111101111", 7: "111001001010010", 8: "111101111101111", 9: "111101111001111", A: "010101111101101", B: "110101110101110",
	C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
	I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101",
	O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
	U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111",
	".": "000000000000010", "/": "001001010100100", "-": "000000111000000", "=": "000111000111000", "%": "101001010100101", ":": "000010000010000",
	"(": "001010010010001", ")": "100010010010100", ",": "000000000010100", "+": "000010111010000", ">": "100010001010100", " ": "000000000000000",
};
function text(x, y, s, col, sc = 3) {
	for (const ch of String(s).toUpperCase()) {
		const g = FONT[ch] || FONT[" "];
		for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === "1") for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) put(x + c * sc + a, y + r * sc + b, col);
		x += 4 * sc;
	}
}

const BODY = {
	Head: [235, 220, 190], UpperTorso: [200, 60, 50], LowerTorso: [150, 45, 40],
	LeftUpperArm: [235, 170, 60], LeftLowerArm: [215, 150, 45], LeftHand: [190, 120, 30],
	RightUpperArm: [60, 140, 220], RightLowerArm: [45, 120, 200], RightHand: [30, 95, 175],
	LeftUpperLeg: [240, 200, 80], LeftLowerLeg: [220, 180, 60], LeftFoot: [190, 150, 40],
	RightUpperLeg: [70, 175, 90], RightLowerLeg: [55, 155, 75], RightFoot: [40, 130, 60],
};
const TRAIL = { LeftHand: [255, 175, 60], RightHand: [90, 170, 255], LeftFoot: [240, 220, 90], RightFoot: [90, 210, 120] };
const PRE = [110, 150, 255], POST = [255, 150, 80], RED = [255, 60, 60];
const LIGHT = [0.4, 0.7, -0.6];

const S = 80, FLOOR = -3.0, BASE = P - 60;
const panels = [
	{ title: "SIDE (FACING LEFT)", cam: p => [p[2], p[1], p[0]] },
	{ title: "FRONT", cam: p => [-p[0], p[1], p[2]] },
	{ title: "TOP (FORWARD UP)", cam: p => [-p[0], -p[2], -p[1]], top: true },
];
panels.forEach((pn, i) => {
	pn.ox = i * P;
	pn.clip = { x0: pn.ox, x1: pn.ox + P - 1, y0: 0, y1: P - 1 };
	pn.scr = p => { const s = pn.cam(p); return [pn.ox + P / 2 + s[0] * S, pn.top ? P / 2 - s[1] * S : BASE - (s[1] - FLOOR) * S, s[2]]; };
});

function boxes(pose, pn, mode, tint, alpha) {
	const faces = [];
	for (const [name, part] of Object.entries(pose.parts)) {
		if (!BODY[name]) continue;
		const { p, r, s } = part;
		const ax = [[r[0], r[1], r[2]], [r[3], r[4], r[5]], [r[6], r[7], r[8]]];
		const corner = c => [0, 1, 2].map(i => p[i] + ax[0][i] * c[0] * s[0] / 2 + ax[1][i] * c[1] * s[1] / 2 + ax[2][i] * c[2] * s[2] / 2);
		for (const [axis, sign] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
			const others = [0, 1, 2].filter(a => a !== axis);
			const quad = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const c = [0, 0, 0]; c[axis] = sign; c[others[0]] = u; c[others[1]] = v; return pn.scr(corner(c)); });
			const n = ax[axis].map(v => v * sign);
			const shade = 0.55 + 0.45 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
			const base = mode === "solid" ? BODY[name] : tint;
			faces.push({ depth: quad.reduce((a, q) => a + q[2], 0) / 4, pts: quad.map(q => [q[0], q[1]]), col: base.map(v => Math.min(255, v * shade)) });
		}
	}
	faces.sort((a, b) => b.depth - a.depth);
	for (const f of faces) fillPoly(f.pts, f.col, alpha, pn.clip);
}

const snapFrames = {};
for (const part of M.EXTREMITIES) {
	snapFrames[part] = new Set();
	const ps = poses;
	for (let i = 0; i + WIN < ps.length; i++) {
		if (hit !== null && ps[i].frame < hit + 2) continue;
		const a = ps[i].parts[part].p, b = ps[i + WIN].parts[part].p;
		if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > SNAP) for (let k = 1; k <= WIN; k++) snapFrames[part].add(ps[i + k].frame);
	}
}

for (const pn of panels) {
	CLIP = pn.clip;
	if (!pn.top) line(pn.ox + 10, pn.scr([0, FLOOR, 0])[1], pn.ox + P - 10, pn.scr([0, FLOOR, 0])[1], [90, 94, 104], 1, 2);
	for (const pose of poses) {
		if ((pose.frame - first) % every !== 0 || pose.frame === hit) continue;
		boxes(pose, pn, "ghost", hit !== null && pose.frame > hit ? POST : PRE, 0.07);
	}
	const hp = poses.find(p => p.frame === hit) || null;
	if (hp) boxes(hp, pn, "solid", null, 0.55);
	const labels = [];
	for (const part of M.EXTREMITIES) {
		for (let i = 1; i < poses.length; i++) {
			const a = pn.scr(poses[i - 1].parts[part].p), b = pn.scr(poses[i].parts[part].p);
			const bad = snapFrames[part].has(poses[i].frame);
			line(a[0], a[1], b[0], b[1], bad ? RED : TRAIL[part], 0.9, bad ? 3 : 2);
		}
		for (const pose of poses) {
			const q = pn.scr(pose.parts[part].p);
			dot(q[0], q[1], pose.frame === hit ? 5 : 2, pose.frame === hit ? [255, 255, 255] : TRAIL[part]);
			if (part.endsWith("Hand") && pose.frame % 10 === 0 && pose.frame !== first && !labels.some(l => Math.hypot(l[0] - q[0], l[1] - q[1]) < 22)) {
				labels.push([q[0], q[1]]);
				text(q[0] + 6, q[1] - 6, pose.frame, [220, 220, 230], 2);
			}
		}
	}
	text(pn.ox + 14, 14, pn.title, [230, 230, 235], 3);
	line(pn.ox, 0, pn.ox, P - 1, [25, 25, 30], 1, 2);
}
CLIP = { x0: 0, x1: W - 1, y0: 0, y1: H - 1 };

const legendY = P - 34;
let lx = 14;
for (const [part, c] of Object.entries(TRAIL)) { dot(lx + 6, legendY + 7, 5, c); text(lx + 16, legendY, part, [215, 215, 220], 2); lx += 150; }
dot(lx + 6, legendY + 7, 5, RED); text(lx + 16, legendY, "SNAP > 0.6 PER 4 FRAMES", [215, 215, 220], 2); lx += 290;
text(lx, legendY, `GHOSTS EVERY ${every}F: BLUE BEFORE HIT, ORANGE AFTER${hit !== null ? `, SOLID = HIT F${hit}` : ""}`, [215, 215, 220], 2);

const cx0 = 70, cx1 = W - 30, cy0 = P + 40, cy1 = H - 40;
for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) put(x, y, [30, 31, 36]);
const sp = {}; let vmax = SNAP / WIN * 1.5;
for (const part of M.EXTREMITIES) { sp[part] = M.travel(poses, part).speed; vmax = Math.max(vmax, ...sp[part].map(s => s.v)); }
const fx = f => cx0 + (f - first) / (last - first) * (cx1 - cx0), vy = v => cy1 - v / vmax * (cy1 - cy0);
for (let f = first; f <= last; f++) if (f % 10 === 0) { line(fx(f), cy0, fx(f), cy1, [50, 52, 60]); text(fx(f) - 6, cy1 + 8, f, [170, 170, 180], 2); }
const lim = SNAP / WIN;
for (let x = (hit !== null ? fx(hit + 2) : cx0); x < cx1; x += 10) line(x, vy(lim), Math.min(cx1, x + 5), vy(lim), RED, 1, 2);
if (hit !== null) { line(fx(hit), cy0, fx(hit), cy1, [255, 255, 255], 0.8, 2); text(fx(hit) + 6, cy0 + 6, `HIT F${hit}`, [255, 255, 255], 2); }
for (const part of M.EXTREMITIES) {
	const s = sp[part];
	for (let i = 1; i < s.length; i++) line(fx(s[i - 1].frame), vy(s[i - 1].v), fx(s[i].frame), vy(s[i].v), TRAIL[part], 1, 2);
}
text(cx0, P + 12, "SPACING: STUDS PER FRAME FOR EACH HAND AND FOOT. DASHED RED = AVERAGE SNAP LIMIT AFTER THE HIT (0.15/F)", [215, 215, 220], 2);
text(8, cy0, vmax.toFixed(2), [170, 170, 180], 2); text(8, cy1 - 10, "0", [170, 170, 180], 2);

const out = Buffer.alloc(W * H * 3);
for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(img[i])));
const ppm = outFile.replace(/\.png$/, ".ppm");
fs.writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), out]));
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", ppm, outFile]);
fs.unlinkSync(ppm);
const snaps = Object.entries(snapFrames).filter(([, s]) => s.size).map(([p, s]) => `${p} f${Math.min(...s)}-f${Math.max(...s)}`);
console.log(`onion ${outFile}: ${poses.length} frames${snaps.length ? "; SNAP segments: " + snaps.join(", ") : "; no snap segments"}`);
