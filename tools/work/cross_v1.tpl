const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 13, -1, -29, 1.5, "linear", 0.03, -0.21, 0.46 },
		{ 17, -3, 12, -1, "outQuad", -0.02, -0.29, 0.29 },
		{ 21, -3, 9, -1, "outQuad", -0.02, -0.28, 0.31 },
		{ 37, -2, -12, 0, "inOutSine", 0, -0.22, 0.38 },
		{ 51, -1, -23.5, 1, "inOutSine", 0.02, -0.18, 0.44 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 13, -4, 6, -1.5, "linear" },
		{ 17, -7, 14, 1, "outQuad" },
		{ 21, -7, 12, 1, "outQuad" },
		{ 37, -5, 10, 0, "inOutSine" },
		{ 51, -4, 9.5, -1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 13, -8, 21, 0.5, "linear" },
		{ 17, -10, -24, -1, "outQuad" },
		{ 21, -10, -20, -1, "outQuad" },
		{ 37, -8, 2, 0, "inOutSine" },
		{ 51, -7, 14, 0.5, "inOutSine" },
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

