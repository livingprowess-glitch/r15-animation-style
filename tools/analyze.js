const fs = require("fs");
const D2R = Math.PI / 180, R2D = 180 / Math.PI;

const JOINTS = ["LowerTorso","UpperTorso","Head","LeftUpperArm","RightUpperArm","LeftLowerArm","RightLowerArm","LeftHand","RightHand","LeftUpperLeg","RightUpperLeg","LeftLowerLeg","RightLowerLeg","LeftFoot","RightFoot"];
const MOTOR = {LowerTorso:"Root",UpperTorso:"Waist",Head:"Neck",LeftUpperArm:"LShoulder",RightUpperArm:"RShoulder",LeftLowerArm:"LElbow",RightLowerArm:"RElbow",LeftHand:"LWrist",RightHand:"RWrist",LeftUpperLeg:"LHip",RightUpperLeg:"RHip",LeftLowerLeg:"LKnee",RightLowerLeg:"RKnee",LeftFoot:"LAnkle",RightFoot:"RAnkle"};
const PAIRS = [["LeftUpperArm","RightUpperArm"],["LeftLowerArm","RightLowerArm"],["LeftHand","RightHand"],["LeftUpperLeg","RightUpperLeg"],["LeftLowerLeg","RightLowerLeg"],["LeftFoot","RightFoot"]];
const PARENT = {UpperTorso:"LowerTorso",Head:"UpperTorso",LeftUpperArm:"UpperTorso",RightUpperArm:"UpperTorso",LeftLowerArm:"LeftUpperArm",RightLowerArm:"RightUpperArm",LeftHand:"LeftLowerArm",RightHand:"RightLowerArm",LeftUpperLeg:"LowerTorso",RightUpperLeg:"LowerTorso",LeftLowerLeg:"LeftUpperLeg",RightLowerLeg:"RightUpperLeg",LeftFoot:"LeftLowerLeg",RightFoot:"RightLowerLeg"};

const qmul = (a,b) => [a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3], a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2], a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1], a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const qconj = a => [a[0],-a[1],-a[2],-a[3]];
const qaxis = (ax,deg) => { const h = deg*D2R/2, s = Math.sin(h); return [Math.cos(h), ax==0?s:0, ax==1?s:0, ax==2?s:0]; };
const qeuler = (x,y,z) => qmul(qmul(qaxis(0,x),qaxis(1,y)),qaxis(2,z));
const qangle = q => 2*Math.acos(Math.min(1,Math.abs(q[0])))*R2D;
const qrotvec = q => { const w = q[0] < 0 ? -1 : 1; const a = qangle(q); const s = Math.sqrt(q[1]*q[1]+q[2]*q[2]+q[3]*q[3]); return s < 1e-9 ? [0,0,0] : [w*q[1]/s*a, w*q[2]/s*a, w*q[3]/s*a]; };
const qrot = (q,v) => { const r = qmul(qmul(q,[0,...v]),qconj(q)); return [r[1],r[2],r[3]]; };

const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const median = a => { if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y), m=s.length>>1; return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
const std = a => { const m = mean(a); return Math.sqrt(mean(a.map(x=>(x-m)**2))); };
const corr = (a,b) => { const ma=mean(a), mb=mean(b); let n=0,da=0,db=0; for(let i=0;i<a.length;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;} return da<1e-9||db<1e-9 ? NaN : n/Math.sqrt(da*db); };

function prep(seq) {
  const kfs = seq.kfs;
  const t = kfs.map(k=>k.t);
  const tracks = {};
  for (const j of JOINTS) {
    tracks[j] = kfs.map(k => { const p = k.p[j] || [0,0,0,0,0,0]; return { pos:[p[0],p[1],p[2]], eul:[p[3],p[4],p[5]], q:qeuler(p[3],p[4],p[5]) }; });
  }
  return { name: seq.name, t, tracks, n: kfs.length, dur: t[t.length-1]-t[0] };
}

function angVel(tr, t) {
  const v = [0];
  for (let i=1;i<tr.length;i++) { const dt = t[i]-t[i-1]; v.push(dt>0 ? qangle(qmul(tr[i].q,qconj(tr[i-1].q)))/dt : 0); }
  return v;
}
function angVelVec(tr, t) {
  const v = [[0,0,0]];
  for (let i=1;i<tr.length;i++) { const dt = t[i]-t[i-1]; const r = qrotvec(qmul(tr[i].q,qconj(tr[i-1].q))); v.push(dt>0 ? r.map(x=>x/dt) : [0,0,0]); }
  return v;
}

const TEMPLATES = {
  linear: x=>x,
  "ease-in": x=>x*x,
  "ease-out": x=>1-(1-x)*(1-x),
  "ease-in-out": x=>x*x*(3-2*x),
};
function fitEasing(tr, i0, i1) {
  const q0 = tr[i0].q, q1 = tr[i1].q;
  const total = qangle(qmul(q1,qconj(q0)));
  if (total < 5) return null;
  const axis = qrotvec(qmul(q1,qconj(q0))).map(x=>x/total);
  const n = i1-i0, prog = [];
  for (let i=i0;i<=i1;i++) { const r = qrotvec(qmul(tr[i].q,qconj(q0))); prog.push((r[0]*axis[0]+r[1]*axis[1]+r[2]*axis[2])/total); }
  if (Math.max(...prog) > 1.08) return "overshoot";
  let best=null, bestE=Infinity;
  for (const [k,f] of Object.entries(TEMPLATES)) { let e=0; for (let i=0;i<=n;i++) e += (prog[i]-f(i/n))**2; if (e<bestE){bestE=e;best=k;} }
  return best;
}
function segments(speed) {
  const peak = Math.max(...speed);
  const thr = Math.max(20, peak*0.08);
  const cuts = [0];
  for (let i=1;i<speed.length-1;i++) if (speed[i] <= speed[i-1] && speed[i] < speed[i+1] && speed[i] < thr*2.5) cuts.push(i);
  cuts.push(speed.length-1);
  const out = [];
  for (let k=1;k<cuts.length;k++) if (cuts[k]-cuts[k-1] >= 3) out.push([cuts[k-1],cuts[k]]);
  return out;
}

function analyze(seq) {
  const a = prep(seq);
  const { t, tracks, n, dur } = a;
  const res = { name: a.name, n, dur, density: dur>0 ? (n-1)/dur : 0 };
  const dts = []; for (let i=1;i<n;i++) dts.push(t[i]-t[i-1]);
  res.dtCV = std(dts)/mean(dts);
  res.sampling = res.dtCV < 0.05 && mean(dts) < 0.034 ? "even (baked)" : "pose-to-pose";

  res.joint = {};
  const speeds = {};
  for (const j of JOINTS) {
    const tr = tracks[j];
    const dev = tr.map(p=>qangle(p.q));
    const sp = angVel(tr,t); speeds[j] = sp;
    const pk = sp.indexOf(Math.max(...sp));
    res.joint[j] = {
      part: dev.filter(d=>d>2).length/n,
      maxDev: Math.max(...dev),
      meanDev: mean(dev),
      eul: [0,1,2].map(ax=>tr.map(p=>p.eul[ax])),
      peakVel: sp[pk], peakT: t[pk], peakIdx: pk,
      meanVel: mean(sp.slice(1)),
    };
  }
  const body = t.map((_,i)=>JOINTS.reduce((s,j)=>s+speeds[j][i],0));
  res.body = body;
  const holdThr = 15;
  let holds=[], run=0;
  for (let i=1;i<n;i++) { const mx = Math.max(...JOINTS.map(j=>speeds[j][i])); if (mx < holdThr) run += t[i]-t[i-1]; else { if (run>0) holds.push(run); run=0; } }
  if (run>0) holds.push(run);
  res.holdMean = holds.length ? mean(holds) : 0;
  res.holdFrac = holds.reduce((s,x)=>s+x,0)/dur;

  res.easing = {linear:0,"ease-in":0,"ease-out":0,"ease-in-out":0,overshoot:0};
  for (const j of JOINTS) for (const [i0,i1] of segments(speeds[j])) { const e = fitEasing(tracks[j],i0,i1); if (e) res.easing[e]++; }

  const lt = tracks.LowerTorso;
  const P = lt.map(p=>p.pos);
  res.rootDisp = Math.max(...P.map(p=>Math.hypot(p[0]-P[0][0],p[1]-P[0][1],p[2]-P[0][2])));
  res.rootRange = [0,1,2].map(ax=>Math.max(...P.map(p=>p[ax]))-Math.min(...P.map(p=>p[ax])));
  res.rootPath = P.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-P[i][0],p[1]-P[i][1],p[2]-P[i][2]),0);
  const ut = tracks.UpperTorso;
  const lean = t.map((_,i)=>{ const up = qrot(qmul(lt[i].q,ut[i].q),[0,1,0]); return { pitch: Math.atan2(-up[2],up[1])*R2D, roll: Math.atan2(up[0],up[1])*R2D }; });
  res.leanPitch = lean.map(l=>l.pitch); res.leanRoll = lean.map(l=>l.roll);
  const hipDiff = t.map((_,i)=>qangle(tracks.LeftUpperLeg[i].q)-qangle(tracks.RightUpperLeg[i].q));
  let sc=0; for (let i=1;i<n;i++) if (Math.sign(hipDiff[i])!=Math.sign(hipDiff[i-1]) && Math.abs(hipDiff[i]-hipDiff[i-1])>0) sc++;
  res.weightShiftsPerSec = dur>0 ? sc/dur : 0;
  res.lateralRange = res.rootRange[0];
  const sym = [], symPitch = [];
  for (const [l,r] of PAIRS) {
    const c = corr(tracks[l].map(p=>qangle(p.q)), tracks[r].map(p=>qangle(p.q))); if (!isNaN(c)) sym.push(c);
    const cp = corr(tracks[l].map(p=>p.eul[0]), tracks[r].map(p=>p.eul[0])); if (!isNaN(cp)) symPitch.push(cp);
  }
  res.sym = mean(sym); res.symPitch = mean(symPitch);
  const amp = side => mean(PAIRS.map(pr=>res.joint[pr[side]].meanDev));
  res.lrBias = (amp(0)-amp(1))/(amp(0)+amp(1)||1);

  const ld = JOINTS.map(j=>qangle(qmul(tracks[j][n-1].q,qconj(tracks[j][0].q))));
  res.loopMax = Math.max(...ld); res.loopMean = mean(ld);
  res.loopRoot = Math.hypot(P[n-1][0]-P[0][0],P[n-1][1]-P[0][1],P[n-1][2]-P[0][2]);
  const lastV = body[n-1], firstV = body[1]||0;
  res.loopVelJump = Math.abs(lastV-firstV);
  res.loops = res.loopMax < 5 && res.loopRoot < 0.1;

  const pk = body.indexOf(Math.max(...body));
  res.peakBody = body[pk]; res.peakFrame = pk; res.peakT = t[pk];
  const dom = JOINTS.reduce((b,j)=>speeds[j][pk]>speeds[b][pk]?j:b, JOINTS[0]);
  res.domJoint = dom;
  const vv = angVelVec(tracks[dom], t);
  const vp = vv[pk];
  let i = pk; while (i>1 && (vv[i][0]*vp[0]+vv[i][1]*vp[1]+vv[i][2]*vp[2]) > 0) i--;
  const actionStart = i;
  let j2 = i; while (j2>1 && (vv[j2][0]*vp[0]+vv[j2][1]*vp[1]+vv[j2][2]*vp[2]) <= 0) j2--;
  const antStart = j2;
  const antMag = qangle(qmul(tracks[dom][actionStart].q, qconj(tracks[dom][antStart].q)));
  res.anticipationFrames = antMag > 3 ? actionStart-antStart : 0;
  res.anticipationDeg = antMag;
  res.timeToPeakFrames = pk-actionStart;
  let s = pk; while (s<n-1 && body[s] > res.peakBody*0.15) s++;
  res.settleFrames = s-pk;
  let k = pk; while (k<n-1 && (vv[k][0]*vp[0]+vv[k][1]*vp[1]+vv[k][2]*vp[2]) > 0) k++;
  const after = k<n-1 ? qangle(qmul(tracks[dom][Math.min(n-1,k+6)].q,qconj(tracks[dom][k].q))) : 0;
  res.followReverseDeg = after;
  const accents = []; for (let f=1;f<n-1;f++) if (body[f]>body[f-1] && body[f]>=body[f+1] && body[f]>res.peakBody*0.6) accents.push(f);
  res.accents = accents;
  const lag = (child, par) => {
    const a = speeds[child], b = speeds[par]; let best=0,bc=-2;
    for (let L=-8;L<=8;L++){ const x=[],y=[]; for (let f=0;f<n;f++){ if(f-L<0||f-L>=n) continue; x.push(a[f]); y.push(b[f-L]); } const c=corr(x,y); if(!isNaN(c)&&c>bc){bc=c;best=L;} }
    return { lag: best, c: bc };
  };
  res.lag = {
    "Head←UpperTorso": lag("Head","UpperTorso"),
    "UpperArm←UpperTorso": (()=>{ const l=lag("LeftUpperArm","UpperTorso"), r=lag("RightUpperArm","UpperTorso"); return {lag:(l.lag+r.lag)/2,c:(l.c+r.c)/2}; })(),
    "LowerArm←UpperArm": (()=>{ const l=lag("LeftLowerArm","LeftUpperArm"), r=lag("RightLowerArm","RightUpperArm"); return {lag:(l.lag+r.lag)/2,c:(l.c+r.c)/2}; })(),
    "Hand←LowerArm": (()=>{ const l=lag("LeftHand","LeftLowerArm"), r=lag("RightHand","RightLowerArm"); return {lag:(l.lag+r.lag)/2,c:(l.c+r.c)/2}; })(),
    "UpperTorso←LowerTorso": lag("UpperTorso","LowerTorso"),
  };
  return res;
}

module.exports = { analyze, JOINTS, MOTOR, mean, median, std, qeuler, qangle, qmul, qconj };
