const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 22, -2, -34, -3, "inQuad", 0.05, -0.24, 0.48 },
		{ 27, -6, 28, 2, "outQuad", -0.03, -0.3, 0.22 },
		{ 33, -7, 36, 2, "inOutSine", -0.03, -0.31, 0.2 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 22, -4, 4, -3, "inQuad" },
		{ 27, -8, 20, 2, "outQuad" },
		{ 33, -9, 24, 2, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 22, -8, 26, 1, "inQuad" },
		{ 27, -10, -46, -1, "outQuad" },
		{ 33, -10, -58, -1, "inOutSine" },
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

