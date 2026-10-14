// usage: node armroll.js <posedump.json> <Left|Right>  -> per frame: elbow bend direction around the arm axis (roll) and its change
const fs = require("fs");
const D = 180 / Math.PI;
const [, , file, side] = process.argv;
let prev = null;
for (const pose of JSON.parse(fs.readFileSync(file, "utf8"))) {
	const ua = pose.parts[side + "UpperArm"];
	const axis = [ua.r[3], ua.r[4], ua.r[5]];
	const hinge = [ua.r[0], ua.r[1], ua.r[2]];
	const up = [0, 1, 0], dot = axis[1];
	const ref = up.map((v, i) => v - axis[i] * dot); const rn = Math.hypot(...ref);
	const refN = ref.map(v => v / rn);
	const cross = [axis[1] * refN[2] - axis[2] * refN[1], axis[2] * refN[0] - axis[0] * refN[2], axis[0] * refN[1] - axis[1] * refN[0]];
	const roll = Math.atan2(hinge[0] * cross[0] + hinge[1] * cross[1] + hinge[2] * cross[2], hinge[0] * refN[0] + hinge[1] * refN[1] + hinge[2] * refN[2]) * D;
	let d = prev === null ? 0 : roll - prev; if (d > 180) d -= 360; if (d < -180) d += 360;
	console.log(`f${pose.frame} roll ${roll.toFixed(0)}° (change ${d >= 0 ? "+" : ""}${d.toFixed(0)}°)`);
	prev = roll;
}
