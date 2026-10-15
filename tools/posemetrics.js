// shared pose-dump measurements used by lint.js and onion.js
const fs = require("fs");
const D = 180 / Math.PI;
const geo = JSON.parse(fs.readFileSync(__dirname + "/geometry.json", "utf8")).joints;
const apply = (part, local) => [0, 1, 2].map(i => part.p[i] + part.r[i] * local[0] + part.r[3 + i] * local[1] + part.r[6 + i] * local[2]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const EXTREMITIES = ["LeftHand", "RightHand", "LeftFoot", "RightFoot"];

const sorted = poses => poses.slice().sort((a, b) => a.frame - b.frame);

function balance(pose) {
	let m = 0; const c = [0, 0, 0];
	for (const part of Object.values(pose.parts)) { const v = part.s[0] * part.s[1] * part.s[2]; m += v; for (let i = 0; i < 3; i++) c[i] += part.p[i] * v; }
	const com = c.map(v => v / m);
	const L = pose.parts.LeftFoot.p, R = pose.parts.RightFoot.p;
	const seg = [R[0] - L[0], R[2] - L[2]], len2 = seg[0] ** 2 + seg[1] ** 2;
	return { com, t: ((com[0] - L[0]) * seg[0] + (com[2] - L[2]) * seg[1]) / len2 };
}

function legs(pose) {
	const out = {};
	for (const side of ["Left", "Right"]) {
		const ul = pose.parts[side + "UpperLeg"], ll = pose.parts[side + "LowerLeg"], ft = pose.parts[side + "Foot"];
		const hip = apply(ul, geo[side + "UpperLeg"].c1), knee = apply(ll, geo[side + "LowerLeg"].c1), ankle = apply(ft, geo[side + "Foot"].c1);
		const mid = [0, 1, 2].map(i => (hip[i] + ankle[i]) / 2), o = [knee[0] - mid[0], knee[2] - mid[2]];
		const kneeYaw = Math.atan2(-o[0], -o[1]) * D;
		const toeYaw = Math.atan2(-ft.r[6], -ft.r[8]) * D;
		let dev = kneeYaw - toeYaw - 180; dev = ((dev % 360) + 540) % 360 - 180;
		const a = hip.map((v, i) => v - knee[i]), b = ankle.map((v, i) => v - knee[i]);
		const ang = Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b)))) * D;
		const bent = Math.hypot(...o) > 0.05;
		out[side] = { angle: ang, kneeOffToe: bent ? dev : 0 };
	}
	return out;
}

function armRoll(poses, side) {
	const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	let prev = null, roll = 0;
	return sorted(poses).map(pose => {
		const ua = pose.parts[side + "UpperArm"];
		const axis = [ua.r[3], ua.r[4], ua.r[5]], hinge = [ua.r[0], ua.r[1], ua.r[2]];
		let d = 0;
		if (prev) {
			const v = cross(prev.axis, axis), c = dot(prev.axis, axis);
			const h = prev.hinge, vh = cross(v, h);
			const moved = c > -0.999 ? h.map((x, i) => x + vh[i] + cross(v, vh)[i] / (1 + c)) : h;
			d = Math.atan2(dot(axis, cross(moved, hinge)), dot(moved, hinge)) * D;
		}
		roll += d;
		prev = { axis, hinge };
		return { frame: pose.frame, roll, change: d };
	});
}

// per-frame speed (studs/frame) of a part, and the worst travel over any `win` consecutive frames from `from` on
function travel(poses, part, from = 0, win = 4) {
	const ps = sorted(poses);
	const speed = [];
	for (let i = 1; i < ps.length; i++) speed.push({ frame: ps[i].frame, v: dist(ps[i].parts[part].p, ps[i - 1].parts[part].p) });
	let worst = { frame: -1, d: 0 };
	for (let i = 0; i + win < ps.length; i++) {
		if (ps[i].frame < from) continue;
		const d = dist(ps[i + win].parts[part].p, ps[i].parts[part].p);
		if (d > worst.d) worst = { frame: ps[i].frame, d };
	}
	return { speed, worst };
}

function poseDiff(a, b) {
	let pos = 0, rot = 0;
	for (const name of Object.keys(a.parts)) {
		if (!b.parts[name]) continue;
		pos = Math.max(pos, dist(a.parts[name].p, b.parts[name].p));
		for (let i = 0; i < 9; i++) rot = Math.max(rot, Math.abs(a.parts[name].r[i] - b.parts[name].r[i]));
	}
	return { pos, rot };
}

const PARENT = { LowerTorso: null, UpperTorso: "LowerTorso", Head: "UpperTorso", LeftUpperArm: "UpperTorso", LeftLowerArm: "LeftUpperArm", RightUpperArm: "UpperTorso", RightLowerArm: "RightUpperArm", LeftUpperLeg: "LowerTorso", LeftLowerLeg: "LeftUpperLeg", LeftFoot: "LeftLowerLeg", RightUpperLeg: "LowerTorso", RightLowerLeg: "RightUpperLeg", RightFoot: "RightLowerLeg" };
const M3 = r => [[r[0], r[3], r[6]], [r[1], r[4], r[7]], [r[2], r[5], r[8]]];
const mul = (a, b) => a.map(row => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
const T = a => [0, 1, 2].map(i => [0, 1, 2].map(j => a[j][i]));
const localRot = (pose, n) => { const r = M3(pose.parts[n].r), p = PARENT[n]; return p ? mul(T(M3(pose.parts[p].r)), r) : r; };
const rotAngle = (a, b) => { const r = mul(T(a), b); return Math.acos(Math.max(-1, Math.min(1, (r[0][0] + r[1][1] + r[2][2] - 1) / 2))) * D; };

// summed local joint rotation (deg) per frame across the whole body
function bodyMotion(poses) {
	const ps = sorted(poses);
	return ps.slice(1).map((p, i) => ({ frame: p.frame, sum: Object.keys(PARENT).reduce((s, n) => s + rotAngle(localRot(ps[i], n), localRot(p, n)), 0) }));
}

// per-frame direction change (deg) of a part's path, with its speed
function turns(poses, part) {
	const ps = sorted(poses), out = [];
	for (let i = 2; i < ps.length; i++) {
		const a = ps[i - 2].parts[part].p, b = ps[i - 1].parts[part].p, c = ps[i].parts[part].p;
		const u = b.map((v, k) => v - a[k]), v = c.map((x, k) => x - b[k]), lu = Math.hypot(...u), lv = Math.hypot(...v);
		if (lu < 1e-4 || lv < 1e-4) continue;
		out.push({ frame: ps[i].frame, turn: Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / lu / lv))) * D, speed: Math.min(lu, lv) });
	}
	return out;
}

module.exports = { balance, legs, armRoll, travel, poseDiff, sorted, bodyMotion, turns, EXTREMITIES };
