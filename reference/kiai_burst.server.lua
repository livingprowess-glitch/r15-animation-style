--!strict
--[[
	KIAI BURST — an original R15 power-up / aura-release animation
	------------------------------------------------------------------
	Built in the statistical style of workspace.animation_rigs:
	  • baked at 60 keyframes/sec, every keyframe holds a Pose for every R15 joint,
	    every Pose uses Linear easing (the corpus is 100 % Linear/In baked data)
	  • the "real" easing lives in the key-pose curves below, which are sampled
	    with ease-out / ease-in-out heavy shaping before baking
	  • wrists (LeftHand/RightHand) are never rotated, elbows and knees are pure hinges
	  • shoulders and hips carry the motion; a 3-frame snap carries the ~4.4k°/s peak

	Structure (frames @ 60 Hz, 73 keyframes, 1.2 s):
	  f0  – f3   neutral stance hold
	  f3  – f30  ANTICIPATION  crouch, hunch, arms cross over the chest, tension tremble
	  f30 – f34  ACTION        explosive release: arms fling wide, chest arches, head thrown back
	  f33 – f52  FOLLOW-THROUGH overshoot, rebound/absorb, elbows stay locked straight, root sinks
	  f52 – f72  SETTLE        asymmetric power stance: right fist raised, left fist chambered

	Run it:
	  • As a Script during Play: finds an R15 rig in Workspace (prefers one named "KiaiRig"),
	    registers the sequence and plays it every 2 seconds.
	  • From the Command Bar / edit mode: saves the KeyframeSequence into the rig's AnimSaves
	    so it opens in the Animation Editor.
]]

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local KeyframeSequenceProvider = game:GetService("KeyframeSequenceProvider")

-- Sampling rate and length (frames). The corpus is baked at exactly 60 Hz.
const FPS = 60
const LAST_FRAME = 72

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
		-- neutral hold: root rotation sits at rest for 3 frames
		{ 0, 0, 0, 0, "inOutCubic", 0, 0, 0 },
		{ 3, 0, 0, 0, "inQuad", 0, 0, 0 },
		-- ANTICIPATION: sink, fold forward and coil toward the lead (left) leg
		{ 14, -9, 8, 2, "linear", 0, -0.28, 0.05 },
		{ 24, -17, 10, 3, "linear", 0, -0.56, 0.1 },
		{ 27, -15, 11, 6, "linear", 0, -0.53, 0.1 },
		{ 30, -17, 10, 0, "linear", 0, -0.58, 0.1 },
		-- ACTION: pelvis springs up and arches past its mark...
		{ 33, 18, -6, -2, "outQuad", 0, 0.28, -0.06 },
		-- FOLLOW-THROUGH: ...then settles back and absorbs below neutral
		{ 37, 12, -8, -2, "inOutSine", 0, 0.12, -0.05 },
		{ 44, 6, -12, 0, "inOutSine", 0, -0.32, 0 },
		{ 52, -5, -18, 0, "outQuad", 0, -0.22, 0 },
		-- SETTLE: grounded, turned power stance
		{ LAST_FRAME, -8, -22, 0, "linear", 0, -0.14, 0 },
	},
	UpperTorso = {
		{ 0, -8, 0, 0, "inOutCubic" },
		{ 14, -17, -8, 0, "inOutSine" },
		{ 24, -27, -6, 0, "linear" },
		-- tension tremble before the release
		{ 26, -24, -2, 0, "linear" },
		{ 28, -28, -7, 0, "linear" },
		{ 30, -26, -5, 0, "linear" },
		-- chest arches past the hold pose, then comes back (overshoot)
		{ 33, 30, 6, 0, "outQuad" },
		{ 37, 22, 8, 0, "inOutSine" },
		{ 44, 12, 12, 0, "inOutCubic" },
		{ 52, -6, 18, 0, "outQuad" },
		{ LAST_FRAME, -12, 24, 0, "linear" },
	},
	Head = {
		{ 0, -10, 0, 0, "inOutCubic" },
		{ 14, -22, 10, 0, "inOutSine" },
		{ 24, -34, 6, 0, "linear" },
		{ 26, -30, 9, 0, "linear" },
		{ 28, -35, 3, 0, "linear" },
		{ 30, -32, 6, 0, "linear" },
		-- head thrown back on the shout, overshooting before it settles
		{ 33, 48, 0, 0, "outQuad" },
		{ 37, 36, -2, 0, "inOutSine" },
		{ 44, 22, -8, 0, "inOutCubic" },
		{ 52, 4, -18, 0, "outQuad" },
		{ LAST_FRAME, -14, -26, 0, "linear" },
	},
	LeftUpperArm = {
		{ 0, 22, -10, -30, "inQuad" },
		-- arms gather and cross over the chest
		{ 14, 50, 15, 10, "inOutSine" },
		{ 24, 72, 30, 32, "linear" },
		{ 26, 76, 33, 36, "linear" },
		{ 28, 70, 28, 30, "linear" },
		{ 30, 72, 30, 33, "linear" },
		-- the snap: ~200° fling in 3 frames, past the target...
		{ 33, 28, -16, -166, "outQuad" },
		-- ...and back (overshoot + follow-through)
		{ 37, 34, -12, -148, "inOutSine" },
		{ 45, 26, -10, -126, "inOutCubic" },
		{ 52, 16, -12, -100, "outQuad" },
		-- left fist chambered low at the hip
		{ LAST_FRAME, -40, -20, -26, "linear" },
	},
	RightUpperArm = {
		{ 0, 24, 8, 28, "inQuad" },
		{ 14, 54, -18, -8, "inOutSine" },
		{ 24, 76, -32, -30, "linear" },
		{ 26, 72, -29, -27, "linear" },
		{ 28, 77, -34, -33, "linear" },
		{ 31, 74, -32, -31, "linear" },
		-- right arm releases one frame after the left
		{ 34, 26, 18, 168, "outQuad" },
		{ 38, 40, 14, 150, "inOutSine" },
		{ 45, 34, 12, 130, "inOutCubic" },
		{ 52, 70, 14, 108, "outQuad" },
		-- right fist raised high
		{ LAST_FRAME, 150, 18, 36, "linear" },
	},
	LeftLowerArm = {
		{ 0, 40, 0, 0, "inQuad" },
		{ 14, 85, 0, 0, "inOutSine" },
		{ 24, 112, 0, 0, "linear" },
		{ 28, 108, 0, 0, "linear" },
		{ 30, 112, 0, 0, "outQuad" },
		-- locked straight through the follow-through
		{ 35, 0, 0, 0, "inOutCubic" },
		{ 45, 0, 0, 0, "outQuad" },
		{ 60, 116, 0, 0, "linear" },
		{ LAST_FRAME, 120, 0, 0, "linear" },
	},
	RightLowerArm = {
		{ 0, 42, 0, 0, "inQuad" },
		{ 14, 80, 0, 0, "inOutSine" },
		{ 24, 115, 0, 0, "linear" },
		{ 28, 110, 0, 0, "linear" },
		{ 31, 115, 0, 0, "outQuad" },
		{ 36, 0, 0, 0, "inOutCubic" },
		{ 46, 0, 0, 0, "outQuad" },
		{ 60, 112, 0, 0, "linear" },
		{ LAST_FRAME, 120, 0, 0, "linear" },
	},
	LeftUpperLeg = {
		{ 0, 14, 4, -8, "inOutCubic" },
		-- lead leg loads deep (weight shifts onto the left)
		{ 14, 40, 6, -12, "inQuad" },
		{ 24, 66, 8, -14, "linear" },
		{ 30, 68, 8, -15, "outQuad" },
		-- stance blows wide on the release
		{ 33, 4, -6, -34, "outQuad" },
		{ 42, 30, -2, -24, "inOutCubic" },
		{ 52, 12, 0, -20, "inOutCubic" },
		{ LAST_FRAME, 22, -8, -16, "linear" },
	},
	RightUpperLeg = {
		{ 0, 8, -4, 6, "inOutCubic" },
		{ 14, 18, -6, 14, "inQuad" },
		{ 24, 26, -8, 22, "linear" },
		{ 30, 27, -8, 23, "outQuad" },
		{ 33, -22, 6, 40, "outQuad" },
		{ 42, 10, 2, 30, "inOutCubic" },
		-- weight rocks onto the right leg, then it steps back into stance
		{ 52, 34, 0, 20, "inOutCubic" },
		{ LAST_FRAME, -12, 10, 14, "linear" },
	},
	LeftLowerLeg = {
		{ 0, 0, 0, 0, "inOutCubic" },
		{ 4, 0, 0, 0, "inQuad" },
		{ 24, -96, 0, 0, "linear" },
		{ 30, -98, 0, 0, "outQuad" },
		{ 35, -12, 0, 0, "inOutSine" },
		{ 42, -44, 0, 0, "inOutCubic" },
		-- knees lock straight for the settle (corpus knees are the least-involved active joints)
		{ 56, 0, 0, 0, "linear" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	RightLowerLeg = {
		{ 0, 0, 0, 0, "inOutCubic" },
		{ 4, 0, 0, 0, "linear" },
		{ 24, -52, 0, 0, "linear" },
		{ 30, -54, 0, 0, "outQuad" },
		{ 35, -4, 0, 0, "inOutSine" },
		{ 42, -28, 0, 0, "inOutCubic" },
		{ 50, -20, 0, 0, "outQuad" },
		{ 58, 0, 0, 0, "linear" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	LeftFoot = {
		{ 0, 6, 0, 3, "linear" },
		{ 24, 32, 0, 4, "linear" },
		{ 30, 33, 0, 4, "outQuad" },
		{ 35, -10, 0, -3, "inOutSine" },
		{ 42, 16, 0, 3, "inOutCubic" },
		{ 56, 4, 0, 3, "linear" },
		{ LAST_FRAME, 4, 0, 3, "linear" },
	},
	RightFoot = {
		{ 0, 5, 0, -3, "linear" },
		{ 24, 18, 0, -6, "linear" },
		{ 30, 19, 0, -6, "outQuad" },
		{ 35, -12, 0, 3, "inOutSine" },
		{ 42, 10, 0, -3, "inOutCubic" },
		{ 56, -8, 0, -4, "linear" },
		{ LAST_FRAME, -8, 0, -4, "linear" },
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
	sequence.Name = "Kiai_Burst"
	sequence.Loop = false
	sequence.Priority = Enum.AnimationPriority.Action
	for frame = 0, LAST_FRAME do
		local keyframe = Instance.new("Keyframe")
		keyframe.Time = frame / FPS
		buildPose("HumanoidRootPart", frame).Parent = keyframe
		-- markers for gameplay hooks on the phase boundaries
		if frame == 30 then
			keyframe.Name = "Release"
		elseif frame == 52 then
			keyframe.Name = "Settle"
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
assert(rig, "Kiai Burst: put an R15 rig in Workspace (optionally named KiaiRig)")
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
	while rig.Parent do
		track:Play(0.05)
		track.Stopped:Wait()
		task.wait(0.8)
	end
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
	print(`Kiai Burst saved to {saves:GetFullName()}`)
end
