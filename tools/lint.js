// usage: node lint.js <AnimationName> [--chain <IdleName>|--no-chain] [--speed <gameSpeed>] [--strike <LeftFoot|...>] [--onion] [--src <anim_reader dir>]
// The striking limb defaults to the hand farthest from the chest at the Hit marker; pass --strike for kicks.
// Runs every gate on an AnimReader data module (as it is on disk) against a fresh rig in Studio and prints one
// pass/fail table. Exit code 1 on any FAIL, so never install while it fails. Pose dump kept at work/lint_<name>.json.
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const M = require("./posemetrics");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const name = args[0];
if (!name) { console.log("usage: node lint.js <AnimationName> [--chain <IdleName>|--no-chain] [--speed <gameSpeed>] [--onion]"); process.exit(2); }
const SRC = opt("--src", "C:/Users/osaya/OneDrive/Documents/nenxiety26/anim_reader");
const T = __dirname, W = path.join(T, "work");
const speed = Number(opt("--speed", "1"));
const modFile = path.join(SRC, "Animations", name + ".lua");
const mod = fs.readFileSync(modFile, "utf8");
const lastFrame = Number(mod.match(/lastFrame\s*=\s*(\d+)/)[1]);
const loop = /loop\s*=\s*true/.test(mod);
const hitM = mod.match(/\[(\d+)\]\s*=\s*"Hit"/);
const hit = hitM ? Number(hitM[1]) : null;
const prefix = name.split("_")[0];
const chain = args.includes("--no-chain") ? null : opt("--chain", prefix === "Boxing" && !loop ? "Boxing_Idle_Orthodox" : null);

const LIMIT = { snapStuds: 0.6, snapWin: 4, snapRatio: 0.45, kneeWarn: 12, kneeFail: 25, rollWarn: 30, rollFail: 50, chainPos: 0.005, chainRot: 0.005, freezeSum: 2, reverseDeg: 75 };

function rbx(file) {
	for (let i = 0; i < 20; i++) {
		const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:/Users/osaya/rbxbridge/rbx.ps1", "-Op", "run", "-File", file, "-TimeoutSec", "180"], { encoding: "utf8", maxBuffer: 1 << 28 });
		const out = (r.stdout || "") + (r.stderr || "");
		if (!out.includes("loadstring() is not available")) {
			if (r.status !== 0) throw new Error("rbxbridge failed: " + out.slice(0, 400));
			return r.stdout;
		}
	}
	throw new Error("rbxbridge: no edit DataModel after 20 tries");
}
const node = (...a) => execFileSync(process.execPath, a, { cwd: T, encoding: "utf8" });
function dump(modulePath, frames, tag) {
	const bundle = path.join(W, `lint_${tag}.lua`);
	node("bundle.js", path.join(SRC, "AnimReader.lua"), modulePath, bundle);
	node("mkrender.js", bundle, frames.join(","));
	const txt = rbx(path.join(T, "posedump_run.lua"));
	const poses = JSON.parse(txt.slice(txt.indexOf("[")));
	return { bundle, poses };
}

const rows = [];
const add = (gate, status, detail) => rows.push({ gate, status, detail });

const all = Array.from({ length: lastFrame + 1 }, (_, i) => i);
const { bundle, poses: raw } = dump(modFile, all, name);
const poses = M.sorted(raw);
fs.writeFileSync(path.join(W, `lint_${name}.json`), JSON.stringify(poses));
const at = f => poses.find(p => p.frame === f);

node("mkcheck.js", bundle);
const limb = rbx(path.join(T, "check.lua"));
const errs = limb.split(/\r?\n/).filter(l => /^ERROR/.test(l)), warns = limb.split(/\r?\n/).filter(l => /^WARN/.test(l));
add("limbs / floor / slide", errs.length ? "FAIL" : warns.length ? "WARN" : "ok", [...errs, ...warns].map(l => l.replace(/\s+/g, " ")).join("\n") || "no limb issues; " + ((limb.match(/foot slide total:.*/) || [""])[0]).trim());

if (loop) {
	const d = M.poseDiff(at(0), at(lastFrame));
	add("loop closes", d.pos > LIMIT.chainPos || d.rot > LIMIT.chainRot ? "FAIL" : "ok", `f0 vs f${lastFrame}: ${d.pos.toFixed(4)} studs, ${d.rot.toFixed(4)} rot`);
}
if (chain) {
	const idleFile = path.join(SRC, "Animations", chain + ".lua");
	const stamp = fs.statSync(idleFile).mtimeMs + ":" + fs.statSync(idleFile).size;
	const cacheFile = path.join(W, `lint_cache_${chain}.json`);
	let cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
	if (!cache || cache.stamp !== stamp) { cache = { stamp, pose: M.sorted(dump(idleFile, [0], chain).poses)[0] }; fs.writeFileSync(cacheFile, JSON.stringify(cache)); }
	const a = M.poseDiff(at(0), cache.pose), b = M.poseDiff(at(lastFrame), cache.pose);
	const bad = Math.max(a.pos, b.pos) > LIMIT.chainPos || Math.max(a.rot, b.rot) > LIMIT.chainRot;
	add(`chains from ${chain}`, bad ? "FAIL" : "ok", `f0 off by ${a.pos.toFixed(4)} studs, f${lastFrame} off by ${b.pos.toFixed(4)} studs`);
}

const bal = poses.map(p => ({ frame: p.frame, t: M.balance(p).t }));
const tMin = bal.reduce((m, b) => (b.t < m.t ? b : m)), tMax = bal.reduce((m, b) => (b.t > m.t ? b : m));
const balStatus = tMin.t < -0.05 || tMax.t > 1.05 ? "FAIL" : tMin.t < 0.1 || tMax.t > 0.9 ? "WARN" : "ok";
add("balance (weight on rear foot)", balStatus, `${Math.round(Math.max(0, tMin.t) * 100)}% (f${tMin.frame}) to ${Math.round(Math.min(1, tMax.t) * 100)}% (f${tMax.frame}); fails if the centre of mass leaves the feet`);

let kneeWorst = { dev: 0 }, locked = [];
for (const p of poses) {
	const l = M.legs(p);
	for (const side of ["Left", "Right"]) {
		if (Math.abs(l[side].kneeOffToe) > Math.abs(kneeWorst.dev || 0)) kneeWorst = { dev: l[side].kneeOffToe, side, frame: p.frame };
		if (l[side].angle > 178) locked.push(`${side}@f${p.frame}`);
	}
}
const kd = Math.abs(kneeWorst.dev || 0);
add("knees follow toes / not locked", kd > LIMIT.kneeFail ? "FAIL" : kd > LIMIT.kneeWarn || locked.length ? "WARN" : "ok",
	`worst knee-vs-toe ${kd.toFixed(0)}°${kneeWorst.side ? ` (${kneeWorst.side} f${kneeWorst.frame})` : ""}${locked.length ? `; locked straight: ${locked.slice(0, 6).join(" ")}` : ""}`);

for (const side of ["Left", "Right"]) {
	const r = M.armRoll(poses, side), w = r.reduce((m, x) => (Math.abs(x.change) > Math.abs(m.change) ? x : m));
	const a = Math.abs(w.change);
	add(`${side} arm twist`, a > LIMIT.rollFail ? "FAIL" : a > LIMIT.rollWarn ? "WARN" : "ok", `max ${a.toFixed(0)}°/frame at f${w.frame}`);
}

const from = hit === null ? 0 : hit + 2;
let striker = null;
if (hit !== null) {
	const hp = at(hit), chest = hp.parts.UpperTorso.p;
	let best = 0;
	for (const part of opt("--strike", null) ? [opt("--strike")] : ["LeftHand", "RightHand"]) {
		const p = hp.parts[part].p, d = Math.hypot(p[0] - chest[0], p[1] - chest[1], p[2] - chest[2]);
		if (d > best) { best = d; striker = part; }
	}
}
const lastPose = at(lastFrame);
const pullbackStart = part => {
	if (hit === null) return from;
	const goal = lastPose.parts[part].p;
	let best = from, far = -1;
	for (const p of poses) {
		if (p.frame < hit || p.frame > hit + 30) continue;
		const q = p.parts[part].p, d = Math.hypot(q[0] - goal[0], q[1] - goal[1], q[2] - goal[2]);
		if (d > far) { far = d; best = p.frame; }
	}
	return Math.max(from, best);
};
for (const part of M.EXTREMITIES) {
	const pfrom = pullbackStart(part);
	const tr = M.travel(poses, part, pfrom, LIMIT.snapWin);
	const after = tr.speed.filter(s => s.frame > pfrom);
	const pkAfter = after.length ? after.reduce((m, s) => (s.v > m.v ? s : m)) : { v: 0, frame: -1 };
	let status = tr.worst.d > LIMIT.snapStuds ? "FAIL" : "ok";
	let detail = `most travel in any 4 frames${hit !== null ? ` after f${pfrom} (pullback start)` : ""}: ${tr.worst.d.toFixed(2)} studs (f${tr.worst.frame})`;
	if (part === striker) {
		const pkStrike = tr.speed.filter(s => s.frame <= pfrom).reduce((m, s) => (s.v > m.v ? s : m));
		const ratio = pkAfter.v / pkStrike.v;
		if (ratio > LIMIT.snapRatio) status = "FAIL";
		detail += `; pullback peak ${Math.round(ratio * 100)}% of strike peak (f${pkAfter.frame} vs f${pkStrike.frame})`;
	}
	if (speed !== 1) {
		const g = M.travel(poses, part, pfrom, Math.round(LIMIT.snapWin * speed));
		detail += `; at game speed x${speed}: ${g.worst.d.toFixed(2)} studs per 4 game frames (info)`;
	}
	add(`${part} pullback snap${part === striker ? " (striking limb)" : ""}`, status, detail);
}

if (hit !== null) {
	const settle = Math.round(hit + (lastFrame - hit) * 0.6);
	const bm = M.bodyMotion(poses).filter(b => b.frame > hit + 1 && b.frame <= settle);
	let run = [], worstRun = [];
	for (const b of bm) { if (b.sum < LIMIT.freezeSum) { run.push(b.frame); if (run.length > worstRun.length) worstRun = run.slice(); } else run = []; }
	const minB = bm.reduce((m, b) => (b.sum < m.sum ? b : m), { sum: Infinity });
	add("no whole-body freeze after the hit", worstRun.length >= 2 ? "FAIL" : "ok", `quietest frame f${minB.frame} (${minB.sum.toFixed(1)}°/f summed over all joints)${worstRun.length >= 2 ? `; frozen f${worstRun[0]}-f${worstRun[worstRun.length - 1]}` : ""} (limit: 2+ frames under ${LIMIT.freezeSum}°/f between f${hit + 2} and f${settle})`);
	if (striker) {
		const tn = M.turns(poses, striker).filter(t => t.frame > hit + 1 && t.speed > 0.002);
		const w = tn.reduce((m, t) => (t.turn > m.turn ? t : m), { turn: 0 });
		add(`${striker} no sudden reversal`, w.turn > LIMIT.reverseDeg ? "FAIL" : "ok", `sharpest path turn after the hit ${w.turn.toFixed(0)}° in one frame (f${w.frame}); limit ${LIMIT.reverseDeg}°`);
	}
}
if (hit !== null) {
	const same = fs.readdirSync(path.join(SRC, "Animations")).filter(f => f.startsWith(prefix + "_") && f !== name + ".lua").filter(f => {
		const m = fs.readFileSync(path.join(SRC, "Animations", f), "utf8").match(/\[(\d+)\]\s*=\s*"Hit"/);
		return m && Number(m[1]) === hit;
	}).map(f => f.replace(/\.lua$/, ""));
	add("hit frame distinct from other strikes", same.length ? "WARN" : "ok", `Hit f${hit}${same.length ? " shared with " + same.join(", ") : ""}`);
}

const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
console.log(`lint ${name}: ${lastFrame + 1} frames${loop ? " (loop)" : ""}${hit !== null ? `, Hit f${hit}` : ""}${striker ? `, striking limb ${striker}` : ""}`);
for (const r of rows) {
	const lines = String(r.detail).split("\n");
	console.log(`${pad(r.status, 5)}${pad(r.gate, 42)}${lines[0]}`);
	for (const l of lines.slice(1)) console.log(" ".repeat(47) + l);
}
const fails = rows.filter(r => r.status === "FAIL").length, warnsN = rows.filter(r => r.status === "WARN").length;
console.log(fails ? `RESULT: FAIL (${fails} failing, ${warnsN} warnings) - do not install` : `RESULT: PASS${warnsN ? ` with ${warnsN} warnings - explain each one` : ""}`);
if (args.includes("--onion")) console.log(node("onion.js", path.join(W, `lint_${name}.json`), path.join(W, `onion_${name}.png`), String(hit ?? -1)).trim());
process.exit(fails ? 1 : 0);
