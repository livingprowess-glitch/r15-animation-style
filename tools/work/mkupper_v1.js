const fs = require("fs");
const D = Math.PI / 180;
const K = { load: 22, hit: 27, over: 33, end: 77 };
const hand = JSON.parse(process.argv[2] || "null") || { load: [0.75, 0.25, -0.85], hit: [0.6, 1.1, -1.4], hold: [0.55, 1.35, -1.35] };
const body = JSON.parse(process.argv[3] || "null") || {};
const B = Object.assign({
	load: [-6, -32, -5, 0.05, -0.36, 0.46], hit: [-4, 4, 3, -0.02, -0.16, 0.3], over: [-2, 10, 3, -0.03, -0.12, 0.28],
	wload: [-8, 2, -6], whit: [-4, 14, 3], wover: [-2, 16, 3],
	nload: [-8, 26, 4], nhit: [-10, -16, -1], nover: [-12, -24, -1],
}, body);
const row = (f, v, ease) => `{ ${f}, ${v.slice(0, 3).join(", ")}, "${ease}"${v.length > 3 ? ", " + v.slice(3).join(", ") : ""} },`;

const tpl = `const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		${row("${K.load}", B.load, "inQuad")}
		${row("${K.hit}", B.hit, "outQuad")}
		${row("${K.over}", B.over, "inOutSine")}
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		${row("${K.load}", B.wload, "inQuad")}
		${row("${K.hit}", B.whit, "outQuad")}
		${row("${K.over}", B.wover, "inOutSine")}
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		${row("${K.load}", B.nload, "inQuad")}
		${row("${K.hit}", B.nhit, "outQuad")}
		${row("${K.over}", B.nover, "inOutSine")}
		{ LAST_FRAME, -7, 15, 0.5, "linear" },
	},
`.replace(/\$\{K\.(\w+)\}/g, (_, k) => K[k]) + fs.readFileSync(__dirname + "/jab_v1.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
fs.writeFileSync(__dirname + "/upper.tpl", tpl);

const BALL = 0.42;
const dir = y => [-Math.sin(y * D), 0, -Math.cos(y * D)];
const rd0 = dir(-35);
const rearBall = [0.56 + BALL * Math.cos(-12 * D) * rd0[0], 0.75 + BALL * Math.cos(-12 * D) * rd0[2]];
const rearIdle = (f, ease) => ({ f, pos: [0.56, -2.825, 0.75], pole: [0.57, 0, -0.82], yaw: -35, pitch: -12, ease });
const rearPivot = (f, yaw, pitch, ease) => {
	const d = dir(yaw), r = BALL * Math.cos(pitch * D);
	return { f, pos: [+(rearBall[0] - r * d[0]).toFixed(3), +(-2.929 + 0.5 * Math.sin(Math.abs(pitch) * D)).toFixed(3), +(rearBall[1] - r * d[2]).toFixed(3)], pole: d.map(v => +v.toFixed(3)), yaw, pitch, ease };
};
const leadIdle = (f, ease) => ({ f, pos: [-0.52, -2.89, -0.55], pole: [0, 0, -1], yaw: 3, pitch: -4, ease });
const L = (f, pos, ease, pole = [-0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const R = (f, pos, ease, pole = [0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			L(0, [-0.74, 1.14, -1.14], "inOutSine"),
			L(K.load, [-0.72, 1.15, -1.12], "outQuad"),
			L(K.hit, [-0.6, 1.17, -1.06], "outQuad", [-0.5, -1, 0.15]),
			L(K.hit + 6, [-0.6, 1.17, -1.06], "inOutSine", [-0.5, -1, 0.15]),
			L(K.hit + 18, [-0.74, 1.14, -1.14], "linear"),
			L(K.end, [-0.74, 1.14, -1.14], "linear"),
		],
		Right: [
			R(0, [0.62, 1.1, -1.06], "inOutSine"),
			R(K.load, hand.load, "inQuad"),
			R(K.hit, hand.hit, "outQuad"),
			R(K.hit + 6, hand.hold, "inOutSine"),
			R(K.hit + 18, [0.62, 1.1, -1.06], "linear"),
			R(K.end, [0.62, 1.1, -1.06], "linear"),
		],
	},
	poles: {
		Right: [
			{ f: 0, pole: [0.5, -1, 0.1], ease: "inOutSine" },
			{ f: K.load, pole: [0.6, -1, 0.25], ease: "inQuad" },
			{ f: K.hit, pole: [0.35, -1, 0.15], ease: "linear" },
			{ f: K.hit + 6, pole: [0.35, -1, 0.1], ease: "inOutSine" },
			{ f: K.hit + 18, pole: [0.5, -1, 0.1], ease: "linear" },
			{ f: K.end, pole: [0.5, -1, 0.1], ease: "linear" },
		],
	},
	legs: {
		Left: [leadIdle(0, "linear"), leadIdle(K.end, "linear")],
		Right: [
			rearIdle(0, "inOutSine"),
			rearIdle(K.load - 3, "inQuad"),
			rearPivot(K.hit, -12, -26, "outQuad"),
			rearPivot(K.over, -14, -26, "inOutSine"),
			rearIdle(K.end - 20, "linear"),
			rearIdle(K.end, "linear"),
		],
	},
};
fs.writeFileSync(__dirname + "/upper_ik.json", JSON.stringify(spec, null, "\t"));
fs.writeFileSync(__dirname + "/upper.json", JSON.stringify({
	name: "Boxing_Uppercut_Orthodox", label: "Boxing rear uppercut", lastFrame: K.end, loop: false, priority: "Action",
	markers: { [K.hit]: "Hit" }, header: ["Boxing rear uppercut (orthodox), chains from Boxing_Idle_Orthodox frame 0. Authored at base speed."],
}, null, "\t"));
console.log("uppercut spec written", JSON.stringify(K));
