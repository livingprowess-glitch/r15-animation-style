const fs = require("fs");
const D = Math.PI / 180;
const K = { load: 15, hit: 20, over: 24, end: 70 };
const hand = JSON.parse(process.argv[2] || "null") || { load: [-0.98, 1.08, -0.95], hit: [-0.78, 1.15, -1.25], hold: [-0.72, 1.17, -1.28] };

const tpl = `const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ ${K.load}, -3, -14, 4, "outQuad", -0.05, -0.23, 0.42 },
		{ ${K.hit}, -4, -42, -2, "outQuad", 0.03, -0.25, 0.4 },
		{ ${K.over}, -4, -45, -2, "inOutSine", 0.03, -0.25, 0.4 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ ${K.load}, -5, 10, 3, "outQuad" },
		{ ${K.hit}, -7, -4, -2, "outQuad" },
		{ ${K.over}, -7, -5, -2, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ ${K.load}, -9, 4, -2, "outQuad" },
		{ ${K.hit}, -10, 44, 1, "outQuad" },
		{ ${K.over}, -10, 48, 1, "inOutSine" },
		{ LAST_FRAME, -7, 15, 0.5, "linear" },
	},
` + fs.readFileSync(__dirname + "/jab_v1.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
fs.writeFileSync(__dirname + "/hook.tpl", tpl);

const BALL = 0.42;
const dir = y => [-Math.sin(y * D), 0, -Math.cos(y * D)];
const leadA0 = [-0.52, -2.89, -0.55], leadYaw0 = 3, leadPitch0 = -4;
const ld0 = dir(leadYaw0);
const leadBall = [leadA0[0] + BALL * Math.cos(leadPitch0 * D) * ld0[0], leadA0[2] + BALL * Math.cos(leadPitch0 * D) * ld0[2]];
const leadIdle = (f, ease) => ({ f, pos: leadA0, pole: [0, 0, -1], yaw: leadYaw0, pitch: leadPitch0, ease });
const leadPivot = (f, yaw, pitch, ease) => {
	const d = dir(yaw), r = BALL * Math.cos(pitch * D);
	return { f, pos: [+(leadBall[0] - r * d[0]).toFixed(3), +(-2.929 + 0.5 * Math.sin(Math.abs(pitch) * D)).toFixed(3), +(leadBall[1] - r * d[2]).toFixed(3)], pole: d.map(v => +v.toFixed(3)), yaw, pitch, ease };
};
const rearIdle = (f, ease) => ({ f, pos: [0.56, -2.825, 0.75], pole: [0.57, 0, -0.82], yaw: -35, pitch: -12, ease });
const L = (f, pos, ease, pole = [-0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const R = (f, pos, ease, pole = [0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			L(0, [-0.74, 1.14, -1.14], "inOutSine"),
			L(K.load, hand.load, "outQuad"),
			L(K.hit, hand.hit, "outQuad"),
			L(K.hit + 2, hand.hold, "outCubic"),
			L(K.hit + 10, [-0.74, 1.14, -1.14], "linear"),
			L(K.end, [-0.74, 1.14, -1.14], "linear"),
		],
		Right: [
			R(0, [0.62, 1.1, -1.06], "inOutSine"),
			R(K.load, [0.6, 1.14, -1.04], "outQuad"),
			R(K.hit, [0.55, 1.18, -1.05], "outQuad"),
			R(K.hit + 10, [0.6, 1.12, -1.06], "inOutSine"),
			R(K.end, [0.62, 1.1, -1.06], "linear"),
		],
	},
	poles: {
		Left: [
			{ f: 0, pole: [-0.5, -1, 0.1], ease: "inOutSine" },
			{ f: K.load, pole: [-1, -0.05, 0.15], ease: "outQuad" },
			{ f: K.hit, pole: [-1, 0, 0.1], ease: "linear" },
			{ f: K.hit + 2, pole: [-1, 0, 0.1], ease: "outCubic" },
			{ f: K.hit + 10, pole: [-0.5, -1, 0.1], ease: "linear" },
			{ f: K.end, pole: [-0.5, -1, 0.1], ease: "linear" },
		],
	},
	legs: {
		Left: [
			leadIdle(0, "inOutSine"),
			leadIdle(K.load - 3, "outQuad"),
			leadPivot(K.hit, -38, -24, "outQuad"),
			leadPivot(K.over, -40, -24, "inOutSine"),
			leadIdle(K.end - 20, "linear"),
			leadIdle(K.end, "linear"),
		],
		Right: [rearIdle(0, "linear"), rearIdle(K.end, "linear")],
	},
};
fs.writeFileSync(__dirname + "/hook_ik.json", JSON.stringify(spec, null, "\t"));
fs.writeFileSync(__dirname + "/hook.json", JSON.stringify({
	name: "Boxing_LeadHook_Orthodox", label: "Boxing lead hook", lastFrame: K.end, loop: false, priority: "Action",
	markers: { [K.hit]: "Hit" }, header: ["Boxing lead hook (orthodox), chains from Boxing_Idle_Orthodox frame 0. Authored at base speed."],
}, null, "\t"));
console.log("hook spec written", JSON.stringify(K));
