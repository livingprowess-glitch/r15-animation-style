const fs = require("fs");
const D = Math.PI / 180;
const K = { pre: 20, load: 32, hit: 38, over: 45, hold: 51, mid: 70, guard: 90, end: 100 };
const hand = JSON.parse(process.argv[2] || "null");
const body = JSON.parse(process.argv[3] || "null");
const IDLE = { root: [-1, -24, 1, 0.02, -0.18, 0.43], waist: [-4, 9, -1], neck: [-7, 15, 0.5] };
const EASES = { 0: "inOutSine", pre: "inOutSine", load: "inQuad", hit: "outQuad", over: "inOutSine", hold: "inOutSine" };
const fmt = (f, v, ease) => `		{ ${f}, ${v.slice(0, 3).join(", ")}, "${ease}"${v.length > 3 ? ", " + v.slice(3).join(", ") : ""} },`;
const block = (part, name) => [`	${part} = {`, fmt(0, IDLE[name], EASES[0]), ...Object.keys(body[name]).map(k => fmt(K[k], body[name][k], EASES[k])), fmt("LAST_FRAME", IDLE[name], "linear"), "\t},"].join("\n");
const tpl = "const TRACKS: { [string]: { Key } } = {\n" + block("LowerTorso", "root") + "\n" + block("UpperTorso", "waist") + "\n" + block("Head", "neck") + "\n" + fs.readFileSync(__dirname + "/jab_v1.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
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
const ld0 = dir(3);
const leadBall = [-0.52 + BALL * Math.cos(-4 * D) * ld0[0], -0.55 + BALL * Math.cos(-4 * D) * ld0[2]];
const leadHeel = (f, pitch, ease) => {
	const d = dir(3), r = BALL * Math.cos(pitch * D);
	return { f, pos: [+(leadBall[0] - r * d[0]).toFixed(3), +(-2.929 + 0.5 * Math.sin(Math.abs(pitch) * D)).toFixed(3), +(leadBall[1] - r * d[2]).toFixed(3)], pole: [0, 0, -1], yaw: 3, pitch, ease };
};
const L = (f, pos, ease, pole = [-0.5, -1, 0.1]) => ({ f, pos, pole, ease });
const R = (f, pos, ease, pole = [0.5, -1, 0.1]) => Array.isArray(pos) ? { f, pos, pole, ease } : { f, aim: pos.aim, reach: pos.reach, pole, ease };
const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			L(0, [-0.74, 1.14, -1.14], "inOutSine"),
			L(K.pre, [-0.8, 1.2, -1.2], "inOutSine"),
			L(K.load, [-0.84, 1.24, -1.24], "outQuad"),
			L(K.hit, [-0.62, 1.18, -1.08], "outQuad", [-0.5, -1, 0.15]),
			L(K.hold, [-0.62, 1.18, -1.08], "inOutSine", [-0.5, -1, 0.15]),
			L(K.guard, [-0.74, 1.14, -1.14], "linear"),
			L(K.end, [-0.74, 1.14, -1.14], "linear"),
		],
		Right: [
			R(0, [0.62, 1.1, -1.06], "inOutSine"),
			R(K.pre, hand.pre, "inOutSine"),
			R(K.load, hand.load, "inQuad"),
			R(K.hit, hand.hit, "outQuad"),
			R(K.over, hand.over, "inQuad"),
			R(K.mid, hand.mid, "outQuad"),
			R(K.guard, [0.62, 1.1, -1.06], "linear"),
			R(K.end, [0.62, 1.1, -1.06], "linear"),
		],
	},
	poles: {
		Right: [
			{ f: 0, pole: [0.5, -1, 0.1], ease: "inOutSine" },
			{ f: K.pre, pole: [1, -0.8, 0.3], ease: "inOutSine" },
			{ f: K.load, pole: [1, -0.9, 0.35], ease: "inQuad" },
			{ f: K.hit, pole: [0.35, -1, 0.15], ease: "outQuad" },
			{ f: K.over, pole: [0.4, -1, -0.25], ease: "inQuad" },
			{ f: K.mid, pole: [0.45, -1, 0], ease: "outQuad" },
			{ f: K.guard, pole: [0.5, -1, 0.1], ease: "linear" },
			{ f: K.end, pole: [0.5, -1, 0.1], ease: "linear" },
		],
	},
	legs: {
		Left: [
			leadIdle(0, "inOutSine"),
			leadIdle(K.load, "inQuad"),
			leadHeel(K.hit, -10, "outQuad"),
			leadHeel(K.over, -22, "inOutSine"),
			leadHeel(K.hold, -20, "inOutSine"),
			leadIdle(K.guard, "linear"),
			leadIdle(K.end, "linear"),
		],
		Right: [
			rearIdle(0, "inOutSine"),
			rearIdle(K.load, "inQuad"),
			rearPivot(K.hit, body.rhit, -36, "outQuad"),
			Object.assign(rearPivot(K.over, body.rover, -46, "inOutSine"), { pole: [-0.25, 0, -1] }),
			Object.assign(rearPivot(K.hold, body.rover, -44, "inOutSine"), { pole: [-0.25, 0, -1] }),
			rearIdle(K.guard, "linear"),
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
