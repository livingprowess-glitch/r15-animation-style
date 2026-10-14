// usage: node templatelegs.js <tracks file> [PartName ...]   (default: LeftUpperLeg RightUpperLeg)
// Replaces each named joint block's keys with a __PartName__ placeholder; adds an empty block if missing.
const fs = require("fs");
const [, , file, ...names] = process.argv;
const parts = names.length ? names : ["LeftUpperLeg", "RightUpperLeg"];
let t = fs.readFileSync(file, "utf8");
for (const part of parts) {
	const head = `\t${part} = {\n`;
	const start = t.indexOf(head);
	if (start < 0) {
		const close = t.lastIndexOf("\n}");
		t = t.slice(0, close) + `\n${head}__${part}__\n\t},` + t.slice(close);
		continue;
	}
	const bodyStart = start + head.length;
	const end = t.indexOf("\n\t},", bodyStart);
	t = t.slice(0, bodyStart) + `__${part}__` + t.slice(end);
}
fs.writeFileSync(file, t);
console.log("templated", parts.join(", "));
