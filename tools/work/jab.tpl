const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 15, 0, -18, 1.5, "linear", 0.03, -0.22, 0.48 },
		{ 20, -6, -33, -1, "outQuad", 0, -0.3, 0.05 },
		{ 26, -7, -35, -1, "inOutSine", 0, -0.3, 0.03 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 15, -3, 12, -1.5, "linear" },
		{ 20, -10, 0, 1, "outQuad" },
		{ 26, -11, -1, 1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 15, -8, 6, 0.5, "linear" },
		{ 20, -11, 33, 0, "outQuad" },
		{ 26, -11, 36, 0, "inOutSine" },
		{ LAST_FRAME, -7, 15, 0.5, "linear" },
	},
	LeftUpperArm = {
__LeftUpperArm__
	},
	LeftLowerArm = {
__LeftLowerArm__
	},
	RightUpperArm = {
__RightUpperArm__
	},
	RightLowerArm = {
__RightLowerArm__
	},
	LeftUpperLeg = {
__LeftUpperLeg__
	},
	LeftLowerLeg = {
__LeftLowerLeg__
	},
	LeftFoot = {
__LeftFoot__
	},
	RightUpperLeg = {
__RightUpperLeg__
	},
	RightLowerLeg = {
__RightLowerLeg__
	},
	RightFoot = {
__RightFoot__
	},
}

