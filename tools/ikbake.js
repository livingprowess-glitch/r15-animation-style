// IK bake: hands/feet are authored as positions, joint rotations are solved per frame.
// usage: node ikbake.js <tracks.tpl> <ik.json> <out.lua>
// ik.json: {
//   "lastFrame": 119,
//   "arms": { "Left": [ { "f": 0, "pos": [x,y,z], "pole": [x,y,z], "ease": "outQuad" }, ... ], "Right": [...] },   hand centre, UpperTorso space
//   "legs": { "Left": [ { "f": 0, "pos": [x,y,z], "pole": [x,y,z], "yaw": 0, "ease": "linear" }, ... ], "Right": [...] }  ankle pivot, HumanoidRootPart space
// }
// legs may also carry "pitch" (deg, Rx after yaw): negative raises the heel onto the ball of the foot; raise the ankle target by ~0.5*sin(|pitch|) to keep the toes on the floor.
// The tracks template must contain __<PartName>__ placeholders for every solved joint block.
const fs = require("fs");
const [, , tplFile, ikFile, outFile] = process.argv;
let src = fs.readFileSync(tplFile, "utf8");
const ik = JSON.parse(fs.readFileSync(ikFile, "utf8"));
const geo = JSON.parse(fs.readFileSync(__dirname + "/geometry.json", "utf8")).joints;
const D = Math.PI / 180;

const sub = (a, b) => a.map((v, i) => v - b[i]);
const add = (a, b) => a.map((v, i) => v + b[i]);
const scale = (a, s) => a.map(v => v * s);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const len = a => Math.sqrt(dot(a, a));
const norm = a => scale(a, 1 / len(a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const ry = a => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const mul = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
const mv = (M, v) => M.map(r => dot(r, v));
const tr = A => A[0].map((_, j) => A.map(r => r[j]));
const euler = (x, y, z) => mul(mul(rx(x * D), ry(y * D)), rz(z * D));
const toXYZ = M => [Math.atan2(-M[1][2], M[2][2]) / D, Math.asin(Math.max(-1, Math.min(1, M[0][2]))) / D, Math.atan2(-M[0][1], M[0][0]) / D];
const cols = (a, b, c) => [[a[0], b[0], c[0]], [a[1], b[1], c[1]], [a[2], b[2], c[2]]];

const EASE = {
	linear: x => x, inQuad: x => x * x, outQuad: x => 1 - (1 - x) ** 2, outCubic: x => 1 - (1 - x) ** 3,
	inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2, inOutCubic: x => x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2,
	outBack: x => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
};
const sampleTargets = (keys, f) => {
	if (f <= keys[0].f) return keys[0];
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i], b = keys[i + 1];
		if (f <= b.f) {
			const t = EASE[a.ease || "linear"]((f - a.f) / (b.f - a.f));
			const mix = (p, q) => p.map((v, j) => v + (q[j] - v) * t);
			return { pos: mix(a.pos, b.pos), pole: mix(a.pole, b.pole), yaw: (a.yaw || 0) + ((b.yaw || 0) - (a.yaw || 0)) * t, pitch: (a.pitch || 0) + ((b.pitch || 0) - (a.pitch || 0)) * t };
		}
	}
	return keys[keys.length - 1];
};

const lastFrame = ik.lastFrame;
const rootBlock = (() => {
	const start = src.indexOf("\tLowerTorso = {\n");
	const end = src.indexOf("\n\t},", start);
	return src.slice(start, end).split("\n").map(l => l.match(/\{\s*([^{}]+)\}/)).filter(Boolean)
		.map(m => m[1].split(",").map(s => s.trim().replace(/"/g, "")))
		.map(k => ({ f: k[0] === "LAST_FRAME" ? lastFrame : Number(k[0]), v: [1, 2, 3, 5, 6, 7].map(i => Number(k[i] || 0)), ease: k[4] }));
})();
const sampleRoot = f => {
	for (let i = 0; i < rootBlock.length - 1; i++) {
		const a = rootBlock[i], b = rootBlock[i + 1];
		if (f <= b.f) { const t = EASE[a.ease]((f - a.f) / (b.f - a.f)); return a.v.map((v, j) => v + (b.v[j] - v) * t); }
	}
	return rootBlock[rootBlock.length - 1].v;
};

const waistBlock = (() => {
	const start = src.indexOf("\tUpperTorso = {\n");
	if (start < 0) return [{ f: 0, v: [0, 0, 0], ease: "linear" }];
	const end = src.indexOf("\n\t},", start);
	return src.slice(start, end).split("\n").map(l => l.match(/\{\s*([^{}]+)\}/)).filter(Boolean)
		.map(m => m[1].split(",").map(s => s.trim().replace(/"/g, "")))
		.map(k => ({ f: k[0] === "LAST_FRAME" ? lastFrame : Number(k[0]), v: [1, 2, 3].map(i => Number(k[i] || 0)), ease: k[4] }));
})();
const sampleWaist = f => {
	for (let i = 0; i < waistBlock.length - 1; i++) {
		const a = waistBlock[i], b = waistBlock[i + 1];
		if (f <= b.f) { const t = EASE[a.ease]((f - a.f) / (b.f - a.f)); return a.v.map((v, j) => v + (b.v[j] - v) * t); }
	}
	return waistBlock[waistBlock.length - 1].v;
};
// UpperTorso frame in HumanoidRootPart space at frame f
const chestAt = f => {
	const r = sampleRoot(f), w = sampleWaist(f);
	const Rroot = euler(r[0], r[1], r[2]);
	const ltPos = add(add([0, -1, 0], [r[3], r[4], r[5]]), mv(Rroot, scale(geo.LowerTorso.c1, -1)));
	const Rw = euler(w[0], w[1], w[2]);
	const R = mul(Rroot, Rw);
	const pos = add(ltPos, mv(Rroot, add(geo.UpperTorso.c0, mv(Rw, scale(geo.UpperTorso.c1, -1)))));
	return { R, pos };
};
// arm keys may set "world": true -> pos is HumanoidRootPart space; segments touching a world key travel in a straight world line
const sampleArm = (keys, f) => {
	const toWorld = k => { if (k.world) return k.pos; const c = chestAt(k.f); return add(c.pos, mv(c.R, k.pos)); };
	const toLocal = p => { const c = chestAt(f); return mv(tr(c.R), sub(p, c.pos)); };
	if (f <= keys[0].f) return { pos: keys[0].world ? toLocal(keys[0].pos) : keys[0].pos, pole: keys[0].pole };
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i], b = keys[i + 1];
		if (f <= b.f) {
			const t = EASE[a.ease || "linear"]((f - a.f) / (b.f - a.f));
			const pole = a.pole.map((v, j) => v + (b.pole[j] - v) * t);
			if (!a.world && !b.world) return { pos: a.pos.map((v, j) => v + (b.pos[j] - v) * t), pole };
			const A = toWorld(a), B = toWorld(b);
			return { pos: toLocal(A.map((v, j) => v + (B[j] - v) * t)), pole };
		}
	}
	const last = keys[keys.length - 1];
	return { pos: last.world ? toLocal(last.pos) : last.pos, pole: last.pole };
};

// two-bone solve in the parent space: S pivot, T target, u upper bone, b lower length, bendSign +1 elbow / -1 knee
function twoBone(S, T, u, b, bendSign, pole, ref) {
	const Dist = len(sub(T, S));
	const uy = u[1];
	let c = (dot(u, u) + b * b - Dist * Dist) / (2 * uy * b);
	c = Math.max(-1, Math.min(1, c));
	const phi = Math.acos(c);
	const v = [0, -b * Math.cos(bendSign * phi), -b * Math.sin(bendSign * phi)];
	const w = add(u, v);
	const e1 = norm(w), e2 = norm(sub(ref, scale(e1, dot(ref, e1)))), e3 = cross(e1, e2);
	const t = norm(sub(T, S)), p = norm(sub(pole, scale(t, dot(pole, t)))), q = cross(t, p);
	const R = mul(cols(t, p, q), tr(cols(e1, e2, e3)));
	return { R, bend: bendSign * phi / D, reach: Dist };
}

const out = {};
const push = (name, f, xyz) => { (out[name] = out[name] || []).push({ f, xyz }); };
const warnings = [];
for (let f = 0; f <= lastFrame; f++) {
	for (const side of Object.keys(ik.arms || {})) {
		const g = sampleArm(ik.arms[side], f);
		const S = geo[side + "UpperArm"].c0;
		const u = sub(geo[side + "LowerArm"].c0, geo[side + "UpperArm"].c1);
		const b = -(geo[side + "Hand"].c0[1] - geo[side + "LowerArm"].c1[1]) + geo[side + "Hand"].c1[1];
		const s = twoBone(S, g.pos, u, b, 1, g.pole, [0, 0, 1]);
		if (s.reach > Math.sqrt(u[0] ** 2 + (u[1] - b) ** 2) + 0.01) warnings.push(`f${f} ${side} hand out of reach by ${(s.reach - Math.sqrt(u[0] ** 2 + (u[1] - b) ** 2)).toFixed(2)}`);
		push(side + "UpperArm", f, toXYZ(s.R));
		push(side + "LowerArm", f, [s.bend, 0, 0]);
	}
	const r = sampleRoot(f);
	const Rroot = euler(r[0], r[1], r[2]);
	const ltPos = add(add([0, -1, 0], [r[3], r[4], r[5]]), mv(Rroot, scale(geo.LowerTorso.c1, -1)));
	for (const side of Object.keys(ik.legs || {})) {
		const g = sampleTargets(ik.legs[side], f);
		const local = mv(tr(Rroot), sub(g.pos, ltPos));
		const poleLocal = mv(tr(Rroot), g.pole);
		const S = geo[side + "UpperLeg"].c0;
		const u = sub(geo[side + "LowerLeg"].c0, geo[side + "UpperLeg"].c1);
		const b = -(geo[side + "Foot"].c0[1] - geo[side + "LowerLeg"].c1[1]);
		const s = twoBone(S, local, u, b, -1, poleLocal, [0, 0, -1]);
		if (s.reach > len(u) + b + 0.01) warnings.push(`f${f} ${side} foot out of reach by ${(s.reach - len(u) - b).toFixed(2)}`);
		const shinWorld = mul(mul(Rroot, s.R), rx(s.bend * D));
		const ankle = mul(tr(shinWorld), mul(ry((g.yaw || 0) * D), rx((g.pitch || 0) * D)));
		push(side + "UpperLeg", f, toXYZ(s.R));
		push(side + "LowerLeg", f, [s.bend, 0, 0]);
		push(side + "Foot", f, toXYZ(ankle));
	}
}
for (const [name, keys] of Object.entries(out)) {
	const lines = keys.map(k => `\t\t{ ${k.f === lastFrame ? "LAST_FRAME" : k.f}, ${k.xyz.map(v => Math.round(v * 100) / 100).join(", ")}, "linear" },`);
	const tag = `__${name}__`;
	if (!src.includes(tag)) throw new Error("template missing " + tag);
	src = src.replace(tag, "\t\t-- IK-baked: positions authored in the ik spec, rotations solved per frame\n" + lines.join("\n"));
}
fs.writeFileSync(outFile, src);
console.log("baked", Object.keys(out).join(", "));
if (warnings.length) console.log("WARN " + warnings.length + " unreachable frames, first: " + warnings.slice(0, 4).join("; "));
