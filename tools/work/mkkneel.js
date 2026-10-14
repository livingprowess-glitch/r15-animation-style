// usage: node mkkneel.js [exaggeration=1] [name=Boxing_Knockdown_Kneel] [tune.json]
// Looped hurt kneel (rear knee down, lead foot planted, lead forearm on the lead knee, rear glove hanging to the canvas)
// with heavy breathing. Exaggeration x scales every pose deviation away from an upright kneel and the breathing size.
const fs = require("fs");
const x = Number(process.argv[2] || 1);
const name = process.argv[3] || "Boxing_Knockdown_Kneel";
const tune = Object.assign({
	hipY: -1.35, hipZ: 0.12,
	leadAnkle: [-0.55, -2.929, -1.1], leadYaw: 8,
	rearAnkle: [0.55, -2.6, 1.05], rearPitch: -75, rearYaw: -10,
	leadHand: [-0.5, -1.55, -1.05], rearHand: [0.85, -2.95, 0.0], rearHang: [1.1, -12, -2.6], rearReach: 1.7, sideRoot: -6, sideWaist: -4, waistYaw: 0, foldExtra: 0,
}, process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : {});
const BS = tune.breathScale || 1;
const END = Math.round(120 * BS);
const bf = f => Math.round(f * BS);
const r = v => +v.toFixed(3);

const pose = {
	root: [-5 - 14 * x, -12 - 4 * x, tune.sideRoot * x, 0, tune.hipY, tune.hipZ],
	waist: [-6 - (16 + tune.foldExtra) * x, 6 + tune.waistYaw * x, tune.sideWaist * x],
	neck: [26 - 10 * x, 4, 2 * x - 0.5 * (tune.sideRoot + tune.sideWaist) * x],
};
const breath = [
	{ f: 0, b: 0, s: 0 }, { f: bf(22), b: 1, s: 0.4 }, { f: bf(60), b: 0, s: 0.7 },
	{ f: bf(80), b: 0.85, s: 0.2 }, { f: END, b: 0, s: 0 },
];
const B = { rootY: 0.03 * x, rootX: 1.5 * x, waistX: 3 * x, neckX: -2 * x, sway: 1.5 * x };
const key = (f, v, ease) => `\t\t{ ${f === END ? "LAST_FRAME" : f}, ${v.slice(0, 3).map(r).join(", ")}, "${ease}"${v.length > 3 ? ", " + v.slice(3).map(r).join(", ") : ""} },`;
const block = (part, fn) => [`\t${part} = {`, ...breath.map(k => key(k.f, fn(k), "inOutSine")), "\t},"].join("\n");
const tpl = "const TRACKS: { [string]: { Key } } = {\n"
	+ block("LowerTorso", k => [pose.root[0] - B.rootX * k.b, pose.root[1] + B.sway * Math.sin(k.s * Math.PI), pose.root[2], pose.root[3], pose.root[4] + B.rootY * k.b, pose.root[5]]) + "\n"
	+ block("UpperTorso", k => [pose.waist[0] + B.waistX * k.b, pose.waist[1], pose.waist[2] - B.sway * 0.5 * Math.sin(k.s * Math.PI)]) + "\n"
	+ block("Head", k => [pose.neck[0] + B.neckX * k.b, pose.neck[1], pose.neck[2]]) + "\n"
	+ fs.readFileSync(__dirname + "/jab_v1.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {");
fs.writeFileSync(__dirname + `/${name}.tpl`, tpl);

const hold = (pos, pole) => [{ f: 0, pos, pole, world: true, ease: "linear" }, { f: END, pos, pole, world: true, ease: "linear" }];
const spec = {
	lastFrame: END,
	arms: {
		Left: hold(tune.leadHand, [-1, -0.4, 0.1]),
		Right: [0, END].map(f => ({ f, aim: tune.rearHang, reach: tune.rearReach, pole: [0.3, 0, 1], ease: "linear" })),
	},
	legs: {
		Left: [0, END].map(f => ({ f, pos: tune.leadAnkle, pole: [0, 0.3, -1], yaw: tune.leadYaw, pitch: 0, ease: "linear" })),
		Right: [0, END].map(f => ({ f, pos: tune.rearAnkle, pole: [0, -0.2, -1], yaw: tune.rearYaw, pitch: tune.rearPitch, ease: "linear" })),
	},
};
fs.writeFileSync(__dirname + `/${name}_ik.json`, JSON.stringify(spec, null, "\t"));
fs.writeFileSync(__dirname + `/${name}.json`, JSON.stringify({
	name, label: `Knockdown kneel x${x}`, lastFrame: END, loop: true, priority: "Action", markers: {},
	header: [`Hurt kneel loop (rear knee down), exaggeration x${x}. Pose guide: a knockdown-count photo reference.`],
}, null, "\t"));
console.log(`${name} spec written, x${x}`);
