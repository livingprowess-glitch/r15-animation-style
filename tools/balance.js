// usage: node balance.js <posedump.json>  -> centre of mass vs each foot, per dumped frame (mass ~ part volume)
const fs = require("fs");
const poses = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const pose of poses) {
	let m = 0; const c = [0, 0, 0];
	for (const part of Object.values(pose.parts)) { const v = part.s[0] * part.s[1] * part.s[2]; m += v; for (let i = 0; i < 3; i++) c[i] += part.p[i] * v; }
	const com = c.map(v => v / m);
	const L = pose.parts.LeftFoot.p, R = pose.parts.RightFoot.p;
	const seg = [R[0] - L[0], R[2] - L[2]], len2 = seg[0] ** 2 + seg[1] ** 2;
	const t = ((com[0] - L[0]) * seg[0] + (com[2] - L[2]) * seg[1]) / len2;
	console.log(`f${pose.frame} COM (${com.map(v => v.toFixed(2)).join(", ")}) | lead foot (${L[0].toFixed(2)}, ${L[2].toFixed(2)}) rear foot (${R[0].toFixed(2)}, ${R[2].toFixed(2)}) | weight on rear foot ≈ ${Math.round(Math.max(0, Math.min(1, t)) * 100)}% (t=${t.toFixed(2)})`);
}
