const [, , file, side = "Right", from = "18", to = "34"] = process.argv;
const d = require(require("path").resolve(file)).sort((a, b) => a.frame - b.frame);
const M3 = r => [[r[0], r[3], r[6]], [r[1], r[4], r[7]], [r[2], r[5], r[8]]];
const mul = (a, b) => a.map(row => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
const T = a => [0, 1, 2].map(i => [0, 1, 2].map(j => a[j][i]));
let prev = null;
for (let i = 1; i < d.length; i++) {
	const f = d[i].frame; if (f < +from || f > +to) continue;
	const p = d[i].parts[side + "Hand"].p, q = d[i - 1].parts[side + "Hand"].p, v = p.map((x, k) => x - q[k]), sp = Math.hypot(...v);
	let turn = "";
	if (prev && sp > 1e-4 && Math.hypot(...prev) > 1e-4) turn = (Math.acos(Math.max(-1, Math.min(1, (v[0] * prev[0] + v[1] * prev[1] + v[2] * prev[2]) / sp / Math.hypot(...prev)))) * 180 / Math.PI).toFixed(0) + "°";
	const el = mul(T(M3(d[i].parts[side + "UpperArm"].r)), M3(d[i].parts[side + "LowerArm"].r));
	console.log(`f${f} fist ${p.map(x => x.toFixed(3)).join(",")} speed ${sp.toFixed(3)} dir change ${turn.padStart(4)} elbow bend ${(Math.acos(Math.max(-1, Math.min(1, el[1][1]))) * 180 / Math.PI).toFixed(1)}`);
	prev = v;
}
