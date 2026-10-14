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
	let prev = null;
	return sorted(poses).map(pose => {
		const ua = pose.parts[side + "UpperArm"];
		const axis = [ua.r[3], ua.r[4], ua.r[5]], hinge = [ua.r[0], ua.r[1], ua.r[2]];
		const ref = [0, 1, 0].map((v, i) => v - axis[i] * axis[1]); const rn = Math.hypot(...ref);
		const r = ref.map(v => v / rn);
		const cr = [axis[1] * r[2] - axis[2] * r[1], axis[2] * r[0] - axis[0] * r[2], axis[0] * r[1] - axis[1] * r[0]];
		const roll = Math.atan2(hinge[0] * cr[0] + hinge[1] * cr[1] + hinge[2] * cr[2], hinge[0] * r[0] + hinge[1] * r[1] + hinge[2] * r[2]) * D;
		let d = prev === null ? 0 : roll - prev; if (d > 180) d -= 360; if (d < -180) d += 360;
		prev = roll;
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

module.exports = { balance, legs, armRoll, travel, poseDiff, sorted, EXTREMITIES };
