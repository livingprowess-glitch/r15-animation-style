const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		{ 0, -10, -20, 2, "inOutSine", 0.02, -0.34, 0.5 },
		{ 17, -19, -41, -13, "inQuad", 0.08, -0.76, 0.71 },
		{ 24, -26.45, 48.15, 18.45, "outQuad", -0.05, -0.575, 0.241 },
		{ 57, -39.95, 54, 24.45, "inOutSine", -0.081, -0.725, 0.241 },
		{ LAST_FRAME, -10, -20, 2, "linear", 0.02, -0.34, 0.5 },
	},
	UpperTorso = {
		{ 0, -12, 6, -1, "inOutSine" },
		{ 17, -21, -21, -19, "inQuad" },
		{ 24, -26.1, 24.8, 15.45, "outQuad" },
		{ 57, -35.1, 50.45, 18.45, "inOutSine" },
		{ LAST_FRAME, -12, 6, -1, "linear" },
	},
	Head = {
		{ 0, 6, 14, 0.5, "inOutSine" },
		{ 17, 12, 68, 9.5, "inQuad" },
		{ 24, 8.35, -58.85, -4.2, "outQuad" },
		{ 57, 14.35, -79.85, -7.2, "inOutSine" },
		{ LAST_FRAME, 6, 14, 0.5, "linear" },
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

