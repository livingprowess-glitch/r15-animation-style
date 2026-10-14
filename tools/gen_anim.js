const fs = require("fs");
const [, , tracksFile, configFile, outFile] = process.argv;
const cfg = JSON.parse(fs.readFileSync(configFile, "utf8"));
let s = fs.readFileSync(__dirname + "/../reference/kiai_burst.server.lua", "utf8");
const a = s.indexOf("const TRACKS"), b = s.indexOf("-- Euler (degrees");
s = s.slice(0, a) + fs.readFileSync(tracksFile, "utf8") + s.slice(b);
const h0 = s.indexOf("--[["), h1 = s.indexOf("]]") + 2;
s = s.slice(0, h0) + "--[[\n" + cfg.header.map(l => "\t" + l).join("\n") + "\n]]" + s.slice(h1);
const rep = (x, y) => { if (!s.includes(x)) throw new Error("missing " + x); s = s.replace(x, y); };
rep("const LAST_FRAME = 72", `const LAST_FRAME = ${cfg.lastFrame}`);
rep(`sequence.Name = "Kiai_Burst"`, `sequence.Name = "${cfg.name}"`);
rep("sequence.Loop = false", `sequence.Loop = ${cfg.loop}`);
if (cfg.priority) rep("sequence.Priority = Enum.AnimationPriority.Action", `sequence.Priority = Enum.AnimationPriority.${cfg.priority}`);
const markers = Object.keys(cfg.markers || {}).length === 0 ? "" : Object.entries(cfg.markers).map(([f, n], i) => `\t\t${i ? "elseif" : "if"} frame == ${f} then\n\t\t\tkeyframe.Name = "${n}"`).join("\n") + "\n\t\tend";
rep(`		if frame == 30 then
			keyframe.Name = "Release"
		elseif frame == 52 then
			keyframe.Name = "Settle"
		end`, markers);
rep(`assert(rig, "Kiai Burst: put`, `assert(rig, "${cfg.label}: put`);
rep("print(`Kiai Burst saved", "print(`" + cfg.label + " saved");
fs.writeFileSync(outFile, s);
console.log("written", outFile);
