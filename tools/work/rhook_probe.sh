#!/bin/sh
# $1 = body JSON override ; prints chamber/impact/follow-through candidate distances
T="C:/Users/osaya/.claude/skills/r15-animation-style/tools"; cd "$T"
node work/mkrhook.js "" "$1" >/dev/null && node ikbake.js work/rhook.tpl work/rhook_ik.json work/rhook_tracks.lua >/dev/null && node gen_anim.js work/rhook_tracks.lua work/rhook.json work/rhook.server.lua >/dev/null && node mkrender.js work/rhook.server.lua 0,22,27,33 >/dev/null && ./rbxrun.sh posedump_run.lua work/pose_rhook_aim.json && node -e '
const fs=require("fs");const sh=[0.972,0.598,0];const ps=JSON.parse(fs.readFileSync("work/pose_rhook_aim.json","utf8"));const g0=ps.find(p=>p.frame===0).parts.RightHand.p;
for(const p of ps){if(p.frame===0)continue;const P=p.parts,ut=P.UpperTorso,hd=P.Head.p;
const toLocal=W=>{const rel=W.map((v,i)=>v-ut.p[i]);return [0,1,2].map(a=>+(rel[0]*ut.r[a*3]+rel[1]*ut.r[a*3+1]+rel[2]*ut.r[a*3+2]).toFixed(3));};
const cands=p.frame===22?[[1.45,-0.35,0.6],[1.3,-0.35,0.75]]:p.frame===27?[[0,-0.5,1.7],[0,-0.5,1.85],[0,-0.5,2.0]]:[[-0.6,-0.5,1.6],[-0.6,-0.5,1.75]];
for(const [side,up,fwd] of cands){const W=[hd[0]+side,hd[1]+up,hd[2]-fwd];const l=toLocal(W);const d=Math.hypot(...l.map((v,i)=>v-sh[i]));console.log("f"+p.frame,"side",side,"fwd",fwd,"local",JSON.stringify(l),"| shoulder-to-fist",d.toFixed(2),"| world z",W[2].toFixed(2),"(guard z",g0[2].toFixed(2)+")");}}'
