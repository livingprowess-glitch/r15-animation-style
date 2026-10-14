const fs = require("fs");
const { analyze, JOINTS, MOTOR, mean, median, std } = require("./analyze.js");
const all = JSON.parse(fs.readFileSync(process.argv[2] || "corpus.json","utf8"));
const seen = new Set(), corpus = [], composites = [];
for (const s of all) {
  const h = JSON.stringify(s.kfs); if (seen.has(h)) continue; seen.add(h);
  if (/Whole/i.test(s.name)) composites.push(s); else corpus.push(s);
}
const R = corpus.map(analyze);
const f1 = x => (Math.round(x*10)/10).toFixed(1);
const out = [];
const P = s => out.push(s);

P(`corpus=${R.length} composites excluded=${composites.map(c=>c.name).join(", ")}`);
P("\n## Per-animation");
P("| anim | dur s | kf | kf/s | top-3 joints (part%) | peak body °/s @t | dom joint | peak joint °/s | hold% | rootDisp | Yrange | leanP min/max | sym | loopΔmax° | loops? |");
P("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of R) {
  const top = JOINTS.map(j=>[j,r.joint[j].part]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([j,p])=>`${MOTOR[j]} ${Math.round(p*100)}`).join(", ");
  P(`| ${r.name.trim()} | ${r.dur.toFixed(2)} | ${r.n} | ${f1(r.density)} | ${top} | ${Math.round(r.peakBody)} @${r.peakT.toFixed(2)} | ${MOTOR[r.domJoint]} | ${Math.round(r.joint[r.domJoint].peakVel)} | ${Math.round(r.holdFrac*100)} | ${r.rootDisp.toFixed(2)} | ${r.rootRange[1].toFixed(2)} | ${f1(Math.min(...r.leanPitch))}/${f1(Math.max(...r.leanPitch))} | ${r.sym.toFixed(2)} | ${f1(r.loopMax)} | ${r.loops?"Y":"N"} |`);
}

P("\n## Joint participation & peak velocity (corpus)");
P("| rank | motor | part % | mean |dev|° | max dev° | mean peak °/s | max peak °/s | mean |ω| °/s |");
P("|---|---|---|---|---|---|---|---|");
const jrank = JOINTS.map(j=>({ j, part: mean(R.map(r=>r.joint[j].part)), md: mean(R.map(r=>r.joint[j].meanDev)), mx: Math.max(...R.map(r=>r.joint[j].maxDev)), pk: mean(R.map(r=>r.joint[j].peakVel)), pkx: Math.max(...R.map(r=>r.joint[j].peakVel)), mv: mean(R.map(r=>r.joint[j].meanVel)) })).sort((a,b)=>b.part-a.part || b.md-a.md);
jrank.forEach((x,i)=>P(`| ${i+1} | ${MOTOR[x.j]} | ${f1(x.part*100)} | ${f1(x.md)} | ${f1(x.mx)} | ${Math.round(x.pk)} | ${Math.round(x.pkx)} | ${Math.round(x.mv)} |`));

P("\n## Euler stats per joint (corpus, all frames, degrees) X | Y | Z each mean/median/std/min/max");
P("| motor | X mean/med/sd/min/max | Y mean/med/sd/min/max | Z mean/med/sd/min/max |");
P("|---|---|---|---|");
for (const j of JOINTS) {
  const cells = [0,1,2].map(ax=>{ const v = R.flatMap(r=>r.joint[j].eul[ax]); return [mean(v),median(v),std(v),Math.min(...v),Math.max(...v)].map(f1).join("/"); });
  P(`| ${MOTOR[j]} | ${cells.join(" | ")} |`);
}

P("\n## Easing (fitted per joint-move)");
const ez = {linear:0,"ease-in":0,"ease-out":0,"ease-in-out":0,overshoot:0};
for (const r of R) for (const k in ez) ez[k]+=r.easing[k];
const ezT = Object.values(ez).reduce((a,b)=>a+b,0);
P("| type | count | % |"); P("|---|---|---|");
for (const k in ez) P(`| ${k} | ${ez[k]} | ${f1(ez[k]/ezT*100)} |`);

P("\n## Secondary lag (frames @60Hz, +ve = child lags parent)");
P("| chain | mean lag | median lag | mean corr |"); P("|---|---|---|---|");
for (const k of Object.keys(R[0].lag)) { const L = R.map(r=>r.lag[k].lag), C = R.map(r=>r.lag[k].c).filter(x=>!isNaN(x)); P(`| ${k} | ${f1(mean(L))} | ${f1(median(L))} | ${mean(C).toFixed(2)} |`); }

P("\n## Action structure");
P("| anim | anticip frames | anticip ° | frames→peak | settle frames | follow reverse ° | accents |");
P("|---|---|---|---|---|---|---|");
for (const r of R) P(`| ${r.name.trim()} | ${r.anticipationFrames} | ${f1(r.anticipationDeg)} | ${r.timeToPeakFrames} | ${r.settleFrames} | ${f1(r.followReverseDeg)} | ${r.accents.length} |`);

const stat = (k, fn) => { const v = R.map(fn); return `${k}: mean ${f1(mean(v))} median ${f1(median(v))} sd ${f1(std(v))} min ${f1(Math.min(...v))} max ${f1(Math.max(...v))}`; };
P("\n## Corpus aggregates");
[
  ["duration s", r=>r.dur], ["kf/s", r=>r.density], ["dt CV", r=>r.dtCV], ["hold mean s", r=>r.holdMean], ["hold frac %", r=>r.holdFrac*100],
  ["peak body °/s", r=>r.peakBody], ["peak dominant-joint °/s", r=>r.joint[r.domJoint].peakVel], ["max single-joint peak °/s", r=>Math.max(...JOINTS.map(j=>r.joint[j].peakVel))],
  ["anticip frames", r=>r.anticipationFrames], ["anticip deg", r=>r.anticipationDeg], ["frames to peak", r=>r.timeToPeakFrames], ["settle frames", r=>r.settleFrames], ["follow reverse °", r=>r.followReverseDeg],
  ["root disp studs", r=>r.rootDisp], ["root Y range", r=>r.rootRange[1]], ["root X range", r=>r.rootRange[0]], ["root Z range", r=>r.rootRange[2]], ["root path studs", r=>r.rootPath],
  ["lean pitch mean", r=>mean(r.leanPitch)], ["lean pitch min", r=>Math.min(...r.leanPitch)], ["lean pitch max", r=>Math.max(...r.leanPitch)], ["lean roll absmax", r=>Math.max(...r.leanRoll.map(Math.abs))],
  ["weight shifts/s", r=>r.weightShiftsPerSec], ["sym |angle| corr", r=>r.sym], ["sym pitch corr", r=>r.symPitch], ["L-R bias", r=>r.lrBias],
  ["loop Δ max °", r=>r.loopMax], ["loop Δ mean °", r=>r.loopMean], ["loop root Δ", r=>r.loopRoot], ["loop vel jump", r=>r.loopVelJump], ["accent count", r=>r.accents.length],
].forEach(([k,fn])=>P(stat(k,fn)));
P(`seamless loops: ${R.filter(r=>r.loops).map(r=>r.name.trim()).join(", ")}`);
P(`max deviation per joint top: ${jrank.map(x=>MOTOR[x.j]+" "+f1(x.mx)).join(", ")}`);
fs.writeFileSync("summary.json", JSON.stringify({ rank: jrank.map(x=>({m:MOTOR[x.j],part:x.part,pk:x.pk,md:x.md})), ez, ezT, R: R.map(r=>({name:r.name,dur:r.dur,density:r.density,peak:r.joint[r.domJoint].peakVel,loopMax:r.loopMax})) }));
console.log(out.join("\n"));
