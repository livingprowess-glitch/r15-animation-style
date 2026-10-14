// usage: node render.js <posedump.json> <out.png> [views=front,side,three]
// Software-rasterises the R15 boxes (shaded faces, painter's sort) into a grid: one column per frame, one row per view.
const fs = require("fs");
const { execFileSync } = require("child_process");
const [, , inFile, outFile, viewArg] = process.argv;
const poses = JSON.parse(fs.readFileSync(inFile, "utf8"));
const VIEWS = (viewArg || "front,side,three").split(",");
const CELL = 300, SCALE = 46, CY = 128;
const W = CELL * poses.length, H = CELL * VIEWS.length;
const img = new Uint8Array(W * H * 3).fill(0);
for (let i = 0; i < W * H; i++) { img[i * 3] = 72; img[i * 3 + 1] = 74; img[i * 3 + 2] = 80; }

const COLOR = {
	Head: [235, 220, 190], UpperTorso: [200, 60, 50], LowerTorso: [150, 45, 40],
	LeftUpperArm: [235, 170, 60], LeftLowerArm: [215, 150, 45], LeftHand: [190, 120, 30],
	RightUpperArm: [60, 140, 220], RightLowerArm: [45, 120, 200], RightHand: [30, 95, 175],
	LeftUpperLeg: [240, 200, 80], LeftLowerLeg: [220, 180, 60], LeftFoot: [190, 150, 40],
	RightUpperLeg: [70, 175, 90], RightLowerLeg: [55, 155, 75], RightFoot: [40, 130, 60],
};
// camera: maps world point -> [screenX, screenY, depth(larger = farther)]
const cams = {
	leftq: p => { const a = 1.25; const x = p[0] * Math.cos(a) + p[2] * Math.sin(a), z = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [-x, p[1] * 0.97 - z * 0.1, z]; },
	front: p => [-p[0], p[1], p[2]],
	side: p => [p[2], p[1], p[0]],
	three: p => { const a = -0.7; const x = p[0] * Math.cos(a) + p[2] * Math.sin(a), z = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [-x, p[1] * 0.97 - z * 0.12, z]; },
};
const LIGHT = [0.4, 0.7, -0.6];

function fillPoly(pts, col, ox, oy) {
	let minY = Infinity, maxY = -Infinity;
	for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
	for (let y = Math.max(oy, Math.ceil(minY)); y <= Math.min(oy + CELL - 1, Math.floor(maxY)); y++) {
		const xs = [];
		for (let i = 0; i < pts.length; i++) {
			const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
			if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
		}
		xs.sort((a, b) => a - b);
		for (let k = 0; k + 1 < xs.length; k += 2)
			for (let x = Math.max(ox, Math.ceil(xs[k])); x <= Math.min(ox + CELL - 1, Math.floor(xs[k + 1])); x++) {
				const i = (y * W + x) * 3; img[i] = col[0]; img[i + 1] = col[1]; img[i + 2] = col[2];
			}
	}
}
function line(x0, y0, x1, y1, col) {
	const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
	for (let t = 0; t <= n; t++) {
		const x = Math.round(x0 + (x1 - x0) * t / n), y = Math.round(y0 + (y1 - y0) * t / n);
		if (x >= 0 && x < W && y >= 0 && y < H) { const i = (y * W + x) * 3; img[i] = col[0]; img[i + 1] = col[1]; img[i + 2] = col[2]; }
	}
}

poses.forEach((pose, col) => {
	VIEWS.forEach((view, row) => {
		const ox = col * CELL, oy = row * CELL, cam = cams[view];
		const toScreen = p => { const s = cam(p); return [ox + CELL / 2 + s[0] * SCALE, oy + CY - s[1] * SCALE, s[2]]; };
		const floorY = -3.2;
		const fl = [[-2.5, floorY, -2.5], [2.5, floorY, -2.5], [2.5, floorY, 2.5], [-2.5, floorY, 2.5]].map(toScreen);
		fillPoly(fl.map(p => [p[0], p[1]]), [92, 95, 102], ox, oy);
		const faces = [];
		for (const [name, part] of Object.entries(pose.parts)) {
			const { p, r, s } = part;
			const ax = [[r[0], r[1], r[2]], [r[3], r[4], r[5]], [r[6], r[7], r[8]]];
			const corner = (a, b, c) => [0, 1, 2].map(i => p[i] + ax[0][i] * a * s[0] / 2 + ax[1][i] * b * s[1] / 2 + ax[2][i] * c * s[2] / 2);
			const defs = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];
			for (const [axis, sign] of defs) {
				const n = ax[axis].map(v => v * sign);
				const others = [0, 1, 2].filter(a => a !== axis);
				const quad = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const c = [0, 0, 0]; c[axis] = sign; c[others[0]] = u; c[others[1]] = v; return corner(c[0], c[1], c[2]); });
				const scr = quad.map(toScreen);
				const depth = scr.reduce((a, q) => a + q[2], 0) / 4;
				const shade = 0.55 + 0.45 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
				let c = COLOR[name] || [200, 200, 200];
				if (name === "Head" && axis === 2 && sign === -1) c = [120, 90, 70];
				faces.push({ depth, pts: scr.map(q => [q[0], q[1]]), col: c.map(v => Math.min(255, Math.round(v * shade))) });
			}
		}
		faces.sort((a, b) => b.depth - a.depth);
		for (const f of faces) fillPoly(f.pts, f.col, ox, oy);
		line(ox, oy, ox + CELL - 1, oy, [40, 40, 45]); line(ox, oy, ox, oy + CELL - 1, [40, 40, 45]);
	});
});
const ppm = outFile.replace(/\.png$/, ".ppm");
fs.writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), Buffer.from(img)]));
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", ppm, outFile]);
fs.unlinkSync(ppm);
console.log("rendered", outFile, `${poses.length} frames x ${VIEWS.join("/")}; front = facing camera (character's left on image right), side = character's left side (facing image left)`);
