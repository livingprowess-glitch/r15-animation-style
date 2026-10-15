// usage: node mkover.js <variant.json> <name>
// Overhand right, parameterised: every key is guard + e * (house delta + style add). Style may override the guard.
// variant: { e, label, guard?: {root, waist, neck, lHand, rHand, lead, rear}, add?: {root|waist|neck: {load,hit,over,hold}},
//            hand?: {chamber, apex, over, hold, mid}, aim?, reach?, lLoad?, lHit?, rearPivot?: {hit:[yaw,pitch], over:[yaw,pitch]} }
const fs = require("fs");
const D = Math.PI / 180;
const [, , specFile, name] = process.argv;
const V = JSON.parse(fs.readFileSync(specFile, "utf8"));
const e = V.e ?? 1;
const r3 = v => v.map(x => +x.toFixed(3));

const G = Object.assign({
	root: [-1, -24, 1, 0.02, -0.18, 0.43], waist: [-4, 9, -1], neck: [-7, 15, 0.5],
	lHand: [-0.74, 1.14, -1.14], rHand: [0.62, 1.1, -1.06],
	lead: { pos: [-0.52, -2.89, -0.55], yaw: 3, pitch: -4, pole: [0, 0, -1] },
	rear: { pos: [0.56, -2.825, 0.75], yaw: -35, pitch: -12, pole: [0.57, 0, -0.82] },
}, V.guard || {});

const DELTA = {
	root: { load: [-2, -14, -6, 0.04, -0.2, 0.1], hit: [-12, 52, 8, -0.06, -0.16, -0.18], hold: [-19, 66, 10, -0.08, -0.25, -0.18] },
	waist: { load: [-2, -22, -8], hit: [-10, 12, 8], hold: [-15, 19, 10] },
	neck: { load: [4, 36, 6], hit: [2, -62, -4], hold: [6, -76, -6] },
};
const add = (a, b) => a.map((v, i) => v + (b?.[i] || 0));
const hitScale = 1 + 0.35 * (e - 1);
const scaled = (part, phase) => {
	const d = p => add(DELTA[part][p], V.add?.[part]?.[p]);
	const dl = d("load"), dh = d("hit"), dd = d("hold");
	const ch = i => (i >= 3 ? Math.min(e, 1.8) : i === 1 ? Math.min(e, 1.5) : Math.min(e, 2.2));
	const chh = i => (i >= 3 ? Math.min(hitScale, 1.8) : i === 1 ? Math.min(hitScale, 1.2) : hitScale);
	const v = phase === "load" ? dl.map((x, i) => ch(i) * x)
		: phase === "hit" ? dh.map((x, i) => chh(i) * x)
		: dh.map((x, i) => chh(i) * x + ch(i) * (dd[i] - x));
	return G[part].map((g, i) => g + v[i]);
};
const body = {};
for (const phase of ["load", "hit", "hold"]) {
	const root = scaled("root", phase), waist = scaled("waist", phase), neck = scaled("neck", phase);
	const hi = G.root[1] + 74, lo = G.root[1] - 26;
	const excess = root[1] > hi ? root[1] - hi : root[1] < lo ? root[1] - lo : 0;
	root[1] -= excess;
	waist[1] += excess;
	body[phase] = { root: r3(root), waist: r3(waist), neck: r3(neck) };
}

const W = Math.round(14 + 6 * (e - 1));
const K = {};
K.load = W;
const strike = 6 + Math.round(2.5 * (e - 1));
K.apex = K.load + Math.round(strike / 2);
K.hit = K.load + strike;
K.over = K.hit + Math.round(11 + 7 * (e - 1)) + (V.ftExtra || 0);
K.hold = K.over + Math.round(10 + 4 * (e - 1));
K.mid = K.over + Math.round(24 + 14 * (e - 1));
K.guard = K.mid + Math.round(18 + 10 * (e - 1));
K.end = K.guard + 16;

const fmt = (f, v, ease) => `\t\t{ ${f}, ${v.slice(0, 3).join(", ")}, "${ease}"${v.length > 3 ? ", " + v.slice(3).join(", ") : ""} },`;
const block = (part, title) => [
	`\t${title} = {`,
	fmt(0, G[part], "inOutSine"),
	fmt(K.load, body.load[part], "inQuad"),
	fmt(K.hit, body.hit[part], "outQuad"),
	fmt(K.hold, body.hold[part], "inOutSine"),
	fmt("LAST_FRAME", G[part], "linear"),
	"\t},",
].join("\n");
fs.writeFileSync(__dirname + `/${name}.tpl`, "const TRACKS: { [string]: { Key } } = {\n" + block("root", "LowerTorso") + "\n" + block("waist", "UpperTorso") + "\n" + block("neck", "Head") + "\n"
	+ fs.readFileSync(__dirname + "/jab_v1.tpl", "utf8").split("\tLeftUpperArm = {")[1].replace(/^/, "\tLeftUpperArm = {"));

const H = Object.assign({ chamber: [1.03, 1.5, -0.35], apex: [1.0, 1.75, -1.25], over: [0.35, 0.1, -1.55] }, V.hand || {});
const toward = (p, k) => r3(G.rHand.map((g, i) => g + k * (p[i] - g)));
const ke = Math.min(e, 1.3);
const BALL = 0.42;
const dir = y => [-Math.sin(y * D), 0, -Math.cos(y * D)];
const rd0 = dir(G.rear.yaw);
const rearBall = [G.rear.pos[0] + BALL * Math.cos(G.rear.pitch * D) * rd0[0], G.rear.pos[2] + BALL * Math.cos(G.rear.pitch * D) * rd0[2]];
const rearIdle = (f, ease) => ({ f, pos: G.rear.pos, pole: G.rear.pole, yaw: G.rear.yaw, pitch: G.rear.pitch, ease });
const rearPivot = (f, yaw, pitch, ease, pole) => {
	const d = dir(yaw), r = BALL * Math.cos(pitch * D);
	return { f, pos: r3([rearBall[0] - r * d[0], G.rear.pos[1] - 0.104 + 0.5 * Math.sin(Math.abs(pitch) * D), rearBall[1] - r * d[2]]), pole: pole || r3(d), yaw, pitch, ease };
};
const leadIdle = (f, ease) => ({ f, pos: G.lead.pos, pole: G.lead.pole, yaw: G.lead.yaw, pitch: G.lead.pitch, ease });
const P = V.rearPivot || { hit: [0, -36], over: [4, -44] };
const aim = V.aim || [-0.15, 0.95, -3.9];
const reach = V.reach || 1.72;

const spec = {
	lastFrame: K.end,
	arms: {
		Left: [
			{ f: 0, pos: G.lHand, pole: [-0.5, -1, 0.1], ease: "inOutSine" },
			{ f: K.load, pos: V.lLoad || add(G.lHand, [-0.06, 0.06, -0.14]), pole: [-0.5, -1, 0.1], ease: "inQuad" },
			{ f: K.hit, pos: V.lHit || add(G.lHand, [0.18, 0.16, 0.12]), pole: [-0.6, -1, 0.2], ease: "outQuad" },
			{ f: K.hold, pos: V.lHit || add(G.lHand, [0.18, 0.16, 0.12]), pole: [-0.6, -1, 0.2], ease: "inOutSine" },
			{ f: K.guard, pos: G.lHand, pole: [-0.5, -1, 0.1], ease: "linear" },
			{ f: K.end, pos: G.lHand, pole: [-0.5, -1, 0.1], ease: "linear" },
		],
		Right: [
			{ f: 0, pos: G.rHand, pole: [0.5, -1, 0.1], ease: "inOutSine" },
			{ f: K.load, pos: toward(H.chamber, ke), pole: [1, 0.5, 0.3], ease: "inQuad" },
			{ f: K.apex, pos: H.apex, pole: V.poles?.apex || [0.85, 0.7, 0.1], ease: "linear" },
			{ f: K.hit, aim, reach, pole: V.poles?.hit || [0.7, 0.7, 0.15], ease: "outQuad", lerp: V.lerp || e > 2 },
			{ f: K.over, pos: H.over, lerp: V.lerp || e > 2, pole: V.poles?.over || [0.7, 0.7, 0.15], ease: "inOutSine" },
			{ f: K.guard, pos: G.rHand, pole: [0.5, -1, 0.1], ease: "linear" },
			{ f: K.end, pos: G.rHand, pole: [0.5, -1, 0.1], ease: "linear" },
		],
	},
	legs: {
		Left: [leadIdle(0, "linear"), leadIdle(K.end, "linear")],
		Right: [
			rearIdle(0, "inOutSine"),
			rearIdle(K.load, "inQuad"),
			rearPivot(K.hit, P.hit[0], P.hit[1], "outQuad"),
			rearPivot(K.hold, P.over[0], P.over[1], "inOutSine", [-0.2, 0, -1]),
			rearIdle(K.guard, "linear"),
			rearIdle(K.end, "linear"),
		],
	},
};
fs.writeFileSync(__dirname + `/${name}_ik.json`, JSON.stringify(spec, null, "\t"));
fs.writeFileSync(__dirname + `/${name}.json`, JSON.stringify({
	name, label: V.label || name, lastFrame: K.end, loop: false, priority: "Action", markers: { [K.hit]: "Hit" },
	header: [`Overhand right, ${V.label || name} (e ${e}).`],
}, null, "\t"));
console.log(`${name}: ${JSON.stringify(K)}`);
