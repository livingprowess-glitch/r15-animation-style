const g = require("../geometry.json").joints;
const [, , file, frame = "0"] = process.argv;
const p = require(require("path").resolve(file)).find(q => q.frame === Number(frame)).parts;
const ap = (part, l) => [0, 1, 2].map(i => part.p[i] + part.r[i] * l[0] + part.r[3 + i] * l[1] + part.r[6 + i] * l[2]);
const sh = ap(p.RightUpperArm, g.RightUpperArm.c1), hand = p.RightHand.p, hip = ap(p.RightUpperLeg, g.RightUpperLeg.c1);
console.log(`f${frame} rear glove: ${(sh[1] - hand[1]).toFixed(2)} below its shoulder, ${(hip[1] - hand[1]).toFixed(2)} below its hip, glove bottom ${(hand[1] - 0.158 + 3.152).toFixed(2)} above the floor | shoulder y ${sh[1].toFixed(2)}`);
