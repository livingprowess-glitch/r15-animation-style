const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 23, -5.4, -45, -12.2, "inQuad", 0.092, -0.54, 0.61 },
		{ 33, -19.3, 38.4, 13.2, "outQuad", -0.071, -0.424, 0.156 },
		{ 71, -34.7, 50, 17.6, "inOutSine", -0.107, -0.586, 0.156 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 23, -8.4, -24, -18.6, "inQuad" },
		{ 33, -19.25, 23.4, 11.2, "outQuad" },
		{ 71, -30.25, 43.3, 15.6, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 23, 1.8, 69, 13.7, "inQuad" },
		{ 33, -3.95, -59.4, -5.6, "outQuad" },
		{ 71, 4.85, -80.4, -10, "inOutSine" },
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

