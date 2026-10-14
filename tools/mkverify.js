const fs=require("fs");
const src=fs.readFileSync(process.argv[2],"utf8");
const builder=src.split("-- PLAYBACK")[0]+"\nreturn buildSequence()";
const exp=fs.readFileSync("export.lua","utf8");
const body=`
local full = [======[${src}]======]
local fnFull, errFull = loadstring(full)
if not fnFull then return "COMPILE FAIL: " .. tostring(errFull) end
local fn, err = loadstring([======[${builder}]======])
if not fn then return "BUILDER FAIL: " .. tostring(err) end
local ks = fn()
local HS = game:GetService("HttpService")
local function r(x) return math.floor(x*10000+0.5)/10000 end
local seq = { rig = "generated", name = ks.Name, loop = ks.Loop, priority = ks.Priority.Name, kfs = {} }
for _, kf in ks:GetChildren() do
	local k = { t = r(kf.Time), p = {} }
	for _, p in kf:GetDescendants() do
		local c = p.CFrame
		local rx, ry, rz = c:ToEulerAnglesXYZ()
		k.p[p.Name] = { r(c.X), r(c.Y), r(c.Z), r(math.deg(rx)), r(math.deg(ry)), r(math.deg(rz)), p.EasingStyle.Name, p.EasingDirection.Name, r(p.Weight) }
	end
	table.insert(seq.kfs, k)
end
table.sort(seq.kfs, function(a, b) return a.t < b.t end)
ks:Destroy()
return HS:JSONEncode({ seq })
`;
fs.writeFileSync("verify.lua",body);
