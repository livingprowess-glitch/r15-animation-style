const fs = require("fs");
const [, , file, ...frames] = process.argv;
const FLOOR = -3.152;
for (const pose of JSON.parse(fs.readFileSync(file, "utf8"))) {
	if (!frames.includes(String(pose.frame))) continue;
	const low = Object.entries(pose.parts).map(([n, { p, r, s }]) => {
		let m = Infinity;
		for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) m = Math.min(m, p[1] + r[1] * a * s[0] / 2 + r[4] * b * s[1] / 2 + r[7] * c * s[2] / 2);
		return [n, m - FLOOR];
	}).filter(([, h]) => h < 0.35).sort((a, b) => a[1] - b[1]);
	console.log(`f${pose.frame} parts within 0.35 of the floor (negative = below): ` + low.map(([n, h]) => `${n} ${h.toFixed(2)}`).join(", "));
}
