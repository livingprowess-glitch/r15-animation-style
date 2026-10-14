// usage: node legcheck.js <posedump.json> -> per leg: knee bend, knee direction vs toe direction, knee height
const fs = require("fs");
const D = 180 / Math.PI;
const geo = JSON.parse(fs.readFileSync(__dirname + "/geometry.json", "utf8")).joints;
const apply = (part, local) => [0, 1, 2].map(i => part.p[i] + part.r[i] * local[0] + part.r[3 + i] * local[1] + part.r[6 + i] * local[2]);
for (const pose of JSON.parse(fs.readFileSync(process.argv[2], "utf8"))) {
	for (const side of ["Left", "Right"]) {
		const ul = pose.parts[side + "UpperLeg"], ll = pose.parts[side + "LowerLeg"], ft = pose.parts[side + "Foot"];
		const hip = apply(ul, geo[side + "UpperLeg"].c1), knee = apply(ll, geo[side + "LowerLeg"].c1), ankle = apply(ft, geo[side + "Foot"].c1);
		const mid = [0, 1, 2].map(i => (hip[i] + ankle[i]) / 2), out = [knee[0] - mid[0], knee[2] - mid[2]];
		const kneeYaw = Math.atan2(-out[0], -out[1]) * D;
		const fwd = [-ft.r[6], -ft.r[7], -ft.r[8]].map(v => -v);
		const toeYaw = Math.atan2(-fwd[0], -fwd[2]) * D;
		const a = [hip[0] - knee[0], hip[1] - knee[1], hip[2] - knee[2]], b = [ankle[0] - knee[0], ankle[1] - knee[1], ankle[2] - knee[2]];
		const ang = Math.acos((a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b)) * D;
		const thighPitch = Math.atan2(Math.hypot(knee[0] - hip[0], knee[2] - hip[2]), hip[1] - knee[1]) * D;
		console.log(`f${pose.frame} ${side.padEnd(5)} knee angle ${ang.toFixed(0)}° (180 = straight) | thigh off vertical ${thighPitch.toFixed(0)}° | knee points yaw ${kneeYaw.toFixed(0)}° vs toes ${toeYaw.toFixed(0)}° (diff ${(kneeYaw - toeYaw).toFixed(0)}) | knee height ${knee[1].toFixed(2)} | knee z ${knee[2].toFixed(2)} hip z ${hip[2].toFixed(2)} ankle z ${ankle[2].toFixed(2)}`);
	}
}
