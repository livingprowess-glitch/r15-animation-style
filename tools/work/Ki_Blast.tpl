const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 20, -5, -45, -11, "inQuad", 0.092, -0.54, 0.61 },
		{ 29, -9.1, 38.4, 1, "outQuad", -0.061, -0.396, 0.187 },
		{ 61, -19.1, 38.4, 1, "inOutSine", -0.097, -0.558, 0.187 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 20, -8, -24, -17, "inQuad" },
		{ 29, -9.4, 23.4, -1, "outQuad" },
		{ 61, -15.4, 18.9, -1, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 20, 1, 69, 12.5, "inQuad" },
		{ 29, -4.3, -59.4, -4.9, "outQuad" },
		{ 61, 3.7, -44.4, -8.9, "inOutSine" },
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

