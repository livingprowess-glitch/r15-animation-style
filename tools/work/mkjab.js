const fs = require("fs");
const D = Math.PI / 180;
const K = { load: 15, hit: 20, over: 26, back: 36, settle: 36, end: 68 };
const hand = JSON.parse(process.argv[2] || "null") || { hit: [-1.144, 1.178, -1.653], over: [-1.06, 1.16, -1.62] };

const tpl = `const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ ${K.load}, 0, -18, 1.5, "linear", 0.03, -0.22, 0.48 },
		{ ${K.hit}, -6, -40, -1, "outQuad", 0, -0.3, 0.05 },
		{ ${K.over}, -7, -43, -1, "inOutSine", 0, -0.3, 0.03 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ ${K.load}, -3, 12, -1.5, "linear" },
		{ ${K.hit}, -10, -8, 1, "outQuad" },
		{ ${K.over}, -11, -9, 1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ ${K.load}, -8, 6, 0.5, "linear" },
		{ ${K.hit}, -11, 44, 0, "outQuad" },
		{ ${K.over}, -11, 47, 0, "inOutSine" },
		{ LAST_FRAME, -7, 15, 0.5, "linear" },
	},
` + fs.readFileSync(__dirname + "/jab.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
fs.writeFileSync(__dirname + "/jab.tpl", tpl);

const A0 = [0.56, -2.825, 0.75], BALL = 0.42;
const dir = y => [-Math.sin(y * D), 0, -Math.cos(y * D)];
const d0 = dir(-35);
const B = [A0[0] + BALL * Math.cos(-12 * D) * d0[0], A0[2] + BALL * Math.cos(-12 * D) * d0[2]];
const idleFoot = (f, ease) => ({ f, pos: [0.56, -2.825, 0.75], pole: [0.57, 0, -0.82], yaw: -35, pitch: -12, ease });
const heel = (f, pitch, ease) => {
	const d = dir(-35), r = BALL * Math.cos(pitch * D);
	return { f, pos: [+(B[0] - r * d[0]).toFixed(3), +(-2.929 + 0.5 * Math.sin(Math.abs(pitch) * D)).toFixed(3), +(B[1] - r * d[2]).toFixed(3)], pole: [0.57, 0, -0.82], yaw: -35, pitch, ease };
};
const L = (f, pos, ease, pole = [-0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const R = (f, pos, ease, pole = [0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			L(0, [-0.74, 1.14, -1.14], "inOutSine"),
			L(K.load, [-0.68, 1.04, -0.98], "outQuad"),
			L(K.hit, hand.hit, "outQuad", [-0.6, -1, 0.1]),
			L(K.hit + 6, hand.over, "outCubic", [-0.6, -1, 0.1]),
			L(K.hit + 14, [-0.74, 1.14, -1.14], "linear"),
			L(K.end, [-0.74, 1.14, -1.14], "linear"),
		],
		Right: [
			R(0, [0.62, 1.1, -1.06], "inOutSine"),
			R(K.load, [0.62, 1.12, -1.08], "outQuad"),
			R(K.hit, [0.56, 1.17, -1.06], "outQuad"),
			R(K.over, [0.56, 1.17, -1.06], "inOutCubic"),
			R(K.back, [0.62, 1.1, -1.06], "linear"),
			R(K.end, [0.62, 1.1, -1.06], "linear"),
		],
	},
	legs: {
		Left: [
			{ f: 0, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
			{ f: K.load, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "outQuad" },
			{ f: K.load + 2, pos: [-0.53, -2.71, -0.74], pole: [0, 0, -1], yaw: 3, pitch: 2, ease: "inQuad" },
			{ f: K.hit - 1, pos: [-0.54, -2.89, -0.9], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
			{ f: K.hit + 12, pos: [-0.54, -2.89, -0.9], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "outQuad" },
			{ f: K.hit + 16, pos: [-0.53, -2.72, -0.72], pole: [0, 0, -1], yaw: 3, pitch: 0, ease: "inQuad" },
			{ f: K.hit + 20, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
			{ f: K.end, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
		],
		Right: [
			idleFoot(0, "inOutSine"),
			idleFoot(K.load, "outQuad"),
			heel(K.hit, -20, "outQuad"),
			heel(K.over, -20, "inOutSine"),
			idleFoot(K.end, "linear"),
		],
	},
};
fs.writeFileSync(__dirname + "/jab_ik.json", JSON.stringify(spec, null, "\t"));
const cfg = JSON.parse(fs.readFileSync(__dirname + "/jab.json", "utf8"));
cfg.lastFrame = K.end;
cfg.markers = { [K.hit]: "Hit" };
fs.writeFileSync(__dirname + "/jab.json", JSON.stringify(cfg, null, "\t"));
console.log("jab spec written", JSON.stringify(K));
