const fs = require("fs");
const D = Math.PI / 180;
const K = { load: 15, hit: 20, over: 26, back: 38, settle: 38, end: 74 };

const tpl = `const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ ${K.load}, 0, -36, 2, "linear", 0.04, -0.24, 0.48 },
		{ ${K.hit}, -7, 26, -2, "outQuad", -0.03, -0.33, 0.1 },
		{ ${K.over}, -8, 29, -2, "inOutSine", -0.03, -0.33, 0.09 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ ${K.load}, -3, 2, -2, "linear" },
		{ ${K.hit}, -10, 22, 2, "outQuad" },
		{ ${K.over}, -11, 24, 2, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ ${K.load}, -8, 32, 1, "linear" },
		{ ${K.hit}, -12, -46, -1, "outQuad" },
		{ ${K.over}, -12, -52, -1, "inOutSine" },
		{ LAST_FRAME, -7, 15, 0.5, "linear" },
	},
` + fs.readFileSync(__dirname + "/cross.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
fs.writeFileSync(__dirname + "/cross.tpl", tpl);

const A0 = [0.56, -2.825, 0.75], BALL = 0.42;
const dir = y => [-Math.sin(y * D), 0, -Math.cos(y * D)];
const d0 = dir(-35);
const B = [A0[0] + BALL * Math.cos(-12 * D) * d0[0], A0[2] + BALL * Math.cos(-12 * D) * d0[2]];
const idleFoot = (f, ease) => ({ f, pos: [0.56, -2.825, 0.75], pole: [0.57, 0, -0.82], yaw: -35, pitch: -12, ease });
const pivot = (f, yaw, pitch, ease) => {
	const d = dir(yaw), r = BALL * Math.cos(pitch * D);
	return { f, pos: [+(B[0] - r * d[0]).toFixed(3), +(-2.929 + 0.5 * Math.sin(Math.abs(pitch) * D)).toFixed(3), +(B[1] - r * d[2]).toFixed(3)], pole: d.map(v => +v.toFixed(3)), yaw, pitch, ease };
};
const L = (f, pos, ease, pole = [-0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const R = (f, pos, ease, pole = [0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			L(0, [-0.74, 1.14, -1.14], "inOutSine"),
			L(K.load, [-0.78, 1.12, -1.24], "outQuad"),
			L(K.hit, [-0.6, 1.17, -1.06], "outQuad", [-0.5, -1, 0.15]),
			L(K.over, [-0.59, 1.17, -1.05], "inOutCubic", [-0.5, -1, 0.15]),
			L(K.back, [-0.74, 1.14, -1.14], "linear"),
			L(K.end, [-0.74, 1.14, -1.14], "linear"),
		],
		Right: [
			R(0, [0.62, 1.1, -1.06], "inOutSine"),
			R(K.load, [0.72, 0.98, -0.9], "outQuad"),
			R(K.hit, [1.466, 1.41, -1.481], "outQuad", [0.6, -1, 0.1]),
			R(K.hit + 6, [1.56, 1.459, -1.418], "outCubic", [0.6, -1, 0.1]),
			R(K.hit + 14, [0.62, 1.1, -1.06], "linear"),
			R(K.end, [0.62, 1.1, -1.06], "linear"),
		],
	},
	legs: {
		Left: [
			{ f: 0, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
			{ f: K.end, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease: "linear" },
		],
		Right: [
			idleFoot(0, "inOutSine"),
			idleFoot(K.load, "outQuad"),
			pivot(K.hit, 0, -34, "outQuad"),
			pivot(K.over, -2, -33, "inOutSine"),
			idleFoot(K.end, "linear"),
		],
	},
};
spec.poles = {
	Right: [
		{ f: 0, pole: [0.5, -1, 0.1], ease: "inOutSine" },
		{ f: K.load, pole: [1, -0.35, 0.1], ease: "inOutSine" },
		{ f: K.hit, pole: [0.6, -1, 0.1], ease: "linear" },
		{ f: K.hit + 6, pole: [0.6, -1, 0.1], ease: "outCubic" },
		{ f: K.hit + 14, pole: [0.5, -1, 0.1], ease: "linear" },
		{ f: K.end, pole: [0.5, -1, 0.1], ease: "linear" },
	],
};
fs.writeFileSync(__dirname + "/cross_ik.json", JSON.stringify(spec, null, "\t"));
const cfg = JSON.parse(fs.readFileSync(__dirname + "/cross.json", "utf8"));
cfg.lastFrame = K.end;
cfg.markers = { [K.hit]: "Hit" };
fs.writeFileSync(__dirname + "/cross.json", JSON.stringify(cfg, null, "\t"));
console.log("cross spec written", JSON.stringify(K));
