const g = require("../geometry.json").joints;
const [, , file, side = "Right", frame = "0"] = process.argv;
const p = require(require("path").resolve(file)).find(q => q.frame === Number(frame)).parts;
const ap = (part, l) => [0, 1, 2].map(i => part.p[i] + part.r[i] * l[0] + part.r[3 + i] * l[1] + part.r[6 + i] * l[2]);
const sh = ap(p[side + "UpperArm"], g[side + "UpperArm"].c1), el = ap(p[side + "LowerArm"], g[side + "LowerArm"].c1), wr = ap(p[side + "Hand"], g[side + "Hand"].c1);
const a = sh.map((v, i) => v - el[i]), b = wr.map((v, i) => v - el[i]);
const ang = Math.acos((a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b)) * 180 / Math.PI;
const d = wr.map((v, i) => v - sh[i]);
console.log(`f${frame} ${side} elbow ${ang.toFixed(0)}° (180 = straight) | shoulder-to-wrist ${Math.hypot(...d).toFixed(2)} | arm off vertical ${(Math.acos(-d[1] / Math.hypot(...d)) * 180 / Math.PI).toFixed(0)}°`);
