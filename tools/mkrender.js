// usage: node mkrender.js <builder script or bundle .lua> <frames comma list> -> writes posedump_run.lua
const fs = require("fs");
const [, , file, frames] = process.argv;
const src = fs.readFileSync(file, "utf8");
const builder = src.split("-- PLAYBACK")[0] + "\nreturn buildSequence()";
if (builder.includes("]======]")) throw new Error("delimiter clash");
const tpl = fs.readFileSync(__dirname + "/posedump.lua", "utf8");
fs.writeFileSync(__dirname + "/posedump_run.lua", tpl.replace("__BUILDER__", () => builder).replace("__FRAMES__", frames));
console.log("posedump_run.lua ready");
