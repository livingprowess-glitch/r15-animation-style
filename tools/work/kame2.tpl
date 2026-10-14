const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		-- neutral hold: root rotation at rest for 3 frames
		{ 0, 0, 0, 0, "inOutCubic", 0, -0.03, 0 },
		{ 3, 0, 0, 0, "outQuad", 0, -0.03, 0 },
		-- sink into the wide stance; the pelvis only turns a little so the feet stay planted
		{ 16, -4, -4, 0, "outQuad", 0, -0.25, 0 },
		{ 24, -8, -5, 0, "linear", 0, -0.38, 0 },
		-- ANTICIPATION: coil and tension tremble
		{ 44, -10, -6, 0, "linear", 0, -0.4, 0 },
		{ 47, -9, -5.5, 1, "linear", 0, -0.4, 0 },
		{ 50, -11, -6.5, -1, "linear", 0, -0.4, 0 },
		{ 53, -9, -5.5, 1, "linear", 0, -0.4, 0 },
		{ 56, -11, -6.5, -1, "linear", 0, -0.4, 0 },
		{ 60, -12, -7, 0, "outQuad", 0, -0.42, 0 },
		-- ACTION: pelvis drives forward and up into the thrust...
		{ 63, 2, 3, 0, "outQuad", 0, -0.3, 0 },
		-- FOLLOW-THROUGH: ...then sits back into the beam's recoil
		{ 68, -2, 2, 0, "linear", 0, -0.32, 0 },
		{ 96, -4, 1.5, 0, "inQuad", 0, -0.32, 0 },
		{ 108, -2, 0, 0, "inOutSine", 0, -0.22, 0 },
		{ LAST_FRAME, -2, -3, 0, "linear", 0, -0.18, 0 },
	},
	UpperTorso = {
		-- the chest carries the coil, not the pelvis
		{ 0, -5, 0, 0, "inOutCubic" },
		{ 16, -8, -24, 0, "outQuad" },
		{ 24, -10, -37, 0, "linear" },
		{ 44, -12, -42, 0, "linear" },
		{ 47, -11, -41, 0, "linear" },
		{ 50, -13, -43, 0, "linear" },
		{ 53, -11, -41, 0, "linear" },
		{ 56, -13, -44, 0, "linear" },
		{ 60, -14, -47, 0, "outQuad" },
		-- chest whips through and overshoots the target line
		{ 63, 6, 19, 0, "outQuad" },
		{ 68, 2, 8, 0, "linear" },
		{ 96, 0, 6, 0, "inOutSine" },
		{ 108, -4, 0, 0, "inOutSine" },
		{ LAST_FRAME, -5, 0, 0, "linear" },
	},
	Head = {
		-- the neck counter-rotates so the eyes stay on the target through the whole coil
		{ 0, -8, 0, 0, "inOutCubic" },
		{ 16, -12, 26, 0, "outQuad" },
		{ 24, -14, 40, 0, "linear" },
		{ 44, -16, 46, 0, "linear" },
		{ 50, -15, 44, 0, "linear" },
		{ 56, -17, 48, 0, "linear" },
		{ 60, -18, 52, 0, "outQuad" },
		-- head tucks slightly behind the arms instead of snapping back into them
		{ 63, -14, -20, 0, "outQuad" },
		{ 68, -14, -12, 0, "linear" },
		{ 96, -16, -9, 0, "inOutSine" },
		{ 108, -10, 0, 0, "inOutSine" },
		{ LAST_FRAME, -8, 0, 0, "linear" },
	},
	LeftUpperArm = {
__LeftUpperArm__
	},
	RightUpperArm = {
__RightUpperArm__
	},
	LeftLowerArm = {
__LeftLowerArm__
	},
	RightLowerArm = {
__RightLowerArm__
	},
	-- hips = intended world leg angle minus the pelvis rotation, so the feet stay put while the pelvis moves
	LeftUpperLeg = {
__LeftUpperLeg__
	},
	RightUpperLeg = {
__RightUpperLeg__
	},
	LeftLowerLeg = {
__LeftLowerLeg__
	},
	RightLowerLeg = {
__RightLowerLeg__
	},
	-- ankles cancel thigh + shin pitch and the stance roll so the soles stay flat on the floor
	LeftFoot = {
__LeftFoot__
	},
	RightFoot = {
__RightFoot__
	},
}

