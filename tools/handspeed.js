const fs = require("fs");
const [, , file, side = "Right", hitArg] = process.argv;
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const frames = (d.frames || d).slice().sort((a, b) => a.frame - b.frame);
const hit = Number(hitArg);
const part = side + "Hand";
const sp = [];
for (let i = 1; i < frames.length; i++) {
	const a = frames[i - 1], b = frames[i];
	if (b.frame - a.frame !== 1) continue;
	const p = a.parts[part].p, q = b.parts[part].p;
	sp.push({ f: b.frame, v: Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) * 60 });
}
const strike = sp.filter(s => s.f <= hit + 2);
const after = sp.filter(s => s.f > hit + 2);
const peak = arr => arr.reduce((m, s) => (s.v > m.v ? s : m), { f: -1, v: 0 });
const ps = peak(strike), pr = peak(after);
let worst4 = { f: -1, d: 0 };
for (let i = 0; i + 4 < frames.length; i++) {
	const a = frames[i], b = frames[i + 4];
	if (a.frame <= hit + 2 || b.frame - a.frame !== 4) continue;
	const p = a.parts[part].p, q = b.parts[part].p, dd = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
	if (dd > worst4.d) worst4 = { f: a.frame, d: dd };
}
const ratio = pr.v / ps.v;
console.log(`${side} hand: strike peak ${ps.v.toFixed(1)} studs/s at f${ps.f} | pullback peak ${pr.v.toFixed(1)} studs/s at f${pr.f} (${(ratio * 100).toFixed(0)}% of strike) | most travel in any 4 pullback frames ${worst4.d.toFixed(2)} studs from f${worst4.f}`);
console.log(ratio > 0.45 || worst4.d > 0.6 ? "SNAP: pullback too fast (limit 45% of strike peak, 0.6 studs per 4 frames)" : "pullback OK");
