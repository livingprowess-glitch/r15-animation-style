const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 15, 0, -36, 2, "linear", 0.04, -0.24, 0.48 },
		{ 20, -7, 18, -2, "outQuad", -0.03, -0.31, 0.25 },
		{ 24, -8, 22, -2, "outQuad", -0.03, -0.31, 0.24 },
		{ 42, -3, -10, 0, "inOutSine", 0, -0.23, 0.37 },
		{ 57, -1, -23.5, 1, "inOutSine", 0.02, -0.18, 0.44 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 15, -3, 2, -2, "linear" },
		{ 20, -10, 18, 2, "outQuad" },
		{ 24, -11, 20, 2, "outQuad" },
		{ 42, -6, 10, 0, "inOutSine" },
		{ 57, -4, 9.5, -1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 15, -8, 32, 1, "linear" },
		{ 20, -12, -34, -1, "outQuad" },
		{ 24, -12, -38, -1, "outQuad" },
		{ 42, -9, 1, 0, "inOutSine" },
		{ 57, -7, 14, 0.5, "inOutSine" },
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

