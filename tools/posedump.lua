local builder = loadstring([======[__BUILDER__]======])
if not builder then return "BUILDER COMPILE FAIL" end
local ks = builder()
local HS = game:GetService("HttpService")
local WANT = { __FRAMES__ }

local rig = game:GetService("Players"):CreateHumanoidModelFromDescription(Instance.new("HumanoidDescription"), Enum.HumanoidRigType.R15)
local JOINTS = {
	{ "HumanoidRootPart", "LowerTorso", "RootRigAttachment" },
	{ "LowerTorso", "UpperTorso", "WaistRigAttachment" },
	{ "UpperTorso", "Head", "NeckRigAttachment" },
	{ "UpperTorso", "LeftUpperArm", "LeftShoulderRigAttachment" },
	{ "LeftUpperArm", "LeftLowerArm", "LeftElbowRigAttachment" },
	{ "LeftLowerArm", "LeftHand", "LeftWristRigAttachment" },
	{ "UpperTorso", "RightUpperArm", "RightShoulderRigAttachment" },
	{ "RightUpperArm", "RightLowerArm", "RightElbowRigAttachment" },
	{ "RightLowerArm", "RightHand", "RightWristRigAttachment" },
	{ "LowerTorso", "LeftUpperLeg", "LeftHipRigAttachment" },
	{ "LeftUpperLeg", "LeftLowerLeg", "LeftKneeRigAttachment" },
	{ "LeftLowerLeg", "LeftFoot", "LeftAnkleRigAttachment" },
	{ "LowerTorso", "RightUpperLeg", "RightHipRigAttachment" },
	{ "RightUpperLeg", "RightLowerLeg", "RightKneeRigAttachment" },
	{ "RightLowerLeg", "RightFoot", "RightAnkleRigAttachment" },
}
local size, c0, c1 = {}, {}, {}
for _, p in rig:GetChildren() do
	if p:IsA("BasePart") then size[p.Name] = p.Size end
end
for _, j in JOINTS do
	c0[j[2]] = rig[j[1]][j[3]].CFrame
	c1[j[2]] = rig[j[2]][j[3]].CFrame
end
rig:Destroy()

local frames = {}
for _, kf in ks:GetChildren() do table.insert(frames, kf) end
table.sort(frames, function(a, b) return a.Time < b.Time end)

local out = {}
for _, want in WANT do
	local kf = frames[want + 1]
	if kf then
		local pose = {}
		for _, p in kf:GetDescendants() do
			if p:IsA("Pose") then pose[p.Name] = p.CFrame end
		end
		local cf = { HumanoidRootPart = CFrame.identity }
		for _, j in JOINTS do
			cf[j[2]] = cf[j[1]] * c0[j[2]] * (pose[j[2]] or CFrame.identity) * c1[j[2]]:Inverse()
		end
		local parts = {}
		for name, c in cf do
			if name ~= "HumanoidRootPart" then
				local s = size[name]
				parts[name] = { p = { c.X, c.Y, c.Z }, r = { c.RightVector.X, c.RightVector.Y, c.RightVector.Z, c.UpVector.X, c.UpVector.Y, c.UpVector.Z, -c.LookVector.X, -c.LookVector.Y, -c.LookVector.Z }, s = { s.X, s.Y, s.Z } }
			end
		end
		table.insert(out, { frame = want, parts = parts })
	end
end
ks:Destroy()
return HS:JSONEncode(out)
