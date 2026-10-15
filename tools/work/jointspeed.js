// per-frame local rotation change (deg) of every part relative to its parent, over a frame range
const fs = require("fs");
const [, , file, from, to] = process.argv;
const poses = JSON.parse(fs.readFileSync(file, "utf8")).sort((a, b) => a.frame - b.frame);
const PARENT = { LowerTorso: null, UpperTorso: "LowerTorso", Head: "UpperTorso", LeftUpperArm: "UpperTorso", LeftLowerArm: "LeftUpperArm", LeftHand: "LeftLowerArm", RightUpperArm: "UpperTorso", RightLowerArm: "RightUpperArm", RightHand: "RightLowerArm", LeftUpperLeg: "LowerTorso", LeftLowerLeg: "LeftUpperLeg", LeftFoot: "LeftLowerLeg", RightUpperLeg: "LowerTorso", RightLowerLeg: "RightUpperLeg", RightFoot: "RightLowerLeg" };
const M = r => [[r[0], r[3], r[6]], [r[1], r[4], r[7]], [r[2], r[5], r[8]]];
const mul = (a, b) => a.map((row, i) => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
const T = a => [0, 1, 2].map(i => [0, 1, 2].map(j => a[j][i]));
const local = (pose, n) => { const m = M(pose.parts[n].r); const p = PARENT[n]; return p ? mul(T(M(pose.parts[p].r)), m) : m; };
const angle = (a, b) => { const r = mul(T(a), b); return Math.acos(Math.max(-1, Math.min(1, (r[0][0] + r[1][1] + r[2][2] - 1) / 2))) * 180 / Math.PI; };
const names = Object.keys(PARENT);
const rows = {};
for (let i = 1; i < poses.length; i++) {
	const f = poses[i].frame; if (f < +from || f > +to) continue;
	rows[f] = names.map(n => angle(local(poses[i - 1], n), local(poses[i], n)));
}
console.log("frame " + names.map(n => n.replace(/(Left|Right)/, m => m[0]).replace("Upper", "U").replace("Lower", "L").padStart(7)).join(""));
for (const f of Object.keys(rows)) console.log(String(f).padStart(5) + " " + rows[f].map(v => v.toFixed(1).padStart(7)).join(""));
