const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 7, -1, -21, 1, "linear", 0.02, -0.2, 0.45 },
		{ 9, -3, -34, 0, "outQuad", 0, -0.19, 0.33 },
		{ 11, -3, -32, 0, "outQuad", 0, -0.19, 0.35 },
		{ 18, -2, -27, 0.5, "inOutSine", 0.01, -0.18, 0.41 },
		{ 25, -1, -23.5, 1, "inOutSine", 0.02, -0.18, 0.44 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 7, -4, 12, -1, "linear" },
		{ 9, -6, -2, 0, "outQuad" },
		{ 11, -6, 0, 0, "outQuad" },
		{ 18, -5, 6, -0.5, "inOutSine" },
		{ 25, -4, 9.5, -1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 7, -8, 13, 0.5, "linear" },
		{ 9, -10, 34, 0, "outQuad" },
		{ 11, -10, 32, 0, "outQuad" },
		{ 18, -8, 22, 0.3, "inOutSine" },
		{ 25, -7, 15, 0.5, "inOutSine" },
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

