const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -2, -35, 0, "inOutSine", 0.02, -0.35, 0.45 },
		{ 20, -6, -56, -12, "inQuad", 0.092, -0.71, 0.63 },
		{ 29, -10.1, 27.4, 0, "outQuad", -0.061, -0.566, 0.207 },
		{ 61, -20.1, 27.4, 0, "inOutSine", -0.097, -0.728, 0.207 },
		{ LAST_FRAME, -2, -35, 0, "linear", 0.02, -0.35, 0.45 },
	},
	UpperTorso = {
		{ 0, -4, 12, 0, "inOutSine" },
		{ 20, -8, -21, -16, "inQuad" },
		{ 29, -9.4, 26.4, 0, "outQuad" },
		{ 61, -15.4, 21.9, 0, "inOutSine" },
		{ LAST_FRAME, -4, 12, 0, "linear" },
	},
	Head = {
		{ 0, -4, 25, 0, "inOutSine" },
		{ 20, 4, 79, 12, "inQuad" },
		{ 29, -1.3, -49.4, -5.4, "outQuad" },
		{ 61, 6.7, -34.4, -9.4, "inOutSine" },
		{ LAST_FRAME, -4, 25, 0, "linear" },
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

