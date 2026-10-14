#!/bin/sh
# $1 = hip z offset back, $2 = root pitch, $3 = waist pitch, $4 = neck pitch, $5 = rear heel pitch
T="C:/Users/osaya/.claude/skills/r15-animation-style/tools"; cd "$T"
node -e '
const [zb,rp,wp,np,hp,ry0]=process.argv.slice(1).map(Number);const ry=isNaN(ry0)?-0.25:ry0;const fs=require("fs");
const z0=(-0.04+zb).toFixed(3),z1=(0.04+zb).toFixed(3);
const t=`const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, ${rp}, -24, 1, "inOutSine", 0.02, ${ry}, ${z0} },
		{ 50, ${rp+1}, -26, -1, "inOutSine", -0.02, ${ry}, ${z1} },
		{ LAST_FRAME, ${rp}, -24, 1, "linear", 0.02, ${ry}, ${z0} },
	},
	UpperTorso = {
		{ 0, ${wp}, 9, -1, "inOutSine" },
		{ 50, ${wp+1}, 11, 1, "inOutSine" },
		{ LAST_FRAME, ${wp}, 9, -1, "linear" },
	},
	Head = {
		{ 0, ${np}, 15, 0.5, "inOutSine" },
		{ 50, ${np-1}, 16, -0.5, "inOutSine" },
		{ LAST_FRAME, ${np}, 15, 0.5, "linear" },
	},
` + fs.readFileSync("work/box.tpl","utf8").split("\tLeftUpperArm = {")[1].replace(/^/,"\tLeftUpperArm = {");
fs.writeFileSync("work/box_try.tpl",t);
const s=JSON.parse(fs.readFileSync("work/box_ik.json","utf8"));
const rise=h=>(0.5*Math.sin(Math.abs(h)*Math.PI/180));
for(const k of s.legs.Right){const h=hp-(k.f===50?2:0);k.pitch=h;k.pos[1]=+(-2.929+rise(h)).toFixed(3);}
fs.writeFileSync("work/box_try_ik.json",JSON.stringify(s,null,"\t"));' "$@" && node ikbake.js work/box_try.tpl work/box_try_ik.json work/box_try_tracks.lua >/dev/null && node gen_anim.js work/box_try_tracks.lua work/box.json work/box_try.server.lua >/dev/null && node mkrender.js work/box_try.server.lua 0,50 >/dev/null && ./rbxrun.sh posedump_run.lua work/pose_try.json && node balance.js work/pose_try.json
