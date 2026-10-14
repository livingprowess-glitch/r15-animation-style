// usage: node script2data.js <generated .server.lua> <out data module .lua>
// Turns a builder script (Kiai template) into an AnimReader data module: tracks, name, loop, markers, lastFrame.
const fs = require("fs");
const [, , inFile, outFile] = process.argv;
const s = fs.readFileSync(inFile, "utf8");
const lastFrame = Number(s.match(/const LAST_FRAME = (\d+)/)[1]);
const fps = Number((s.match(/const FPS = (\d+)/) || [0, 60])[1]);
const name = s.match(/sequence\.Name = "([^"]+)"/)[1];
const loop = s.match(/sequence\.Loop = (true|false)/)[1];
const priority = (s.match(/sequence\.Priority = (Enum\.AnimationPriority\.\w+)/) || [0, "Enum.AnimationPriority.Action"])[1];
const markers = [...s.matchAll(/frame == (\d+) then\s*\n\s*keyframe\.Name = "([^"]+)"/g)].map(m => `[${m[1]}] = "${m[2]}"`);
const a = s.indexOf("const TRACKS");
const open = s.indexOf("{", s.indexOf("=", a));
let depth = 0, end = open;
for (; end < s.length; end++) {
	if (s[end] === "{") depth++;
	else if (s[end] === "}") { depth--; if (depth === 0) break; }
}
const tracks = s.slice(open, end + 1)
	.split("\n").filter(l => !/^\s*--/.test(l)).join("\n")
	.replace(/LAST_FRAME/g, String(lastFrame))
	.replace(/\n/g, "\n\t");
const out = `return {
	name = "${name}",
	fps = ${fps},
	lastFrame = ${lastFrame},
	loop = ${loop},
	priority = ${priority},
	markers = { ${markers.join(", ")} },
	tracks = ${tracks},
}
`;
fs.writeFileSync(outFile, out);
console.log("data module", outFile, "frames", lastFrame + 1);
