local AnimReader = (function()
local KeyframeSequenceProvider = game:GetService("KeyframeSequenceProvider")
local RunService = game:GetService("RunService")

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

const EASE: { [string]: (number) -> number } = {
	linear = function(x) return x end,
	inQuad = function(x) return x * x end,
	outQuad = function(x) return 1 - (1 - x) * (1 - x) end,
	outCubic = function(x) return 1 - (1 - x) ^ 3 end,
	inOutSine = function(x) return -(math.cos(math.pi * x) - 1) / 2 end,
	inOutCubic = function(x) return if x < 0.5 then 4 * x ^ 3 else 1 - (-2 * x + 2) ^ 3 / 2 end,
	outBack = function(x) return 1 + 2.70158 * (x - 1) ^ 3 + 1.70158 * (x - 1) ^ 2 end,
}

export type Key = { any }
export type AnimData = {
	name: string,
	fps: number?,
	lastFrame: number,
	loop: boolean?,
	priority: Enum.AnimationPriority?,
	assetId: string?,
	markers: { [number]: string }?,
	tracks: { [string]: { Key } },
}

local AnimReader = {}

local registered: { [AnimData]: Animation } = {}

local function toCFrame(rx: number, ry: number, rz: number, px: number?, py: number?, pz: number?): CFrame
	return CFrame.new(px or 0, py or 0, pz or 0) * CFrame.Angles(math.rad(rx), math.rad(ry), math.rad(rz))
end

local function sampleTrack(keys: { Key }, frame: number): CFrame
	local first = keys[1]
	if frame <= first[1] then
		return toCFrame(first[2], first[3], first[4], first[6], first[7], first[8])
	end
	for i = 1, #keys - 1 do
		local a, b = keys[i], keys[i + 1]
		if frame <= b[1] then
			local alpha = (EASE[a[5]] or EASE.linear)((frame - a[1]) / (b[1] - a[1]))
			local function mix(index: number): number
				local from, to = a[index] or 0, b[index] or 0
				return from + (to - from) * alpha
			end
			return toCFrame(mix(2), mix(3), mix(4), mix(6), mix(7), mix(8))
		end
	end
	local last = keys[#keys]
	return toCFrame(last[2], last[3], last[4], last[6], last[7], last[8])
end

local function buildPose(tracks: { [string]: { Key } }, partName: string, frame: number): Pose
	local pose = Instance.new("Pose")
	pose.Name = partName
	pose.Weight = 1
	pose.EasingStyle = Enum.PoseEasingStyle.Linear
	pose.EasingDirection = Enum.PoseEasingDirection.In
	local keys = tracks[partName]
	pose.CFrame = if keys then sampleTrack(keys, frame) else CFrame.identity
	for _, childName in HIERARCHY[partName] or {} do
		buildPose(tracks, childName, frame).Parent = pose
	end
	return pose
end

function AnimReader.resolve(source: AnimData | string | ModuleScript): AnimData
	if typeof(source) == "string" then
		const module = script:FindFirstChild("Animations") and script.Animations:FindFirstChild(source)
		assert(module, `AnimReader: no animation named {source}`)
		return require(module) :: AnimData
	elseif typeof(source) == "Instance" then
		return require(source) :: AnimData
	end
	return source
end

function AnimReader.build(source: AnimData | string | ModuleScript): KeyframeSequence
	const data = AnimReader.resolve(source)
	local sequence = Instance.new("KeyframeSequence")
	sequence.Name = data.name
	sequence.Loop = data.loop == true
	sequence.Priority = data.priority or Enum.AnimationPriority.Action
	const fps = data.fps or 60
	for frame = 0, data.lastFrame do
		local keyframe = Instance.new("Keyframe")
		keyframe.Time = frame / fps
		const marker = data.markers and data.markers[frame]
		if marker then
			keyframe.Name = marker
		end
		buildPose(data.tracks, "HumanoidRootPart", frame).Parent = keyframe
		keyframe.Parent = sequence
	end
	return sequence
end

function AnimReader.animation(source: AnimData | string | ModuleScript): Animation
	const data = AnimReader.resolve(source)
	local cached = registered[data]
	if cached then
		return cached
	end
	local animation = Instance.new("Animation")
	animation.Name = data.name
	if data.assetId then
		animation.AnimationId = data.assetId
	else
		assert(RunService:IsStudio(), `AnimReader: {data.name} has no assetId; in-memory sequences only play in Studio`)
		animation.AnimationId = KeyframeSequenceProvider:RegisterKeyframeSequence(AnimReader.build(data))
	end
	registered[data] = animation
	return animation
end

function AnimReader.animator(target: Instance): Animator
	if target:IsA("Animator") then
		return target
	end
	local humanoid = if target:IsA("Humanoid") then target else target:FindFirstChildOfClass("Humanoid")
	assert(humanoid, `AnimReader: {target:GetFullName()} has no Humanoid`)
	local animator = humanoid:FindFirstChildOfClass("Animator")
	if not animator then
		animator = Instance.new("Animator")
		animator.Parent = humanoid
	end
	return animator :: Animator
end

function AnimReader.load(target: Instance, source: AnimData | string | ModuleScript): AnimationTrack
	const data = AnimReader.resolve(source)
	local track = AnimReader.animator(target):LoadAnimation(AnimReader.animation(data))
	track.Priority = data.priority or Enum.AnimationPriority.Action
	track.Looped = data.loop == true
	return track
end

function AnimReader.play(target: Instance, source: AnimData | string | ModuleScript, fadeTime: number?): AnimationTrack
	local track = AnimReader.load(target, source)
	track:Play(fadeTime or 0.1)
	return track
end

function AnimReader.save(rig: Model, source: AnimData | string | ModuleScript): KeyframeSequence
	local saves = rig:FindFirstChild("AnimSaves")
	if not saves then
		saves = Instance.new("ObjectValue")
		saves.Name = "AnimSaves"
		saves.Parent = rig
	end
	local sequence = AnimReader.build(source)
	local old = saves:FindFirstChild(sequence.Name)
	if old then
		old:Destroy()
	end
	sequence.Parent = saves
	return sequence
end

return AnimReader

end)()
local DATA = (function()
return {
	name = "Boxing_Jab_Orthodox",
	fps = 60,
	lastFrame = 60,
	loop = false,
	priority = Enum.AnimationPriority.Action,
	markers = { [16] = "Hit" },
	tracks = {
		LowerTorso = {
			{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
			{ 12, -1, -21, 1, "linear", 0.02, -0.2, 0.45 },
			{ 16, -3, -34, 0, "outQuad", 0, -0.19, 0.33 },
			{ 19, -3, -32, 0, "outQuad", 0, -0.19, 0.35 },
			{ 32, -2, -27, 0.5, "inOutSine", 0.01, -0.18, 0.41 },
			{ 44, -1, -23.5, 1, "inOutSine", 0.02, -0.18, 0.44 },
			{ 60, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
		},
		UpperTorso = {
			{ 0, -4, 9, -1, "inOutSine" },
			{ 12, -4, 12, -1, "linear" },
			{ 16, -6, -2, 0, "outQuad" },
			{ 19, -6, 0, 0, "outQuad" },
			{ 32, -5, 6, -0.5, "inOutSine" },
			{ 44, -4, 9.5, -1, "inOutSine" },
			{ 60, -4, 9, -1, "linear" },
		},
		Head = {
			{ 0, -7, 15, 0.5, "inOutSine" },
			{ 12, -8, 13, 0.5, "linear" },
			{ 16, -10, 34, 0, "outQuad" },
			{ 19, -10, 32, 0, "outQuad" },
			{ 32, -8, 22, 0.3, "inOutSine" },
			{ 44, -7, 15, 0.5, "inOutSine" },
			{ 60, -7, 15, 0.5, "linear" },
		},
		LeftUpperArm = {
			{ 0, 68.4, -24.46, 23.46, "linear" },
			{ 1, 68.35, -24.46, 23.57, "linear" },
			{ 2, 68.2, -24.46, 23.87, "linear" },
			{ 3, 67.97, -24.47, 24.36, "linear" },
			{ 4, 67.68, -24.48, 25.02, "linear" },
			{ 5, 67.35, -24.49, 25.8, "linear" },
			{ 6, 67.01, -24.52, 26.66, "linear" },
			{ 7, 66.68, -24.55, 27.56, "linear" },
			{ 8, 66.39, -24.58, 28.41, "linear" },
			{ 9, 66.15, -24.62, 29.16, "linear" },
			{ 10, 65.97, -24.65, 29.75, "linear" },
			{ 11, 65.86, -24.67, 30.13, "linear" },
			{ 12, 65.82, -24.67, 30.26, "linear" },
			{ 13, 63.74, -34.56, -2.7, "linear" },
			{ 14, 64.76, -45.52, -16.95, "linear" },
			{ 15, 70.77, -55.17, -18.21, "linear" },
			{ 16, 77.74, -59.79, -13.76, "linear" },
			{ 17, 71.15, -57.53, -17.5, "linear" },
			{ 18, 68.97, -56.7, -18.16, "linear" },
			{ 19, 68.41, -56.48, -18.24, "linear" },
			{ 20, 65.88, -50.08, -16.73, "linear" },
			{ 21, 65.56, -45.05, -12.85, "linear" },
			{ 22, 65.94, -40.9, -8.1, "linear" },
			{ 23, 66.55, -37.41, -3.05, "linear" },
			{ 24, 67.19, -34.47, 1.99, "linear" },
			{ 25, 67.8, -32, 6.82, "linear" },
			{ 26, 68.34, -29.96, 11.27, "linear" },
			{ 27, 68.78, -28.31, 15.22, "linear" },
			{ 28, 69.14, -27, 18.58, "linear" },
			{ 29, 69.41, -26.02, 21.25, "linear" },
			{ 30, 69.6, -25.34, 23.2, "linear" },
			{ 31, 69.71, -24.93, 24.38, "linear" },
			{ 32, 69.75, -24.8, 24.78, "linear" },
			{ 33, 69.72, -24.79, 24.76, "linear" },
			{ 34, 69.65, -24.78, 24.69, "linear" },
			{ 35, 69.55, -24.75, 24.59, "linear" },
			{ 36, 69.4, -24.72, 24.45, "linear" },
			{ 37, 69.24, -24.67, 24.29, "linear" },
			{ 38, 69.06, -24.63, 24.12, "linear" },
			{ 39, 68.89, -24.59, 23.95, "linear" },
			{ 40, 68.73, -24.54, 23.79, "linear" },
			{ 41, 68.59, -24.51, 23.66, "linear" },
			{ 42, 68.49, -24.48, 23.55, "linear" },
			{ 43, 68.42, -24.46, 23.48, "linear" },
			{ 44, 68.4, -24.46, 23.46, "linear" },
			{ 45, 68.4, -24.46, 23.46, "linear" },
			{ 46, 68.4, -24.46, 23.46, "linear" },
			{ 47, 68.4, -24.46, 23.46, "linear" },
			{ 48, 68.4, -24.46, 23.46, "linear" },
			{ 49, 68.4, -24.46, 23.46, "linear" },
			{ 50, 68.4, -24.46, 23.46, "linear" },
			{ 51, 68.4, -24.46, 23.46, "linear" },
			{ 52, 68.4, -24.46, 23.46, "linear" },
			{ 53, 68.4, -24.46, 23.46, "linear" },
			{ 54, 68.4, -24.46, 23.46, "linear" },
			{ 55, 68.4, -24.46, 23.46, "linear" },
			{ 56, 68.4, -24.46, 23.46, "linear" },
			{ 57, 68.4, -24.46, 23.46, "linear" },
			{ 58, 68.4, -24.46, 23.46, "linear" },
			{ 59, 68.4, -24.46, 23.46, "linear" },
			{ 60, 68.4, -24.46, 23.46, "linear" },
		},
		LeftLowerArm = {
			{ 0, 93.25, 0, 0, "linear" },
			{ 1, 93.39, 0, 0, "linear" },
			{ 2, 93.8, 0, 0, "linear" },
			{ 3, 94.46, 0, 0, "linear" },
			{ 4, 95.32, 0, 0, "linear" },
			{ 5, 96.31, 0, 0, "linear" },
			{ 6, 97.36, 0, 0, "linear" },
			{ 7, 98.4, 0, 0, "linear" },
			{ 8, 99.36, 0, 0, "linear" },
			{ 9, 100.18, 0, 0, "linear" },
			{ 10, 100.8, 0, 0, "linear" },
			{ 11, 101.19, 0, 0, "linear" },
			{ 12, 101.32, 0, 0, "linear" },
			{ 13, 77.91, 0, 0, "linear" },
			{ 14, 54.02, 0, 0, "linear" },
			{ 15, 31.84, 0, 0, "linear" },
			{ 16, 19.49, 0, 0, "linear" },
			{ 17, 30.66, 0, 0, "linear" },
			{ 18, 35.5, 0, 0, "linear" },
			{ 19, 36.94, 0, 0, "linear" },
			{ 20, 50.02, 0, 0, "linear" },
			{ 21, 59.53, 0, 0, "linear" },
			{ 22, 66.99, 0, 0, "linear" },
			{ 23, 73.03, 0, 0, "linear" },
			{ 24, 77.99, 0, 0, "linear" },
			{ 25, 82.07, 0, 0, "linear" },
			{ 26, 85.4, 0, 0, "linear" },
			{ 27, 88.09, 0, 0, "linear" },
			{ 28, 90.2, 0, 0, "linear" },
			{ 29, 91.79, 0, 0, "linear" },
			{ 30, 92.9, 0, 0, "linear" },
			{ 31, 93.56, 0, 0, "linear" },
			{ 32, 93.78, 0, 0, "linear" },
			{ 33, 93.77, 0, 0, "linear" },
			{ 34, 93.74, 0, 0, "linear" },
			{ 35, 93.7, 0, 0, "linear" },
			{ 36, 93.65, 0, 0, "linear" },
			{ 37, 93.59, 0, 0, "linear" },
			{ 38, 93.52, 0, 0, "linear" },
			{ 39, 93.45, 0, 0, "linear" },
			{ 40, 93.39, 0, 0, "linear" },
			{ 41, 93.33, 0, 0, "linear" },
			{ 42, 93.28, 0, 0, "linear" },
			{ 43, 93.26, 0, 0, "linear" },
			{ 44, 93.25, 0, 0, "linear" },
			{ 45, 93.25, 0, 0, "linear" },
			{ 46, 93.25, 0, 0, "linear" },
			{ 47, 93.25, 0, 0, "linear" },
			{ 48, 93.25, 0, 0, "linear" },
			{ 49, 93.25, 0, 0, "linear" },
			{ 50, 93.25, 0, 0, "linear" },
			{ 51, 93.25, 0, 0, "linear" },
			{ 52, 93.25, 0, 0, "linear" },
			{ 53, 93.25, 0, 0, "linear" },
			{ 54, 93.25, 0, 0, "linear" },
			{ 55, 93.25, 0, 0, "linear" },
			{ 56, 93.25, 0, 0, "linear" },
			{ 57, 93.25, 0, 0, "linear" },
			{ 58, 93.25, 0, 0, "linear" },
			{ 59, 93.25, 0, 0, "linear" },
			{ 60, 93.25, 0, 0, "linear" },
		},
		RightUpperArm = {
			{ 0, 68.24, 26.2, -34.1, "linear" },
			{ 1, 68.24, 26.2, -34.1, "linear" },
			{ 2, 68.24, 26.2, -34.1, "linear" },
			{ 3, 68.24, 26.2, -34.1, "linear" },
			{ 4, 68.24, 26.2, -34.1, "linear" },
			{ 5, 68.24, 26.2, -34.1, "linear" },
			{ 6, 68.24, 26.2, -34.1, "linear" },
			{ 7, 68.24, 26.2, -34.1, "linear" },
			{ 8, 68.24, 26.2, -34.1, "linear" },
			{ 9, 68.24, 26.2, -34.1, "linear" },
			{ 10, 68.24, 26.2, -34.1, "linear" },
			{ 11, 68.24, 26.2, -34.1, "linear" },
			{ 12, 68.24, 26.2, -34.1, "linear" },
			{ 13, 70.16, 26.51, -35.4, "linear" },
			{ 14, 71.56, 26.69, -36.32, "linear" },
			{ 15, 72.4, 26.79, -36.87, "linear" },
			{ 16, 72.69, 26.81, -37.06, "linear" },
			{ 17, 72.34, 26.78, -36.81, "linear" },
			{ 18, 72.02, 26.74, -36.58, "linear" },
			{ 19, 71.73, 26.7, -36.36, "linear" },
			{ 20, 71.46, 26.67, -36.16, "linear" },
			{ 21, 71.2, 26.63, -35.98, "linear" },
			{ 22, 70.98, 26.6, -35.81, "linear" },
			{ 23, 70.77, 26.57, -35.65, "linear" },
			{ 24, 70.59, 26.54, -35.52, "linear" },
			{ 25, 70.42, 26.52, -35.4, "linear" },
			{ 26, 70.28, 26.5, -35.29, "linear" },
			{ 27, 70.16, 26.48, -35.2, "linear" },
			{ 28, 70.07, 26.46, -35.13, "linear" },
			{ 29, 69.99, 26.45, -35.07, "linear" },
			{ 30, 69.94, 26.44, -35.03, "linear" },
			{ 31, 69.91, 26.44, -35.01, "linear" },
			{ 32, 69.9, 26.44, -35, "linear" },
			{ 33, 69.89, 26.43, -35, "linear" },
			{ 34, 69.87, 26.43, -34.99, "linear" },
			{ 35, 69.85, 26.43, -34.98, "linear" },
			{ 36, 69.81, 26.42, -34.96, "linear" },
			{ 37, 69.77, 26.42, -34.93, "linear" },
			{ 38, 69.71, 26.41, -34.9, "linear" },
			{ 39, 69.65, 26.4, -34.87, "linear" },
			{ 40, 69.58, 26.39, -34.83, "linear" },
			{ 41, 69.51, 26.38, -34.79, "linear" },
			{ 42, 69.42, 26.37, -34.75, "linear" },
			{ 43, 69.34, 26.36, -34.7, "linear" },
			{ 44, 69.25, 26.35, -34.65, "linear" },
			{ 45, 69.16, 26.33, -34.6, "linear" },
			{ 46, 69.06, 26.32, -34.55, "linear" },
			{ 47, 68.97, 26.31, -34.5, "linear" },
			{ 48, 68.88, 26.29, -34.45, "linear" },
			{ 49, 68.79, 26.28, -34.41, "linear" },
			{ 50, 68.71, 26.27, -34.36, "linear" },
			{ 51, 68.62, 26.26, -34.31, "linear" },
			{ 52, 68.55, 26.24, -34.27, "linear" },
			{ 53, 68.48, 26.23, -34.24, "linear" },
			{ 54, 68.42, 26.22, -34.2, "linear" },
			{ 55, 68.37, 26.22, -34.17, "linear" },
			{ 56, 68.32, 26.21, -34.15, "linear" },
			{ 57, 68.29, 26.2, -34.13, "linear" },
			{ 58, 68.26, 26.2, -34.12, "linear" },
			{ 59, 68.24, 26.2, -34.11, "linear" },
			{ 60, 68.24, 26.2, -34.1, "linear" },
		},
		RightLowerArm = {
			{ 0, 99.13, 0, 0, "linear" },
			{ 1, 99.13, 0, 0, "linear" },
			{ 2, 99.13, 0, 0, "linear" },
			{ 3, 99.13, 0, 0, "linear" },
			{ 4, 99.13, 0, 0, "linear" },
			{ 5, 99.13, 0, 0, "linear" },
			{ 6, 99.13, 0, 0, "linear" },
			{ 7, 99.13, 0, 0, "linear" },
			{ 8, 99.13, 0, 0, "linear" },
			{ 9, 99.13, 0, 0, "linear" },
			{ 10, 99.13, 0, 0, "linear" },
			{ 11, 99.13, 0, 0, "linear" },
			{ 12, 99.13, 0, 0, "linear" },
			{ 13, 98.57, 0, 0, "linear" },
			{ 14, 98.11, 0, 0, "linear" },
			{ 15, 97.81, 0, 0, "linear" },
			{ 16, 97.7, 0, 0, "linear" },
			{ 17, 97.82, 0, 0, "linear" },
			{ 18, 97.93, 0, 0, "linear" },
			{ 19, 98.02, 0, 0, "linear" },
			{ 20, 98.11, 0, 0, "linear" },
			{ 21, 98.19, 0, 0, "linear" },
			{ 22, 98.26, 0, 0, "linear" },
			{ 23, 98.32, 0, 0, "linear" },
			{ 24, 98.38, 0, 0, "linear" },
			{ 25, 98.43, 0, 0, "linear" },
			{ 26, 98.47, 0, 0, "linear" },
			{ 27, 98.5, 0, 0, "linear" },
			{ 28, 98.53, 0, 0, "linear" },
			{ 29, 98.55, 0, 0, "linear" },
			{ 30, 98.56, 0, 0, "linear" },
			{ 31, 98.57, 0, 0, "linear" },
			{ 32, 98.58, 0, 0, "linear" },
			{ 33, 98.58, 0, 0, "linear" },
			{ 34, 98.58, 0, 0, "linear" },
			{ 35, 98.59, 0, 0, "linear" },
			{ 36, 98.61, 0, 0, "linear" },
			{ 37, 98.62, 0, 0, "linear" },
			{ 38, 98.64, 0, 0, "linear" },
			{ 39, 98.66, 0, 0, "linear" },
			{ 40, 98.69, 0, 0, "linear" },
			{ 41, 98.71, 0, 0, "linear" },
			{ 42, 98.74, 0, 0, "linear" },
			{ 43, 98.77, 0, 0, "linear" },
			{ 44, 98.8, 0, 0, "linear" },
			{ 45, 98.83, 0, 0, "linear" },
			{ 46, 98.86, 0, 0, "linear" },
			{ 47, 98.89, 0, 0, "linear" },
			{ 48, 98.92, 0, 0, "linear" },
			{ 49, 98.95, 0, 0, "linear" },
			{ 50, 98.98, 0, 0, "linear" },
			{ 51, 99.01, 0, 0, "linear" },
			{ 52, 99.03, 0, 0, "linear" },
			{ 53, 99.05, 0, 0, "linear" },
			{ 54, 99.07, 0, 0, "linear" },
			{ 55, 99.09, 0, 0, "linear" },
			{ 56, 99.1, 0, 0, "linear" },
			{ 57, 99.12, 0, 0, "linear" },
			{ 58, 99.12, 0, 0, "linear" },
			{ 59, 99.13, 0, 0, "linear" },
			{ 60, 99.13, 0, 0, "linear" },
		},
		LeftUpperLeg = {
			{ 0, 43, 15.54, -18.97, "linear" },
			{ 1, 43.01, 15.5, -18.93, "linear" },
			{ 2, 43.06, 15.38, -18.84, "linear" },
			{ 3, 43.13, 15.18, -18.68, "linear" },
			{ 4, 43.22, 14.93, -18.47, "linear" },
			{ 5, 43.32, 14.64, -18.23, "linear" },
			{ 6, 43.43, 14.32, -17.97, "linear" },
			{ 7, 43.54, 14.01, -17.71, "linear" },
			{ 8, 43.64, 13.72, -17.47, "linear" },
			{ 9, 43.73, 13.47, -17.26, "linear" },
			{ 10, 43.79, 13.29, -17.1, "linear" },
			{ 11, 43.83, 13.17, -16.99, "linear" },
			{ 12, 43.84, 13.13, -16.96, "linear" },
			{ 13, 45.75, 15.07, -19.62, "linear" },
			{ 14, 47.28, 17.01, -22.33, "linear" },
			{ 15, 48.54, 18.96, -25.09, "linear" },
			{ 16, 49.62, 20.93, -27.88, "linear" },
			{ 17, 49.38, 20.31, -26.87, "linear" },
			{ 18, 49.21, 19.95, -26.26, "linear" },
			{ 19, 49.16, 19.83, -26.06, "linear" },
			{ 20, 48.67, 19.47, -25.36, "linear" },
			{ 21, 48.2, 19.14, -24.72, "linear" },
			{ 22, 47.76, 18.84, -24.13, "linear" },
			{ 23, 47.34, 18.57, -23.6, "linear" },
			{ 24, 46.95, 18.32, -23.13, "linear" },
			{ 25, 46.6, 18.11, -22.71, "linear" },
			{ 26, 46.28, 17.93, -22.35, "linear" },
			{ 27, 46, 17.77, -22.04, "linear" },
			{ 28, 45.77, 17.65, -21.79, "linear" },
			{ 29, 45.59, 17.55, -21.6, "linear" },
			{ 30, 45.45, 17.48, -21.46, "linear" },
			{ 31, 45.37, 17.44, -21.38, "linear" },
			{ 32, 45.35, 17.42, -21.35, "linear" },
			{ 33, 45.3, 17.39, -21.3, "linear" },
			{ 34, 45.17, 17.29, -21.15, "linear" },
			{ 35, 44.97, 17.12, -20.92, "linear" },
			{ 36, 44.7, 16.9, -20.62, "linear" },
			{ 37, 44.37, 16.65, -20.27, "linear" },
			{ 38, 44.02, 16.38, -19.9, "linear" },
			{ 39, 43.65, 16.11, -19.53, "linear" },
			{ 40, 43.31, 15.85, -19.19, "linear" },
			{ 41, 43, 15.64, -18.89, "linear" },
			{ 42, 42.76, 15.47, -18.67, "linear" },
			{ 43, 42.61, 15.36, -18.53, "linear" },
			{ 44, 42.56, 15.33, -18.48, "linear" },
			{ 45, 42.56, 15.33, -18.49, "linear" },
			{ 46, 42.57, 15.34, -18.5, "linear" },
			{ 47, 42.59, 15.35, -18.52, "linear" },
			{ 48, 42.62, 15.36, -18.55, "linear" },
			{ 49, 42.66, 15.38, -18.59, "linear" },
			{ 50, 42.7, 15.39, -18.63, "linear" },
			{ 51, 42.74, 15.41, -18.68, "linear" },
			{ 52, 42.78, 15.44, -18.73, "linear" },
			{ 53, 42.82, 15.46, -18.77, "linear" },
			{ 54, 42.86, 15.48, -18.82, "linear" },
			{ 55, 42.9, 15.5, -18.86, "linear" },
			{ 56, 42.93, 15.51, -18.9, "linear" },
			{ 57, 42.96, 15.53, -18.93, "linear" },
			{ 58, 42.98, 15.54, -18.95, "linear" },
			{ 59, 42.99, 15.54, -18.96, "linear" },
			{ 60, 43, 15.54, -18.97, "linear" },
		},
		LeftLowerLeg = {
			{ 0, -29.04, 0, 0, "linear" },
			{ 1, -29.04, 0, 0, "linear" },
			{ 2, -29.04, 0, 0, "linear" },
			{ 3, -29.04, 0, 0, "linear" },
			{ 4, -29.03, 0, 0, "linear" },
			{ 5, -29.02, 0, 0, "linear" },
			{ 6, -29, 0, 0, "linear" },
			{ 7, -28.97, 0, 0, "linear" },
			{ 8, -28.94, 0, 0, "linear" },
			{ 9, -28.91, 0, 0, "linear" },
			{ 10, -28.88, 0, 0, "linear" },
			{ 11, -28.86, 0, 0, "linear" },
			{ 12, -28.86, 0, 0, "linear" },
			{ 13, -33.61, 0, 0, "linear" },
			{ 14, -37.52, 0, 0, "linear" },
			{ 15, -40.83, 0, 0, "linear" },
			{ 16, -43.65, 0, 0, "linear" },
			{ 17, -42.58, 0, 0, "linear" },
			{ 18, -41.9, 0, 0, "linear" },
			{ 19, -41.67, 0, 0, "linear" },
			{ 20, -40.54, 0, 0, "linear" },
			{ 21, -39.46, 0, 0, "linear" },
			{ 22, -38.44, 0, 0, "linear" },
			{ 23, -37.48, 0, 0, "linear" },
			{ 24, -36.59, 0, 0, "linear" },
			{ 25, -35.78, 0, 0, "linear" },
			{ 26, -35.06, 0, 0, "linear" },
			{ 27, -34.44, 0, 0, "linear" },
			{ 28, -33.92, 0, 0, "linear" },
			{ 29, -33.51, 0, 0, "linear" },
			{ 30, -33.21, 0, 0, "linear" },
			{ 31, -33.03, 0, 0, "linear" },
			{ 32, -32.97, 0, 0, "linear" },
			{ 33, -32.89, 0, 0, "linear" },
			{ 34, -32.64, 0, 0, "linear" },
			{ 35, -32.25, 0, 0, "linear" },
			{ 36, -31.73, 0, 0, "linear" },
			{ 37, -31.12, 0, 0, "linear" },
			{ 38, -30.44, 0, 0, "linear" },
			{ 39, -29.74, 0, 0, "linear" },
			{ 40, -29.07, 0, 0, "linear" },
			{ 41, -28.48, 0, 0, "linear" },
			{ 42, -28.02, 0, 0, "linear" },
			{ 43, -27.72, 0, 0, "linear" },
			{ 44, -27.62, 0, 0, "linear" },
			{ 45, -27.64, 0, 0, "linear" },
			{ 46, -27.68, 0, 0, "linear" },
			{ 47, -27.75, 0, 0, "linear" },
			{ 48, -27.84, 0, 0, "linear" },
			{ 49, -27.95, 0, 0, "linear" },
			{ 50, -28.07, 0, 0, "linear" },
			{ 51, -28.21, 0, 0, "linear" },
			{ 52, -28.34, 0, 0, "linear" },
			{ 53, -28.48, 0, 0, "linear" },
			{ 54, -28.61, 0, 0, "linear" },
			{ 55, -28.74, 0, 0, "linear" },
			{ 56, -28.84, 0, 0, "linear" },
			{ 57, -28.93, 0, 0, "linear" },
			{ 58, -28.99, 0, 0, "linear" },
			{ 59, -29.03, 0, 0, "linear" },
			{ 60, -29.04, 0, 0, "linear" },
		},
		LeftFoot = {
			{ 0, -14.87, 2.79, 3.01, "linear" },
			{ 1, -14.9, 2.79, 3.01, "linear" },
			{ 2, -14.97, 2.79, 2.99, "linear" },
			{ 3, -15.09, 2.8, 2.97, "linear" },
			{ 4, -15.24, 2.8, 2.93, "linear" },
			{ 5, -15.43, 2.8, 2.9, "linear" },
			{ 6, -15.63, 2.8, 2.86, "linear" },
			{ 7, -15.83, 2.81, 2.82, "linear" },
			{ 8, -16.02, 2.81, 2.78, "linear" },
			{ 9, -16.19, 2.81, 2.75, "linear" },
			{ 10, -16.32, 2.81, 2.73, "linear" },
			{ 11, -16.4, 2.81, 2.71, "linear" },
			{ 12, -16.43, 2.82, 2.71, "linear" },
			{ 13, -12.58, 2.8, 2.9, "linear" },
			{ 14, -9.12, 2.78, 3.15, "linear" },
			{ 15, -5.95, 2.76, 3.44, "linear" },
			{ 16, -3, 2.74, 3.79, "linear" },
			{ 17, -4.07, 2.75, 3.6, "linear" },
			{ 18, -4.73, 2.76, 3.5, "linear" },
			{ 19, -4.95, 2.76, 3.46, "linear" },
			{ 20, -5.89, 2.77, 3.4, "linear" },
			{ 21, -6.78, 2.77, 3.34, "linear" },
			{ 22, -7.6, 2.77, 3.28, "linear" },
			{ 23, -8.36, 2.78, 3.24, "linear" },
			{ 24, -9.05, 2.78, 3.2, "linear" },
			{ 25, -9.67, 2.78, 3.16, "linear" },
			{ 26, -10.22, 2.78, 3.13, "linear" },
			{ 27, -10.69, 2.79, 3.11, "linear" },
			{ 28, -11.08, 2.79, 3.09, "linear" },
			{ 29, -11.38, 2.79, 3.07, "linear" },
			{ 30, -11.6, 2.79, 3.06, "linear" },
			{ 31, -11.74, 2.79, 3.06, "linear" },
			{ 32, -11.78, 2.79, 3.06, "linear" },
			{ 33, -11.85, 2.79, 3.05, "linear" },
			{ 34, -12.04, 2.79, 3.05, "linear" },
			{ 35, -12.36, 2.79, 3.04, "linear" },
			{ 36, -12.77, 2.79, 3.03, "linear" },
			{ 37, -13.26, 2.79, 3.01, "linear" },
			{ 38, -13.79, 2.79, 3, "linear" },
			{ 39, -14.33, 2.8, 2.99, "linear" },
			{ 40, -14.84, 2.8, 2.98, "linear" },
			{ 41, -15.29, 2.8, 2.97, "linear" },
			{ 42, -15.64, 2.8, 2.96, "linear" },
			{ 43, -15.86, 2.8, 2.96, "linear" },
			{ 44, -15.93, 2.8, 2.96, "linear" },
			{ 45, -15.92, 2.8, 2.96, "linear" },
			{ 46, -15.89, 2.8, 2.96, "linear" },
			{ 47, -15.84, 2.8, 2.96, "linear" },
			{ 48, -15.77, 2.8, 2.96, "linear" },
			{ 49, -15.69, 2.8, 2.97, "linear" },
			{ 50, -15.6, 2.8, 2.97, "linear" },
			{ 51, -15.5, 2.8, 2.98, "linear" },
			{ 52, -15.4, 2.8, 2.99, "linear" },
			{ 53, -15.29, 2.79, 2.99, "linear" },
			{ 54, -15.19, 2.79, 3, "linear" },
			{ 55, -15.1, 2.79, 3, "linear" },
			{ 56, -15.02, 2.79, 3.01, "linear" },
			{ 57, -14.96, 2.79, 3.01, "linear" },
			{ 58, -14.91, 2.79, 3.01, "linear" },
			{ 59, -14.88, 2.79, 3.01, "linear" },
			{ 60, -14.87, 2.79, 3.01, "linear" },
		},
		RightUpperLeg = {
			{ 0, 31.32, -7.69, 8.28, "linear" },
			{ 1, 31.35, -7.73, 8.31, "linear" },
			{ 2, 31.45, -7.85, 8.4, "linear" },
			{ 3, 31.61, -8.04, 8.53, "linear" },
			{ 4, 31.82, -8.28, 8.72, "linear" },
			{ 5, 32.06, -8.56, 8.93, "linear" },
			{ 6, 32.33, -8.86, 9.17, "linear" },
			{ 7, 32.61, -9.15, 9.41, "linear" },
			{ 8, 32.89, -9.42, 9.64, "linear" },
			{ 9, 33.14, -9.64, 9.84, "linear" },
			{ 10, 33.37, -9.81, 10.01, "linear" },
			{ 11, 33.55, -9.9, 10.12, "linear" },
			{ 12, 33.67, -9.92, 10.17, "linear" },
			{ 13, 33.96, -6.9, 8.85, "linear" },
			{ 14, 34.26, -3.88, 7.54, "linear" },
			{ 15, 34.57, -0.86, 6.24, "linear" },
			{ 16, 34.88, 2.16, 4.95, "linear" },
			{ 17, 34.92, 1.14, 5.41, "linear" },
			{ 18, 34.93, 0.53, 5.68, "linear" },
			{ 19, 34.92, 0.32, 5.78, "linear" },
			{ 20, 34.74, -0.41, 6.02, "linear" },
			{ 21, 34.57, -1.08, 6.25, "linear" },
			{ 22, 34.41, -1.69, 6.45, "linear" },
			{ 23, 34.25, -2.25, 6.63, "linear" },
			{ 24, 34.09, -2.75, 6.79, "linear" },
			{ 25, 33.94, -3.19, 6.93, "linear" },
			{ 26, 33.79, -3.58, 7.04, "linear" },
			{ 27, 33.65, -3.91, 7.14, "linear" },
			{ 28, 33.52, -4.18, 7.22, "linear" },
			{ 29, 33.4, -4.4, 7.27, "linear" },
			{ 30, 33.29, -4.56, 7.31, "linear" },
			{ 31, 33.19, -4.66, 7.33, "linear" },
			{ 32, 33.1, -4.7, 7.33, "linear" },
			{ 33, 33, -4.77, 7.34, "linear" },
			{ 34, 32.88, -4.95, 7.39, "linear" },
			{ 35, 32.73, -5.23, 7.48, "linear" },
			{ 36, 32.56, -5.59, 7.59, "linear" },
			{ 37, 32.37, -6.01, 7.73, "linear" },
			{ 38, 32.19, -6.45, 7.87, "linear" },
			{ 39, 32.01, -6.9, 8.02, "linear" },
			{ 40, 31.85, -7.32, 8.15, "linear" },
			{ 41, 31.72, -7.67, 8.27, "linear" },
			{ 42, 31.61, -7.95, 8.35, "linear" },
			{ 43, 31.55, -8.12, 8.41, "linear" },
			{ 44, 31.53, -8.18, 8.43, "linear" },
			{ 45, 31.53, -8.17, 8.42, "linear" },
			{ 46, 31.52, -8.16, 8.42, "linear" },
			{ 47, 31.51, -8.14, 8.41, "linear" },
			{ 48, 31.5, -8.11, 8.4, "linear" },
			{ 49, 31.48, -8.07, 8.39, "linear" },
			{ 50, 31.46, -8.03, 8.38, "linear" },
			{ 51, 31.44, -7.98, 8.37, "linear" },
			{ 52, 31.42, -7.94, 8.35, "linear" },
			{ 53, 31.4, -7.89, 8.34, "linear" },
			{ 54, 31.38, -7.84, 8.33, "linear" },
			{ 55, 31.36, -7.8, 8.31, "linear" },
			{ 56, 31.35, -7.76, 8.3, "linear" },
			{ 57, 31.34, -7.73, 8.29, "linear" },
			{ 58, 31.33, -7.71, 8.29, "linear" },
			{ 59, 31.32, -7.7, 8.28, "linear" },
			{ 60, 31.32, -7.69, 8.28, "linear" },
		},
		RightLowerLeg = {
			{ 0, -61.05, 0, 0, "linear" },
			{ 1, -61.12, 0, 0, "linear" },
			{ 2, -61.32, 0, 0, "linear" },
			{ 3, -61.65, 0, 0, "linear" },
			{ 4, -62.07, 0, 0, "linear" },
			{ 5, -62.58, 0, 0, "linear" },
			{ 6, -63.13, 0, 0, "linear" },
			{ 7, -63.69, 0, 0, "linear" },
			{ 8, -64.24, 0, 0, "linear" },
			{ 9, -64.75, 0, 0, "linear" },
			{ 10, -65.19, 0, 0, "linear" },
			{ 11, -65.54, 0, 0, "linear" },
			{ 12, -65.78, 0, 0, "linear" },
			{ 13, -65.55, 0, 0, "linear" },
			{ 14, -65.2, 0, 0, "linear" },
			{ 15, -64.7, 0, 0, "linear" },
			{ 16, -64.06, 0, 0, "linear" },
			{ 17, -64.18, 0, 0, "linear" },
			{ 18, -64.23, 0, 0, "linear" },
			{ 19, -64.21, 0, 0, "linear" },
			{ 20, -64.1, 0, 0, "linear" },
			{ 21, -63.97, 0, 0, "linear" },
			{ 22, -63.82, 0, 0, "linear" },
			{ 23, -63.66, 0, 0, "linear" },
			{ 24, -63.49, 0, 0, "linear" },
			{ 25, -63.32, 0, 0, "linear" },
			{ 26, -63.13, 0, 0, "linear" },
			{ 27, -62.95, 0, 0, "linear" },
			{ 28, -62.76, 0, 0, "linear" },
			{ 29, -62.58, 0, 0, "linear" },
			{ 30, -62.4, 0, 0, "linear" },
			{ 31, -62.23, 0, 0, "linear" },
			{ 32, -62.07, 0, 0, "linear" },
			{ 33, -61.91, 0, 0, "linear" },
			{ 34, -61.78, 0, 0, "linear" },
			{ 35, -61.66, 0, 0, "linear" },
			{ 36, -61.55, 0, 0, "linear" },
			{ 37, -61.45, 0, 0, "linear" },
			{ 38, -61.37, 0, 0, "linear" },
			{ 39, -61.29, 0, 0, "linear" },
			{ 40, -61.23, 0, 0, "linear" },
			{ 41, -61.18, 0, 0, "linear" },
			{ 42, -61.15, 0, 0, "linear" },
			{ 43, -61.13, 0, 0, "linear" },
			{ 44, -61.12, 0, 0, "linear" },
			{ 45, -61.12, 0, 0, "linear" },
			{ 46, -61.12, 0, 0, "linear" },
			{ 47, -61.11, 0, 0, "linear" },
			{ 48, -61.11, 0, 0, "linear" },
			{ 49, -61.1, 0, 0, "linear" },
			{ 50, -61.1, 0, 0, "linear" },
			{ 51, -61.09, 0, 0, "linear" },
			{ 52, -61.09, 0, 0, "linear" },
			{ 53, -61.08, 0, 0, "linear" },
			{ 54, -61.07, 0, 0, "linear" },
			{ 55, -61.07, 0, 0, "linear" },
			{ 56, -61.06, 0, 0, "linear" },
			{ 57, -61.06, 0, 0, "linear" },
			{ 58, -61.05, 0, 0, "linear" },
			{ 59, -61.05, 0, 0, "linear" },
			{ 60, -61.05, 0, 0, "linear" },
		},
		RightFoot = {
			{ 0, 18.65, 0.78, -4.6, "linear" },
			{ 1, 18.66, 0.78, -4.6, "linear" },
			{ 2, 18.69, 0.78, -4.59, "linear" },
			{ 3, 18.73, 0.79, -4.58, "linear" },
			{ 4, 18.78, 0.81, -4.56, "linear" },
			{ 5, 18.83, 0.82, -4.55, "linear" },
			{ 6, 18.88, 0.84, -4.53, "linear" },
			{ 7, 18.91, 0.86, -4.52, "linear" },
			{ 8, 18.92, 0.88, -4.5, "linear" },
			{ 9, 18.9, 0.9, -4.49, "linear" },
			{ 10, 18.86, 0.92, -4.48, "linear" },
			{ 11, 18.78, 0.94, -4.48, "linear" },
			{ 12, 18.68, 0.96, -4.48, "linear" },
			{ 13, 18.19, 1.11, -4.99, "linear" },
			{ 14, 17.67, 1.27, -5.55, "linear" },
			{ 15, 17.14, 1.44, -6.16, "linear" },
			{ 16, 16.6, 1.62, -6.82, "linear" },
			{ 17, 16.68, 1.57, -6.62, "linear" },
			{ 18, 16.74, 1.53, -6.5, "linear" },
			{ 19, 16.78, 1.52, -6.46, "linear" },
			{ 20, 16.78, 1.45, -6.26, "linear" },
			{ 21, 16.8, 1.4, -6.07, "linear" },
			{ 22, 16.82, 1.34, -5.9, "linear" },
			{ 23, 16.85, 1.29, -5.75, "linear" },
			{ 24, 16.89, 1.24, -5.62, "linear" },
			{ 25, 16.94, 1.2, -5.51, "linear" },
			{ 26, 17, 1.16, -5.4, "linear" },
			{ 27, 17.06, 1.12, -5.32, "linear" },
			{ 28, 17.13, 1.09, -5.25, "linear" },
			{ 29, 17.21, 1.06, -5.2, "linear" },
			{ 30, 17.29, 1.04, -5.16, "linear" },
			{ 31, 17.38, 1.01, -5.14, "linear" },
			{ 32, 17.46, 1, -5.13, "linear" },
			{ 33, 17.56, 0.98, -5.11, "linear" },
			{ 34, 17.67, 0.96, -5.08, "linear" },
			{ 35, 17.79, 0.93, -5.02, "linear" },
			{ 36, 17.91, 0.9, -4.95, "linear" },
			{ 37, 18.03, 0.87, -4.86, "linear" },
			{ 38, 18.15, 0.84, -4.77, "linear" },
			{ 39, 18.27, 0.81, -4.68, "linear" },
			{ 40, 18.36, 0.79, -4.6, "linear" },
			{ 41, 18.44, 0.77, -4.53, "linear" },
			{ 42, 18.5, 0.75, -4.48, "linear" },
			{ 43, 18.54, 0.75, -4.45, "linear" },
			{ 44, 18.55, 0.74, -4.44, "linear" },
			{ 45, 18.55, 0.74, -4.44, "linear" },
			{ 46, 18.55, 0.74, -4.44, "linear" },
			{ 47, 18.56, 0.75, -4.45, "linear" },
			{ 48, 18.56, 0.75, -4.46, "linear" },
			{ 49, 18.57, 0.75, -4.47, "linear" },
			{ 50, 18.58, 0.75, -4.49, "linear" },
			{ 51, 18.59, 0.76, -4.5, "linear" },
			{ 52, 18.6, 0.76, -4.52, "linear" },
			{ 53, 18.61, 0.76, -4.53, "linear" },
			{ 54, 18.62, 0.77, -4.55, "linear" },
			{ 55, 18.63, 0.77, -4.56, "linear" },
			{ 56, 18.64, 0.77, -4.58, "linear" },
			{ 57, 18.64, 0.77, -4.59, "linear" },
			{ 58, 18.65, 0.78, -4.59, "linear" },
			{ 59, 18.65, 0.78, -4.6, "linear" },
			{ 60, 18.65, 0.78, -4.6, "linear" },
		},
	},
}

end)()
function buildSequence()
	return AnimReader.build(DATA)
end
-- PLAYBACK
