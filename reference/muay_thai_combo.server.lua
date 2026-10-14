--!strict
--[[
	MUAY THAI COMBO LOOP — original R15 combo built from the animation_rigs corpus
	------------------------------------------------------------------
	Beat structure follows the reference clip (one 160-frame phrase, looped);
	the poses are authored fresh from the corpus guard/stance and style stats, not traced.
	Same corpus format as the rest of the rig saves: 60 Hz baked keys, every R15 joint
	every frame, Linear pose easing, wrists untouched, elbows/knees single-axis hinges.

	Phrase (frames @ 60 Hz, 161 keyframes, 2.67 s, seamless loop):
	  f0   – f36   long guard: lean into an extended lead arm
	  f36  – f70   square into the high guard, bounce twice
	  f70  – f88   rear roundhouse kick (anticipation f60–70, snap f70–80, recoil f80–88)
	  f88  – f110  turn through into a clinch + left knee
	  f110 – f134  spinning back elbow (completes the 360° turn)
	  f134 – f160  open-arm reset back into the long guard

	Run it:
	  • As a Script during Play: finds an R15 rig in Workspace (prefers one named "KiaiRig"),
	    registers the sequence and loops it.
	  • From the Command Bar / edit mode: saves the KeyframeSequence into the rig's AnimSaves
	    so it opens in the Animation Editor.
]]

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local KeyframeSequenceProvider = game:GetService("KeyframeSequenceProvider")

-- Sampling rate and length (frames). The corpus is baked at exactly 60 Hz.
const FPS = 60
const LAST_FRAME = 160

-- Pose nesting must mirror the R15 Motor6D chain; Pose names are the Part1 names.
const HIERARCHY: { [string]: { string } } = {
	HumanoidRootPart = { "LowerTorso" },
	LowerTorso = { "UpperTorso", "LeftUpperLeg", "RightUpperLeg" },
	UpperTorso = { "Head", "LeftUpperArm", "RightUpperArm" },
	LeftUpperArm = { "LeftLowerArm" },
	LeftLowerArm = { "LeftHand" },
	RightUpperArm = { "RightLowerArm" },
	RightLowerArm = { "RightHand" },
	LeftUpperLeg = { "LeftLowerLeg" },
	LeftLowerLeg = { "LeftFoot" },
	RightUpperLeg = { "RightLowerLeg" },
	RightLowerLeg = { "RightFoot" },
}

-- Easing curves applied to the segment that LEAVES a key (alpha 0..1 -> progress).
const EASE: { [string]: (number) -> number } = {
	linear = function(x) return x end,
	inQuad = function(x) return x * x end,
	outQuad = function(x) return 1 - (1 - x) * (1 - x) end,
	outCubic = function(x) return 1 - (1 - x) ^ 3 end,
	inOutSine = function(x) return -(math.cos(math.pi * x) - 1) / 2 end,
	inOutCubic = function(x) return if x < 0.5 then 4 * x ^ 3 else 1 - (-2 * x + 2) ^ 3 / 2 end,
	outBack = function(x)
		local c1 = 1.70158
		return 1 + (c1 + 1) * (x - 1) ^ 3 + c1 * (x - 1) ^ 2
	end,
}

-- A key: { frame, rx, ry, rz, easeName, px?, py?, pz? }  (degrees / studs, joint space)
-- Axis conventions on these rigs: +X on a shoulder/hip raises the limb forward,
-- -Z abducts the LEFT limb and +Z the RIGHT one, +X on an elbow bends it, -X bends a knee,
-- -X on Root/Waist/Neck leans forward / looks down.
type Key = { any }
const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		-- long guard: bladed (left side leading), leaning into the extended lead arm
		{ 0, -6, -35, 0, "outQuad", 0, -0.15, 0 },
		{ 10, -12, -40, 4, "inOutSine", 0, -0.2, 0.05 },
		{ 30, -10, -40, 4, "inOutSine", 0, -0.18, 0.05 },
		-- square into the high guard and bounce on the beat
		{ 40, 0, -35, 0, "inOutSine", 0, -0.25, 0 },
		{ 50, 0, -33, 0, "inOutSine", 0, -0.1, 0 },
		{ 60, 0, -35, 0, "inOutSine", 0, -0.25, 0 },
		-- ANTICIPATION (kick): small counter-turn away from the kick
		{ 70, 2, -40, 0, "inQuad", 0, -0.15, 0 },
		-- ACTION (rear roundhouse): hips whip through and the body leans away
		{ 74, 6, 10, -14, "outQuad", 0, -0.05, 0 },
		{ 78, 8, 52, -24, "outQuad", 0, 0, 0 },
		{ 81, 6, 45, -20, "inOutCubic", 0, 0, 0 },
		-- FOLLOW-THROUGH: recoil and keep turning into the knee
		{ 88, 0, 60, -8, "inOutCubic", 0, -0.1, 0 },
		{ 96, -10, 120, 0, "outQuad", 0, 0.05, 0 },
		{ 104, -12, 130, 0, "inQuad", 0, 0, 0 },
		-- spinning back elbow: the rest of the 360 degree turn
		{ 118, -4, 220, 0, "linear", 0, -0.12, 0 },
		{ 123, -6, 312, 0, "outQuad", 0, -0.15, 0 },
		{ 127, -6, 300, 0, "inOutSine", 0, -0.15, 0 },
		{ 134, 0, 325, 0, "inOutSine", 0, -0.1, 0 },
		-- open-arm reset, then back into the long guard (325 == -35, so the loop is seamless)
		{ 146, 2, 325, 0, "inOutSine", 0, -0.05, 0 },
		{ LAST_FRAME, -6, 325, 0, "linear", 0, -0.15, 0 },
	},
	UpperTorso = {
		{ 0, -10, -5, 0, "outQuad" },
		{ 10, -18, -10, 0, "inOutSine" },
		{ 30, -16, -10, 0, "inOutSine" },
		{ 40, 0, -5, 0, "inOutSine" },
		{ 60, 0, -5, 0, "inOutSine" },
		{ 70, -4, -15, 0, "inQuad" },
		{ 74, -6, 30, 0, "outQuad" },
		{ 80, -10, 30, 0, "inOutCubic" },
		{ 88, -4, 10, 0, "outQuad" },
		{ 96, -20, 10, 0, "outQuad" },
		-- wind the chest the other way before the spin
		{ 104, -18, -20, 0, "inQuad" },
		{ 116, -6, 20, 0, "linear" },
		{ 123, -10, 45, 0, "outQuad" },
		{ 127, -10, 35, 0, "inOutSine" },
		{ 134, -6, 10, 0, "inOutSine" },
		{ 146, 4, 0, 0, "inOutSine" },
		{ LAST_FRAME, -10, -5, 0, "linear" },
	},
	Head = {
		-- the neck counter-turns to keep the eyes on the opponent
		{ 0, -10, 30, 0, "outQuad" },
		{ 10, -14, 40, 0, "inOutSine" },
		{ 30, -12, 40, 0, "inOutSine" },
		{ 40, -15, 30, 5, "inOutSine" },
		{ 60, -15, 30, 5, "inOutSine" },
		{ 70, -14, 40, 0, "inQuad" },
		{ 76, -10, -10, 0, "outQuad" },
		{ 80, -8, -30, 0, "inOutCubic" },
		{ 88, -10, -20, 0, "outQuad" },
		{ 96, -15, -50, 0, "outQuad" },
		{ 104, -12, -40, 0, "outQuad" },
		-- head leads the spin
		{ 112, -10, 60, 0, "outQuad" },
		{ 126, -12, 40, 0, "inOutSine" },
		{ 134, -10, 20, 0, "inOutSine" },
		{ 146, -5, 30, 0, "inOutSine" },
		{ LAST_FRAME, -10, 30, 0, "linear" },
	},
	LeftUpperArm = {
		{ 0, 30, 10, -30, "outQuad" },
		-- lead arm extends into the long guard
		{ 8, 88, 25, -10, "inOutSine" },
		{ 30, 86, 25, -10, "inOutSine" },
		-- high guard
		{ 40, 80, -35, -30, "inOutSine" },
		{ 60, 80, -38, -30, "inOutSine" },
		{ 70, 78, -40, -32, "inQuad" },
		{ 76, 90, -30, -40, "outQuad" },
		{ 80, 95, -25, -45, "inOutCubic" },
		{ 88, 80, -35, -30, "outQuad" },
		-- both hands pull down into the clinch for the knee
		{ 96, 60, 20, 10, "outQuad" },
		{ 104, 55, 25, 12, "inQuad" },
		{ 116, 40, -10, -50, "linear" },
		{ 126, 30, -10, -60, "outQuad" },
		{ 134, 40, -10, -50, "inOutSine" },
		-- arms open wide
		{ 146, 10, 0, -85, "inOutSine" },
		{ LAST_FRAME, 30, 10, -30, "linear" },
	},
	LeftLowerArm = {
		{ 0, 60, 0, 0, "outQuad" },
		{ 8, 0, 0, 0, "inOutSine" },
		{ 30, 0, 0, 0, "inOutSine" },
		{ 40, 85, 0, 0, "inOutSine" },
		{ 70, 85, 0, 0, "inQuad" },
		{ 76, 95, 0, 0, "inOutCubic" },
		{ 88, 85, 0, 0, "outQuad" },
		{ 96, 110, 0, 0, "inQuad" },
		{ 104, 110, 0, 0, "linear" },
		{ 116, 90, 0, 0, "outQuad" },
		{ 134, 70, 0, 0, "inOutSine" },
		{ 146, 25, 0, 0, "inOutSine" },
		{ LAST_FRAME, 60, 0, 0, "linear" },
	},
	RightUpperArm = {
		-- rear hand at the chin
		{ 0, 70, 30, 40, "outQuad" },
		{ 10, 95, 35, 30, "inOutSine" },
		{ 30, 95, 35, 30, "inOutSine" },
		{ 40, 110, 22, -35, "inOutSine" },
		{ 60, 110, 22, -35, "inOutSine" },
		{ 70, 105, 20, -30, "inQuad" },
		-- kicking-side arm swings down and back for counterbalance
		{ 74, -30, -10, 30, "outQuad" },
		{ 78, -55, -10, 38, "outQuad" },
		{ 81, -45, -10, 35, "inOutCubic" },
		{ 88, 30, 10, 10, "outQuad" },
		{ 96, 60, -20, -10, "outQuad" },
		{ 104, 55, -25, -12, "inQuad" },
		-- spinning back elbow: upper arm horizontal, swung through the target
		{ 118, 90, 30, 95, "linear" },
		{ 123, 95, -45, 92, "outQuad" },
		{ 127, 95, -30, 90, "inOutSine" },
		{ 134, 80, 0, 60, "inOutSine" },
		{ 146, 10, 0, 85, "inOutSine" },
		{ LAST_FRAME, 70, 30, 40, "linear" },
	},
	RightLowerArm = {
		{ 0, 110, 0, 0, "outQuad" },
		{ 10, 120, 0, 0, "inOutSine" },
		{ 30, 120, 0, 0, "inOutSine" },
		{ 40, 70, 0, 0, "inOutSine" },
		{ 70, 75, 0, 0, "outQuad" },
		{ 74, 0, 0, 0, "outQuad" },
		{ 84, 0, 0, 0, "inOutCubic" },
		{ 88, 60, 0, 0, "outQuad" },
		{ 96, 110, 0, 0, "linear" },
		{ 104, 110, 0, 0, "linear" },
		{ 116, 135, 0, 0, "outQuad" },
		{ 126, 140, 0, 0, "inOutSine" },
		{ 134, 110, 0, 0, "inOutSine" },
		{ 146, 25, 0, 0, "inOutSine" },
		{ LAST_FRAME, 110, 0, 0, "linear" },
	},
	LeftUpperLeg = {
		{ 0, 20, 10, -10, "outQuad" },
		{ 10, 25, 10, -12, "inOutSine" },
		{ 30, 25, 10, -12, "inOutSine" },
		{ 40, 18, 20, -12, "inOutSine" },
		{ 50, 14, 20, -12, "inOutSine" },
		{ 60, 18, 20, -12, "inOutSine" },
		-- lead foot pivots under the kick
		{ 70, 22, 20, -14, "inQuad" },
		{ 76, 10, -20, -12, "outQuad" },
		{ 80, 6, -30, -10, "inOutCubic" },
		{ 89, 14, -20, -12, "linear" },
		-- ACTION (knee): left knee drives up
		{ 93, 112, 0, -5, "outQuad" },
		{ 96, 105, 0, -5, "outQuad" },
		{ 104, 100, 0, -5, "inQuad" },
		{ 110, 20, 0, -10, "linear" },
		{ 116, 10, 10, -10, "outQuad" },
		{ 126, 20, 10, -12, "inOutSine" },
		{ 146, 18, 5, -10, "inOutSine" },
		{ LAST_FRAME, 20, 10, -10, "linear" },
	},
	LeftLowerLeg = {
		{ 0, 0, 0, 0, "outQuad" },
		{ 30, 0, 0, 0, "inOutSine" },
		{ 40, -30, 0, 0, "inOutSine" },
		{ 50, -20, 0, 0, "inOutSine" },
		{ 60, -30, 0, 0, "inOutSine" },
		{ 70, -35, 0, 0, "inQuad" },
		{ 74, 0, 0, 0, "outQuad" },
		{ 86, 0, 0, 0, "inOutCubic" },
		{ 89, -40, 0, 0, "outQuad" },
		{ 93, -125, 0, 0, "outQuad" },
		{ 96, -120, 0, 0, "outQuad" },
		{ 104, -115, 0, 0, "inQuad" },
		{ 110, -30, 0, 0, "linear" },
		{ 116, -25, 0, 0, "outQuad" },
		{ 126, -35, 0, 0, "inOutSine" },
		{ 146, 0, 0, 0, "inOutSine" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	RightUpperLeg = {
		{ 0, -15, -10, 6, "outQuad" },
		{ 10, -20, -10, 6, "inOutSine" },
		{ 30, -20, -10, 6, "inOutSine" },
		{ 40, -12, -20, 8, "inOutSine" },
		{ 50, -8, -20, 8, "inOutSine" },
		{ 60, -12, -20, 8, "inOutSine" },
		{ 70, -18, -20, 8, "inQuad" },
		-- roundhouse: chamber high and out...
		{ 73, 60, 10, 45, "linear" },
		-- ...and extend through the target, overshooting before the recoil
		{ 77, 82, 25, 85, "outQuad" },
		{ 81, 75, 20, 75, "inOutCubic" },
		{ 88, 30, 5, 30, "outQuad" },
		{ 96, -10, 0, 10, "outQuad" },
		{ 110, -5, 0, 8, "linear" },
		{ 116, 15, 0, 10, "outQuad" },
		{ 126, -15, -10, 8, "inOutSine" },
		{ 146, -10, -5, 6, "inOutSine" },
		{ LAST_FRAME, -15, -10, 6, "linear" },
	},
	RightLowerLeg = {
		{ 0, 0, 0, 0, "outQuad" },
		{ 30, 0, 0, 0, "inOutSine" },
		{ 40, -30, 0, 0, "inOutSine" },
		{ 50, -20, 0, 0, "inOutSine" },
		{ 60, -30, 0, 0, "inOutSine" },
		{ 70, -40, 0, 0, "inQuad" },
		{ 73, -115, 0, 0, "linear" },
		-- the shin whips straight on impact
		{ 77, 0, 0, 0, "outQuad" },
		{ 81, -8, 0, 0, "inOutCubic" },
		{ 88, -90, 0, 0, "outQuad" },
		{ 96, -20, 0, 0, "outQuad" },
		{ 110, -20, 0, 0, "linear" },
		{ 116, -40, 0, 0, "outQuad" },
		{ 126, -25, 0, 0, "inOutSine" },
		{ 146, 0, 0, 0, "inOutSine" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	LeftFoot = {
		{ 0, 8, 0, 3, "inOutSine" },
		{ 40, 10, 0, 3, "inOutSine" },
		{ 70, 12, 0, 3, "outQuad" },
		{ 80, -20, 0, 3, "inOutCubic" },
		{ 96, 40, 0, 3, "outQuad" },
		{ 110, 8, 0, 3, "inOutSine" },
		{ LAST_FRAME, 8, 0, 3, "linear" },
	},
	RightFoot = {
		{ 0, 15, 0, -3, "inOutSine" },
		{ 70, 20, 0, -3, "outQuad" },
		{ 80, 40, 0, -3, "inOutCubic" },
		{ 96, 5, 0, -3, "inOutSine" },
		{ 126, 15, 0, -3, "inOutSine" },
		{ LAST_FRAME, 15, 0, -3, "linear" },
	},
}

-- Euler (degrees, XYZ order) + optional translation -> Pose CFrame offset.
local function eulerToCFrame(rx: number, ry: number, rz: number, px: number?, py: number?, pz: number?): CFrame
	return CFrame.new(px or 0, py or 0, pz or 0) * CFrame.Angles(math.rad(rx), math.rad(ry), math.rad(rz))
end

-- Sample one joint track at a frame: find the surrounding keys, ease, and lerp each channel.
local function sampleTrack(keys: { Key }, frame: number): CFrame
	if frame <= keys[1][1] then
		local k = keys[1]
		return eulerToCFrame(k[2], k[3], k[4], k[6], k[7], k[8])
	end
	for i = 1, #keys - 1 do
		local a, b = keys[i], keys[i + 1]
		if frame <= b[1] then
			local alpha = EASE[a[5]]((frame - a[1]) / (b[1] - a[1]))
			local function mix(index: number): number
				local va, vb = a[index] or 0, b[index] or 0
				return va + (vb - va) * alpha
			end
			return eulerToCFrame(mix(2), mix(3), mix(4), mix(6), mix(7), mix(8))
		end
	end
	local k = keys[#keys]
	return eulerToCFrame(k[2], k[3], k[4], k[6], k[7], k[8])
end

-- Build one Pose (and its children) for a frame, recursing down the R15 hierarchy.
local function buildPose(partName: string, frame: number): Pose
	local pose = Instance.new("Pose")
	pose.Name = partName
	pose.Weight = 1
	pose.EasingStyle = Enum.PoseEasingStyle.Linear
	pose.EasingDirection = Enum.PoseEasingDirection.In
	local keys = TRACKS[partName]
	pose.CFrame = if keys then sampleTrack(keys, frame) else CFrame.identity
	for _, childName in HIERARCHY[partName] or {} do
		buildPose(childName, frame).Parent = pose
	end
	return pose
end

-- Bake the key-pose curves into a dense 60 Hz KeyframeSequence (corpus format).
local function buildSequence(): KeyframeSequence
	local sequence = Instance.new("KeyframeSequence")
	sequence.Name = "MuayThai_Combo"
	sequence.Loop = true
	sequence.Priority = Enum.AnimationPriority.Action
	for frame = 0, LAST_FRAME do
		local keyframe = Instance.new("Keyframe")
		keyframe.Time = frame / FPS
		buildPose("HumanoidRootPart", frame).Parent = keyframe
		-- markers for gameplay hooks on the phase boundaries
		if frame == 80 then
			keyframe.Name = "Kick"
		elseif frame == 96 then
			keyframe.Name = "Knee"
		elseif frame == 126 then
			keyframe.Name = "Elbow"
		end
		keyframe.Parent = sequence
	end
	return sequence
end

-- PLAYBACK ---------------------------------------------------------------

-- Prefer a rig named "KiaiRig", otherwise the first non-player R15 Humanoid model in Workspace.
local function findRig(): Model?
	local named = workspace:FindFirstChild("KiaiRig")
	if named and named:IsA("Model") then
		return named
	end
	for _, descendant in workspace:GetDescendants() do
		if descendant:IsA("Humanoid") and descendant.RigType == Enum.HumanoidRigType.R15 then
			local model = descendant.Parent
			if model and model:IsA("Model") and not Players:GetPlayerFromCharacter(model) then
				return model
			end
		end
	end
	return nil
end

local rig = findRig()
assert(rig, "Muay Thai combo: put an R15 rig in Workspace (optionally named KiaiRig)")
local humanoid = rig:FindFirstChildOfClass("Humanoid") :: Humanoid
local sequence = buildSequence()

if RunService:IsRunning() then
	-- In Play: register the in-memory sequence and drive it through the Animator.
	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator")
	animator.Parent = humanoid
	local animation = Instance.new("Animation")
	animation.AnimationId = KeyframeSequenceProvider:RegisterKeyframeSequence(sequence)
	local track = (animator :: Animator):LoadAnimation(animation)
	track.Priority = Enum.AnimationPriority.Action
	track.Looped = true
	track:Play(0.1)
else
	-- In edit mode: store it where the Animation Editor looks for saves.
	local saves = rig:FindFirstChild("AnimSaves") or Instance.new("ObjectValue")
	saves.Name = "AnimSaves"
	saves.Parent = rig
	local old = saves:FindFirstChild(sequence.Name)
	if old then
		old:Destroy()
	end
	sequence.Parent = saves
	print(`Muay Thai combo saved to {saves:GetFullName()}`)
end
