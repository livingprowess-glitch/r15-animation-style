// usage: node setease.js <mk*.js> <L|R> <ease>  -> sets the punching arm's load-key easing
const fs = require("fs");
const [, , file, arm, ease] = process.argv;
let s = fs.readFileSync(file, "utf8");
const re = new RegExp("(" + arm + "\\(K\\.load, \\[[^\\]]+\\], \")[a-zA-Z]+\"");
if (!re.test(s)) throw new Error("load key not found for " + arm);
s = s.replace(re, "$1" + ease + "\"");
fs.writeFileSync(file, s);
