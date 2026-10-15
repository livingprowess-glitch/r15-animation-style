const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 26, -5.4, -45, -12.2, "inQuad", 0.092, -0.54, 0.61 },
		{ 37, -21.4, 38.4, 14.6, "outQuad", -0.082, -0.452, 0.124 },
		{ 80, -36.8, 50, 19, "inOutSine", -0.118, -0.614, 0.124 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 26, -8.4, -24, -18.6, "inQuad" },
		{ 37, -21, 23.4, 12.6, "outQuad" },
		{ 80, -32, 43.3, 17, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 26, 1.8, 69, 13.7, "inQuad" },
		{ 37, -3.6, -59.4, -6.3, "outQuad" },
		{ 80, 5.2, -80.4, -10.7, "inOutSine" },
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

