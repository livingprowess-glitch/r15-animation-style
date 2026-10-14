// Rewrites hip keys so each thigh keeps an intended WORLD orientation while the pelvis (LowerTorso) rotates.
// usage: node footlock.js <tracks.tpl> <stance.json> <out.lua> <lastFrame>
// stance.json: { "LeftUpperLeg": [[frame, x, y, z], ...], "RightUpperLeg": [...] }  world-space intent per key
const fs = require("fs");
const [, , tplFile, stanceFile, outFile, lastArg] = process.argv;
let src = fs.readFileSync(tplFile, "utf8");
const stance = JSON.parse(fs.readFileSync(stanceFile, "utf8"));
const D = Math.PI / 180;

const rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const ry = a => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const mul = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
const tr = A => A[0].map((_, j) => A.map(r => r[j]));
const euler = (x, y, z) => mul(mul(rx(x * D), ry(y * D)), rz(z * D));
const toXYZ = M => {
	const y = Math.asin(Math.max(-1, Math.min(1, M[0][2])));
	const x = Math.atan2(-M[1][2], M[2][2]);
	const z = Math.atan2(-M[0][1], M[0][0]);
	return [x / D, y / D, z / D];
};

const EASE = {
	linear: x => x, inQuad: x => x * x, outQuad: x => 1 - (1 - x) ** 2, outCubic: x => 1 - (1 - x) ** 3,
	inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2, inOutCubic: x => x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2,
	outBack: x => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
};
const block = name => {
	const m = src.match(new RegExp(`\\t${name} = \\{([\\s\\S]*?)\\n\\t\\},`));
	return m[1].split("\n").map(l => l.match(/\{\s*([^{}]+)\}/)).filter(Boolean).map(m => m[1].split(",").map(s => s.trim().replace(/"/g, "")));
};
const lastFrame = Number((src.match(/LAST_FRAME = (\d+)/) || [])[1]);
const rootKeys = block("LowerTorso").map(k => ({ f: k[0] === "LAST_FRAME" ? NaN : Number(k[0]), r: [Number(k[1]), Number(k[2]), Number(k[3])], ease: k[4] }));
const sample = (keys, f) => {
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i], b = keys[i + 1];
		if (f <= b.f) { const t = EASE[a.ease]((f - a.f) / (b.f - a.f)); return a.r.map((v, j) => v + (b.r[j] - v) * t); }
	}
	return keys[keys.length - 1].r;
};
const stanceSample = (list, f) => {
	for (let i = 0; i < list.length - 1; i++) {
		const a = list[i], b = list[i + 1];
		if (f <= b[0]) { const t = (f - a[0]) / (b[0] - a[0]); return [1, 2, 3].map(j => a[j] + (b[j] - a[j]) * t); }
	}
	return list[list.length - 1].slice(1);
};

for (const [leg, list] of Object.entries(stance)) {
	const lines = rootKeys.map(k => {
		const f = isNaN(k.f) ? lastFrame : k.f;
		const R = euler(...sample(rootKeys.map(x => ({ ...x, f: isNaN(x.f) ? lastFrame : x.f })), f));
		const W = euler(...stanceSample(list, f));
		const h = toXYZ(mul(tr(R), W)).map(v => Math.round(v * 10) / 10);
		return `\t\t{ ${isNaN(k.f) ? "LAST_FRAME" : k.f}, ${h.join(", ")}, "${k.ease}" },`;
	});
	src = src.replace(`__${leg}__`, lines.join("\n"));
}
fs.writeFileSync(outFile, src);
console.log("footlocked", Object.keys(stance).join(", "));
