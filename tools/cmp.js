const fs=require("fs");const {analyze,JOINTS,MOTOR,mean,median,std}=require("./analyze.js");
const all=JSON.parse(fs.readFileSync("corpus.json","utf8"));const seen=new Set();const C=[];
for(const s of all){const h=JSON.stringify(s.kfs);if(seen.has(h))continue;seen.add(h);if(!/Whole/i.test(s.name))C.push(s);}
const R=C.map(analyze);const act=R.filter(r=>!r.loops);
const g=analyze(JSON.parse(fs.readFileSync("gen.json","utf8"))[0]);
const f1=x=>(Math.round(x*10)/10).toFixed(1);
const rankOf=list=>{const s=[...list].sort((a,b)=>b.part-a.part||b.md-a.md);const m={};s.forEach((x,i)=>m[x.j]=i+1);return m;};
const cr=rankOf(JOINTS.map(j=>({j,part:mean(R.map(r=>r.joint[j].part)),md:mean(R.map(r=>r.joint[j].meanDev))})));
const gr=rankOf(JOINTS.map(j=>({j,part:g.joint[j].part,md:g.joint[j].meanDev})));
const rows=[];const row=(m,c,v,ok)=>rows.push(`| ${m} | ${c} | ${v} | ${ok?"PASS":"FAIL"} |`);
console.log("| joint | corpus rank | gen rank | corpus part% | gen part% | Δ | |\n|---|---|---|---|---|---|---|");
for(const j of [...JOINTS].sort((a,b)=>cr[a]-cr[b])){const d=gr[j]-cr[j];console.log(`| ${MOTOR[j]} | ${cr[j]} | ${gr[j]} | ${f1(mean(R.map(r=>r.joint[j].part))*100)} | ${f1(g.joint[j].part*100)} | ${d>0?"+":""}${d} | ${Math.abs(d)<=1?"PASS":"FAIL"} |`);}
const band=(v,t,p)=>Math.abs(v-t)<=t*p;
const corpusMax=mean(R.map(r=>Math.max(...JOINTS.map(j=>r.joint[j].peakVel))));
const gMax=Math.max(...JOINTS.map(j=>g.joint[j].peakVel));
const active=JOINTS.filter(j=>!/Hand/.test(j));
const corpusMJ=mean(R.map(r=>mean(active.map(j=>r.joint[j].peakVel)))); const gMJ=mean(active.map(j=>g.joint[j].peakVel));
console.log(`\nmetric | corpus | gen | result`);
row("max single-joint peak °/s (±15%)",f1(corpusMax),f1(gMax)+` (${MOTOR[JOINTS.find(j=>g.joint[j].peakVel==gMax)]} @f${g.joint[JOINTS.find(j=>g.joint[j].peakVel==gMax)].peakIdx})`,band(gMax,corpusMax,0.15));
row("mean per-joint peak °/s (±15%)",f1(corpusMJ),f1(gMJ),band(gMJ,corpusMJ,0.15));
for(const j of ["RightUpperArm","LeftUpperArm","RightUpperLeg","LeftUpperLeg","Head","UpperTorso"]){const c=mean(R.map(r=>r.joint[j].peakVel));row(`${MOTOR[j]} peak °/s (±15% info)`,f1(c),f1(g.joint[j].peakVel),band(g.joint[j].peakVel,c,0.15));}
const cd=mean(R.map(r=>r.density));row("kf density kf/s (±20%)",f1(cd),f1(g.density),band(g.density,cd,0.2));
row("sampling","even 60 Hz",g.sampling,g.sampling.startsWith("even"));
const cdur=mean(act.map(r=>r.dur));row("duration s (action subset ±1sd)",f1(cdur)+"±"+f1(std(act.map(r=>r.dur))),g.dur.toFixed(2),Math.abs(g.dur-cdur)<=std(act.map(r=>r.dur)));
const ez={linear:0,"ease-in":0,"ease-out":0,"ease-in-out":0,overshoot:0};for(const r of R)for(const k in ez)ez[k]+=r.easing[k];const T=Object.values(ez).reduce((a,b)=>a+b,0);const gT=Object.values(g.easing).reduce((a,b)=>a+b,0);
let tvd=0;for(const k in ez){const a=ez[k]/T*100,b=g.easing[k]/gT*100;tvd+=Math.abs(a-b)/2;row(`easing ${k} % (±10pt)`,f1(a),`${f1(b)} (${g.easing[k]}/${gT})`,Math.abs(a-b)<=10);}
row("easing total-variation distance (≤15)","0",f1(tvd),tvd<=15);
const lm=act.map(r=>r.loopMax),lmm=act.map(r=>r.loopMean);
row("loop Δmax ° (action mean±1sd)",f1(mean(lm))+"±"+f1(std(lm)),f1(g.loopMax),Math.abs(g.loopMax-mean(lm))<=std(lm));
row("loop Δmean ° (action mean±1sd)",f1(mean(lmm))+"±"+f1(std(lmm)),f1(g.loopMean),Math.abs(g.loopMean-mean(lmm))<=std(lmm));
const am=act.map(r=>r.anticipationFrames);row("anticipation frames (action mean±1sd)",f1(mean(am))+"±"+f1(std(am)),String(g.anticipationFrames),Math.abs(g.anticipationFrames-mean(am))<=std(am));
const tp=act.map(r=>r.timeToPeakFrames);row("frames to peak (±1sd)",f1(mean(tp))+"±"+f1(std(tp)),String(g.timeToPeakFrames),Math.abs(g.timeToPeakFrames-mean(tp))<=std(tp));
const st=act.map(r=>r.settleFrames);row("settle frames (±1sd)",f1(mean(st))+"±"+f1(std(st)),String(g.settleFrames),Math.abs(g.settleFrames-mean(st))<=std(st));
const rd=R.map(r=>r.rootDisp);row("root displacement studs (±1sd)",f1(mean(rd))+"±"+f1(std(rd)),g.rootDisp.toFixed(2),Math.abs(g.rootDisp-mean(rd))<=std(rd));
const sy=R.map(r=>r.sym);row("symmetry |angle| corr (±1sd)",mean(sy).toFixed(2)+"±"+std(sy).toFixed(2),g.sym.toFixed(2),Math.abs(g.sym-mean(sy))<=std(sy));
const ws=R.map(r=>r.weightShiftsPerSec);row("weight shifts/s (±1sd)",f1(mean(ws))+"±"+f1(std(ws)),f1(g.weightShiftsPerSec),Math.abs(g.weightShiftsPerSec-mean(ws))<=std(ws));
const ac=R.map(r=>r.accents.length);row("accent frames (±1sd)",f1(mean(ac))+"±"+f1(std(ac)),String(g.accents.length),Math.abs(g.accents.length-mean(ac))<=std(ac));
row("wrists untouched","0 %",f1(g.joint.LeftHand.part*100)+"/"+f1(g.joint.RightHand.part*100),g.joint.LeftHand.part==0&&g.joint.RightHand.part==0);
const hinge=["LeftLowerArm","RightLowerArm","LeftLowerLeg","RightLowerLeg"].every(j=>g.joint[j].eul[1].every(v=>Math.abs(v)<0.01)&&g.joint[j].eul[2].every(v=>Math.abs(v)<0.01));
row("elbows/knees pure X hinge","yes",hinge?"yes":"no",hinge);
console.log(rows.join("\n"));
console.log("gen lag",JSON.stringify(g.lag),"peak body",f1(g.peakBody),"@f",g.peakFrame,"hold%",f1(g.holdFrac*100));
console.log("gen meanDev",JOINTS.map(j=>MOTOR[j]+":"+f1(g.joint[j].meanDev)).join(" "));
