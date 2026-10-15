const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -1, -24, 1, "inOutSine", 0.02, -0.18, 0.43 },
		{ 17, -4, -45, -8, "inQuad", 0.08, -0.48, 0.58 },
		{ 24, -15.1, 37.1, 10.4, "outQuad", -0.05, -0.368, 0.218 },
		{ 51, -25.6, 50, 13.4, "inOutSine", -0.081, -0.503, 0.218 },
		{ LAST_FRAME, -1, -24, 1, "linear", 0.02, -0.18, 0.43 },
	},
	UpperTorso = {
		{ 0, -4, 9, -1, "inOutSine" },
		{ 17, -7, -24, -13, "inQuad" },
		{ 24, -15.75, 23.1, 8.4, "outQuad" },
		{ 51, -23.25, 41.7, 11.4, "inOutSine" },
		{ LAST_FRAME, -4, 9, -1, "linear" },
	},
	Head = {
		{ 0, -7, 15, 0.5, "inOutSine" },
		{ 17, -1, 69, 9.5, "inQuad" },
		{ 24, -4.65, -57.85, -4.2, "outQuad" },
		{ 51, 1.35, -78.85, -7.2, "inOutSine" },
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

