local builder = loadstring([======[__BUILDER__]======])
if not builder then return "BUILDER COMPILE FAIL" end
local ks = builder()

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

local function solve(kf)
	local pose = {}
	for _, p in kf:GetDescendants() do
		if p:IsA("Pose") then pose[p.Name] = p.CFrame end
	end
	local cf = { HumanoidRootPart = CFrame.identity }
	for _, j in JOINTS do
		cf[j[2]] = cf[j[1]] * c0[j[2]] * (pose[j[2]] or CFrame.identity) * c1[j[2]]:Inverse()
	end
	return cf
end

local function centerLine(cf, s, n, skipTop)
	local pts = {}
	for i = 0, n - 1 do
		local t = n == 1 and 0 or (i / (n - 1) - 0.5)
		if not (skipTop and t > 0.05) then
			table.insert(pts, cf * Vector3.new(0, t * s.Y * 0.8, 0))
		end
	end
	return pts
end

local function boxDist(cf, s, point)
	local l = cf:PointToObjectSpace(point)
	local h = s / 2
	local q = Vector3.new(math.abs(l.X) - h.X, math.abs(l.Y) - h.Y, math.abs(l.Z) - h.Z)
	local outside = Vector3.new(math.max(q.X, 0), math.max(q.Y, 0), math.max(q.Z, 0)).Magnitude
	return outside + math.min(math.max(q.X, q.Y, q.Z), 0)
end

local function segDist(a, b)
	local best = math.huge
	for _, p in a do
		for _, q in b do
			best = math.min(best, (p - q).Magnitude)
		end
	end
	return best
end

local function footBottom(cf, s)
	local lo, sum = math.huge, Vector3.zero
	for _, x in { -1, 1 } do
		for _, y in { -1, 1 } do
			for _, z in { -1, 1 } do
				local w = cf * Vector3.new(x * s.X / 2, y * s.Y / 2, z * s.Z / 2)
				lo = math.min(lo, w.Y)
			end
		end
	end
	return lo, cf.Position
end

local ARMS = { "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand" }
local BODY = { "UpperTorso", "LowerTorso", "Head" }
local LIMB_RADIUS = 0.5
local issues = {}
local function flag(kind, frame, value, detail)
	local key = kind .. "|" .. detail
	local e = issues[key]
	if not e then
		e = { kind = kind, detail = detail, first = frame, last = frame, worst = value, worstFrame = frame, count = 0 }
		issues[key] = e
	end
	e.last = frame
	e.count += 1
	if value > e.worst then e.worst = value e.worstFrame = frame end
end

local frames = {}
for _, kf in ks:GetChildren() do table.insert(frames, kf) end
table.sort(frames, function(a, b) return a.Time < b.Time end)

local floor
local prevFoot = {}
local handGap = {}
local ground = {}
local footXZ = { LeftFoot = {}, RightFoot = {} }
local DUMP = { "LeftLowerArm", "LeftHand", "RightHand", "LeftUpperArm", "LeftFoot", "RightFoot", "LeftLowerLeg", "RightLowerLeg" }
local dump = {}
for _, n in DUMP do dump[n] = {} end
local slideTotal = { LeftFoot = 0, RightFoot = 0 }

for i, kf in frames do
	local f = i - 1
	local cf = solve(kf)
	for _, arm in ARMS do
		local pts = centerLine(cf[arm], size[arm], arm:find("Hand") and 1 or 5, arm:find("UpperArm") ~= nil)
		for _, body in BODY do
			local d = math.huge
			for _, p in pts do d = math.min(d, boxDist(cf[body], size[body], p)) end
			local depth = LIMB_RADIUS - d
			if depth > 0.2 then flag("limb in body", f, depth, arm .. " -> " .. body) end
		end
	end
	for _, pair in { { "LeftUpperArm", "RightUpperArm" }, { "LeftLowerArm", "RightLowerArm" }, { "LeftUpperLeg", "RightUpperLeg" }, { "LeftLowerLeg", "RightLowerLeg" }, { "LeftFoot", "RightFoot" } } do
		local d = segDist(centerLine(cf[pair[1]], size[pair[1]], 5), centerLine(cf[pair[2]], size[pair[2]], 5))
		local depth = 2 * LIMB_RADIUS - d
		if depth > 0.3 then flag("limbs overlap", f, depth, pair[1] .. " x " .. pair[2]) end
	end
	for _, leg in { "LeftUpperLeg", "LeftLowerLeg", "RightUpperLeg", "RightLowerLeg" } do
		local d = math.huge
		for _, p in centerLine(cf[leg], size[leg], 5, leg:find("UpperLeg") ~= nil) do d = math.min(d, boxDist(cf.UpperTorso, size.UpperTorso, p)) end
		if LIMB_RADIUS - d > 0.2 then flag("leg in chest", f, LIMB_RADIUS - d, leg) end
	end
	local lows = {}
	for _, foot in { "LeftFoot", "RightFoot" } do
		local lo, pos = footBottom(cf[foot], size[foot])
		lows[foot] = lo
		if f == 0 then floor = math.min(floor or math.huge, lo) end
	end
	for _, foot in { "LeftFoot", "RightFoot" } do
		local lo = lows[foot]
		if floor - lo > 0.15 then flag("foot below floor", f, floor - lo, foot) end
		local pos = cf[foot].Position
		if lo - floor < 0.12 and prevFoot[foot] and prevFoot[foot].planted then
			local slide = (Vector3.new(pos.X, 0, pos.Z) - Vector3.new(prevFoot[foot].pos.X, 0, prevFoot[foot].pos.Z)).Magnitude
			slideTotal[foot] += slide
			if slide > 0.06 then flag("planted foot slides", f, slide, foot) end
		end
		prevFoot[foot] = { pos = pos, planted = lo - floor < 0.12 }
	end
	for _, n in DUMP do
		local p = cf.UpperTorso:PointToObjectSpace(cf[n].Position)
		if n:find("Foot") or n:find("Leg") then p = cf[n].Position end
		local up = cf[n].UpVector
		table.insert(dump[n], string.format("%.2f,%.2f,%.2f|%.2f,%.2f,%.2f", p.X, p.Y, p.Z, up.X, up.Y, up.Z))
	end
	table.insert(ground, string.format("%.2f", floor - math.min(lows.LeftFoot, lows.RightFoot)))
	for _, foot in { "LeftFoot", "RightFoot" } do
		local p = cf[foot].Position
		table.insert(footXZ[foot], string.format("%.2f,%.2f", p.X, p.Z))
	end
	if math.min(lows.LeftFoot, lows.RightFoot) - floor > 0.3 then flag("both feet off floor", f, math.min(lows.LeftFoot, lows.RightFoot) - floor, "body floats") end
	for _, pose in kf:GetDescendants() do
		if pose:IsA("Pose") then
			local x = math.deg(select(1, pose.CFrame:ToEulerAnglesXYZ()))
			if pose.Name:find("LowerArm") and x < -2 then flag("elbow hyperextends", f, -x, pose.Name) end
			if pose.Name:find("LowerLeg") and x > 2 then flag("knee hyperextends", f, x, pose.Name) end
		end
	end
	table.insert(handGap, string.format("%.2f", (cf.LeftHand.Position - cf.RightHand.Position).Magnitude))
end
ks:Destroy()

const LIMITS = {
	["limb in body|UpperArm -> UpperTorso"] = { 0.50, 0.63 },
	["limb in body|LowerArm -> UpperTorso"] = { 0.41, 0.47 },
	["limb in body|Hand -> UpperTorso"] = { 0.21, 0.30 },
	["limb in body|UpperArm -> LowerTorso"] = { 0.20, 0.39 },
	["limb in body|LowerArm -> LowerTorso"] = { 0.20, 0.39 },
	["limb in body|Hand -> LowerTorso"] = { 0.20, 0.39 },
	["limb in body|UpperArm -> Head"] = { 0.30, 0.45 },
	["limb in body|LowerArm -> Head"] = { 0.26, 0.45 },
	["limb in body|Hand -> Head"] = { 0.20, 0.49 },
	["leg in chest|UpperLeg"] = { 0.56, 0.67 },
	["leg in chest|LowerLeg"] = { 0.44, 0.74 },
	["limbs overlap|UpperArm x UpperArm"] = { 0.30, 0.82 },
	["limbs overlap|LowerArm x LowerArm"] = { 0.30, 0.82 },
	["limbs overlap|UpperLeg x UpperLeg"] = { 0.30, 0.52 },
	["limbs overlap|LowerLeg x LowerLeg"] = { 0.30, 0.52 },
	["limbs overlap|Foot x Foot"] = { 0.30, 0.64 },
	["foot below floor|Foot"] = { 0.41, 0.60 },
	["planted foot slides|Foot"] = { 0.71, 1.36 },
	["both feet off floor|body floats"] = { 4.26, 5.01 },
	["elbow hyperextends|LowerArm"] = { 2, 2.35 },
	["knee hyperextends|LowerLeg"] = { 2, 2 },
}
local list = {}
for _, e in issues do
	local lim = LIMITS[e.kind .. "|" .. e.detail:gsub("Left", ""):gsub("Right", "")]
	if lim and e.worst >= lim[1] then
		e.severity = e.worst > lim[2] and "ERROR" or "WARN"
		table.insert(list, e)
	end
end
table.sort(list, function(a, b) return a.first < b.first end)
local out = {}
for _, e in list do
	table.insert(out, string.format("%-5s %-20s %-34s f%d-f%d (%d frames) worst %.2f @f%d", e.severity, e.kind, e.detail, e.first, e.last, e.count, e.worst, e.worstFrame))
end
table.insert(out, string.format("foot slide total: L %.2f  R %.2f studs", slideTotal.LeftFoot, slideTotal.RightFoot))
table.insert(out, "hand gap per frame: " .. table.concat(handGap, " "))
table.insert(out, "ground offset per frame (raise root by): " .. table.concat(ground, " "))
for _, n in DUMP do table.insert(out, "dump " .. n .. ": " .. table.concat(dump[n], " ")) end
table.insert(out, "LeftFoot xz per frame: " .. table.concat(footXZ.LeftFoot, " "))
table.insert(out, "RightFoot xz per frame: " .. table.concat(footXZ.RightFoot, " "))
return #list == 0 and ("NO LIMB ISSUES\n" .. table.concat(out, "\n")) or table.concat(out, "\n")
