const fs = require("fs");
const c = JSON.parse(fs.readFileSync(__dirname + "/corpus.json", "utf8"));
const name = process.argv[2];
const s = c.find(x => x.name.trim() === name);
if (!s) throw new Error("no " + name);
const H = { HumanoidRootPart: ["LowerTorso"], LowerTorso: ["UpperTorso", "LeftUpperLeg", "RightUpperLeg"], UpperTorso: ["Head", "LeftUpperArm", "RightUpperArm"], LeftUpperArm: ["LeftLowerArm"], LeftLowerArm: ["LeftHand"], RightUpperArm: ["RightLowerArm"], RightLowerArm: ["RightHand"], LeftUpperLeg: ["LeftLowerLeg"], LeftLowerLeg: ["LeftFoot"], RightUpperLeg: ["RightLowerLeg"], RightLowerLeg: ["RightFoot"] };
const rows = s.kfs.map(k => "{" + k.t + ",{" + Object.entries(k.p).filter(([j]) => !/Grip/.test(j)).map(([j, p]) => `${j}={${p.slice(0, 6).join(",")}}`).join(",") + "}}").join(",\n");
const src = `local H = ${"{" + Object.entries(H).map(([k, v]) => `${k}={${v.map(x => `"${x}"`).join(",")}}`).join(",") + "}"}
local D = {${rows}}
local function build(name, p)
	local pose = Instance.new("Pose") pose.Name = name
	local v = p[name] or {0,0,0,0,0,0}
	pose.CFrame = CFrame.new(v[1], v[2], v[3]) * CFrame.Angles(math.rad(v[4]), math.rad(v[5]), math.rad(v[6]))
	for _, c in H[name] or {} do build(c, p).Parent = pose end
	return pose
end
function buildSequence()
	local ks = Instance.new("KeyframeSequence")
	for _, row in D do local kf = Instance.new("Keyframe") kf.Time = row[1] build("HumanoidRootPart", row[2]).Parent = kf kf.Parent = ks end
	return ks
end
-- PLAYBACK`;
fs.writeFileSync(__dirname + "/corpus_one.lua", src);
