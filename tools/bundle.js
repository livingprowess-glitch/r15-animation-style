// usage: node bundle.js <AnimReader.lua> <data module .lua> <out .lua>
// Produces a builder script that mkverify.js / mkcheck.js accept (buildSequence() above a -- PLAYBACK line).
const fs = require("fs");
const [, , readerFile, dataFile, outFile] = process.argv;
const reader = fs.readFileSync(readerFile, "utf8");
const data = fs.readFileSync(dataFile, "utf8");
fs.writeFileSync(outFile, `local AnimReader = (function()
${reader}
end)()
local DATA = (function()
${data}
end)()
function buildSequence()
	return AnimReader.build(DATA)
end
-- PLAYBACK
`);
console.log("bundled", outFile);
