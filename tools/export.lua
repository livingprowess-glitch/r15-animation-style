local HS = game:GetService("HttpService")
local function r(x) return math.floor(x*10000+0.5)/10000 end
local out = {}
for ri, rig in workspace.animation_rigs:GetChildren() do
	local saves = rig:FindFirstChild("AnimSaves")
	if saves then
		for _, ks in saves:GetChildren() do
			if ks:IsA("KeyframeSequence") then
				local seq = { rig = rig.Name .. "#" .. ri, name = ks.Name, loop = ks.Loop, priority = ks.Priority.Name, kfs = {} }
				for _, kf in ks:GetChildren() do
					if kf:IsA("Keyframe") then
						local k = { t = r(kf.Time), p = {} }
						for _, p in kf:GetDescendants() do
							if p:IsA("Pose") then
								local c = p.CFrame
								local rx, ry, rz = c:ToEulerAnglesXYZ()
								k.p[p.Name] = { r(c.X), r(c.Y), r(c.Z), r(math.deg(rx)), r(math.deg(ry)), r(math.deg(rz)), p.EasingStyle.Name, p.EasingDirection.Name, r(p.Weight) }
							end
						end
						table.insert(seq.kfs, k)
					end
				end
				table.sort(seq.kfs, function(a, b) return a.t < b.t end)
				table.insert(out, seq)
			end
		end
	end
end
return HS:JSONEncode(out)
