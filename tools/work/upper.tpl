const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 20, -10, -38, -9, "inOutSine", 0.08, -0.44, 0.5 },
		{ 32, -13, -44, -12, "inQuad", 0.1, -0.54, 0.52 },
		{ 38, -6, 26, 4, "outQuad", -0.04, -0.25, 0.22 },
		{ 45, -6, 44, 6, "inOutSine", -0.06, -0.14, 0.02 },
		{ 51, -5, 46, 6, "inOutSine", -0.06, -0.15, 0.04 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 20, -9, -14, -12, "inOutSine" },
		{ 32, -11, -20, -15, "inQuad" },
		{ 38, -6, 24, 4, "outQuad" },
		{ 45, -6, 30, 5, "inOutSine" },
		{ 51, -6, 31, 5, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 20, -4, 44, 8, "inOutSine" },
		{ 32, -4, 54, 10, "inQuad" },
		{ 38, 2, -44, -1, "outQuad" },
		{ 45, -2, -62, -2, "inOutSine" },
		{ 51, -2, -64, -2, "inOutSine" },
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

