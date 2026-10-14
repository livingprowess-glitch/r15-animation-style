const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 12, -1, -21, 1, "linear", 0.02, -0.2, 0.45 },
		{ 16, -3, -34, 0, "outQuad", 0, -0.19, 0.33 },
		{ 19, -3, -32, 0, "outQuad", 0, -0.19, 0.35 },
		{ 32, -2, -27, 0.5, "inOutSine", 0.01, -0.18, 0.41 },
		{ 44, -1, -23.5, 1, "inOutSine", 0.02, -0.18, 0.44 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 12, -4, 12, -1, "linear" },
		{ 16, -6, -2, 0, "outQuad" },
		{ 19, -6, 0, 0, "outQuad" },
		{ 32, -5, 6, -0.5, "inOutSine" },
		{ 44, -4, 9.5, -1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 12, -8, 13, 0.5, "linear" },
		{ 16, -10, 34, 0, "outQuad" },
		{ 19, -10, 32, 0, "outQuad" },
		{ 32, -8, 22, 0.3, "inOutSine" },
		{ 44, -7, 15, 0.5, "inOutSine" },
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

