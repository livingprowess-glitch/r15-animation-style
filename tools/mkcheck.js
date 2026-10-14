const fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8");
const builder = src.split("-- PLAYBACK")[0] + "\nreturn buildSequence()";
if (builder.includes("]======]")) throw new Error("delimiter clash");
const tpl = fs.readFileSync(__dirname + "/limbcheck.lua", "utf8");
fs.writeFileSync(__dirname + "/check.lua", tpl.replace("__BUILDER__", () => builder));
console.log("check.lua ready");
