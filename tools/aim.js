// usage: node aim.js <posedump.json> <Left|Right> <reach> <dx> <dy> <dz>
// For each dumped frame: hand target in UpperTorso space so the arm points from its shoulder at an aim point
// = head + (dx, dy, dz) in root space, extended to <reach> studs from the shoulder pivot.
const fs = require("fs");
const [, , file, side, reachArg, dx, dy, dz] = process.argv;
const geo = JSON.parse(fs.readFileSync(__dirname + "/geometry.json", "utf8")).joints;
const reach = Number(reachArg);
const apply = (part, l) => [0, 1, 2].map(i => part.p[i] + part.r[i] * l[0] + part.r[3 + i] * l[1] + part.r[6 + i] * l[2]);
for (const pose of JSON.parse(fs.readFileSync(file, "utf8"))) {
	const P = pose.parts, ut = P.UpperTorso, head = P.Head.p;
	const shoulder = apply(P[side + "UpperArm"], geo[side + "UpperArm"].c1);
	const aimPt = [head[0] + Number(dx), head[1] + Number(dy), head[2] + Number(dz)];
	const d = aimPt.map((v, i) => v - shoulder[i]); const n = Math.hypot(...d);
	const world = shoulder.map((v, i) => v + d[i] / n * reach);
	const rel = world.map((v, i) => v - ut.p[i]);
	const local = [0, 1, 2].map(a => rel[0] * ut.r[a * 3] + rel[1] * ut.r[a * 3 + 1] + rel[2] * ut.r[a * 3 + 2]);
	console.log(JSON.stringify({ frame: pose.frame, world: world.map(v => +v.toFixed(3)), local: local.map(v => +v.toFixed(3)) }));
}
