const TRACKS: { [string]: { Key } } = {
	LowerTorso = {
		-- neutral hold: root rotation at rest for 3 frames
		{ 0, 0, 0, 0, "inOutCubic", 0, 0, 0 },
		{ 3, 0, 0, 0, "outQuad", 0, 0, 0 },
		-- sink into the wide stance; the pelvis only turns a little so the feet stay planted
		{ 16, -4, -4, 0, "outQuad", 0, -0.22, 0 },
		{ 24, -8, -5, 0, "linear", 0, -0.29, 0 },
		-- ANTICIPATION: coil and tension tremble
		{ 44, -10, -6, 0, "linear", 0, -0.29, 0 },
		{ 47, -9, -5.5, 1, "linear", 0, -0.29, 0 },
		{ 50, -11, -6.5, -1, "linear", 0, -0.29, 0 },
		{ 53, -9, -5.5, 1, "linear", 0, -0.29, 0 },
		{ 56, -11, -6.5, -1, "linear", 0, -0.29, 0 },
		{ 60, -12, -7, 0, "outQuad", 0, -0.28, 0 },
		-- ACTION: pelvis drives forward and up into the thrust...
		{ 63, 2, 3, 0, "outQuad", 0, -0.27, 0 },
		-- FOLLOW-THROUGH: ...then sits back into the beam's recoil
		{ 68, -2, 2, 0, "linear", 0, -0.27, 0 },
		{ 96, -4, 1.5, 0, "inQuad", 0, -0.29, 0 },
		{ 108, -2, 0, 0, "inOutSine", 0, -0.04, 0 },
		{ LAST_FRAME, 0, 0, 0, "linear", 0, 0, 0 },
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
		{ 0, 22, -10, -30, "inOutCubic" },
		-- hands meet in front of the chest
		{ 16, 60, 20, 30, "outQuad" },
		-- left arm reaches across the front of the body to the right hip
		{ 24, 70, 25, 50, "linear" },
		{ 44, 72, 25, 52, "linear" },
		{ 50, 70, 24, 50, "linear" },
		{ 56, 73, 26, 53, "linear" },
		{ 60, 72, 25, 52, "outQuad" },
		-- thrust: palms drive straight out, overshooting a touch before the beam locks
		{ 63, 94, 0, 26, "outQuad" },
		{ 68, 88, 0, 30, "linear" },
		{ 96, 86, 2, 30, "inOutSine" },
		{ 108, 40, -5, -15, "inOutSine" },
		{ LAST_FRAME, 22, -10, -30, "linear" },
	},
	RightUpperArm = {
		{ 0, 24, 8, 28, "inOutCubic" },
		{ 16, 55, -20, -25, "outQuad" },
		-- right arm draws back so both hands cup at the right hip
		{ 24, -15, 10, 15, "linear" },
		{ 44, -20, 10, 15, "linear" },
		{ 50, -18, 9, 14, "linear" },
		{ 56, -21, 11, 16, "linear" },
		{ 60, -20, 10, 15, "outQuad" },
		{ 63, 94, 0, -26, "outQuad" },
		{ 68, 88, 0, -30, "linear" },
		{ 96, 86, -2, -30, "inOutSine" },
		{ 108, 40, 5, 15, "inOutSine" },
		{ LAST_FRAME, 24, 8, 28, "linear" },
	},
	LeftLowerArm = {
		{ 0, 40, 0, 0, "inOutCubic" },
		{ 16, 90, 0, 0, "outQuad" },
		{ 24, 100, 0, 0, "linear" },
		{ 60, 100, 0, 0, "outQuad" },
		-- locked straight through the beam
		{ 63, 0, 0, 0, "linear" },
		{ 68, 4, 0, 0, "linear" },
		{ 96, 6, 0, 0, "inOutSine" },
		{ 108, 70, 0, 0, "inOutSine" },
		{ LAST_FRAME, 40, 0, 0, "linear" },
	},
	RightLowerArm = {
		{ 0, 42, 0, 0, "inOutCubic" },
		{ 16, 90, 0, 0, "outQuad" },
		{ 24, 110, 0, 0, "linear" },
		{ 60, 112, 0, 0, "outQuad" },
		{ 63, 0, 0, 0, "linear" },
		{ 68, 4, 0, 0, "linear" },
		{ 96, 6, 0, 0, "inOutSine" },
		{ 108, 70, 0, 0, "inOutSine" },
		{ LAST_FRAME, 42, 0, 0, "linear" },
	},
	-- hips = intended world leg angle minus the pelvis rotation, so the feet stay put while the pelvis moves
	LeftUpperLeg = {
__LeftUpperLeg__
	},
	RightUpperLeg = {
__RightUpperLeg__
	},
	LeftLowerLeg = {
		{ 0, 0, 0, 0, "inOutCubic" },
		{ 3, 0, 0, 0, "outQuad" },
		{ 16, -50, 0, 0, "outQuad" },
		{ 24, -64, 0, 0, "linear" },
		{ 60, -64, 0, 0, "outQuad" },
		-- weight shifts onto the front leg on the release
		{ 63, -68, 0, 0, "linear" },
		{ 68, -68, 0, 0, "linear" },
		{ 96, -64, 0, 0, "inOutSine" },
		{ 108, -20, 0, 0, "inOutSine" },
		{ 116, 0, 0, 0, "linear" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	RightLowerLeg = {
		{ 0, 0, 0, 0, "inOutCubic" },
		{ 3, 0, 0, 0, "outQuad" },
		{ 16, -45, 0, 0, "outQuad" },
		{ 24, -60, 0, 0, "linear" },
		{ 60, -60, 0, 0, "outQuad" },
		{ 63, -56, 0, 0, "linear" },
		{ 68, -56, 0, 0, "linear" },
		{ 96, -60, 0, 0, "inOutSine" },
		{ 108, -20, 0, 0, "inOutSine" },
		{ 116, 0, 0, 0, "linear" },
		{ LAST_FRAME, 0, 0, 0, "linear" },
	},
	-- ankles cancel thigh + shin pitch and the stance roll so the soles stay flat on the floor
	LeftFoot = {
		{ 0, -14, 0, 7, "inOutCubic" },
		{ 3, -14, 0, 7, "outQuad" },
		{ 16, 20, 0, 23, "outQuad" },
		{ 24, 28, 0, 25, "linear" },
		{ 60, 28, 0, 25, "outQuad" },
		{ 63, 32, 0, 25, "linear" },
		{ 68, 32, 0, 25, "linear" },
		{ 96, 28, 0, 25, "inOutSine" },
		{ 108, 0, 0, 12, "inOutSine" },
		{ LAST_FRAME, -14, 0, 7, "linear" },
	},
	RightFoot = {
		{ 0, -8, 0, -5, "inOutCubic" },
		{ 3, -8, 0, -5, "outQuad" },
		{ 16, 21, 0, -23, "outQuad" },
		{ 24, 30, 0, -25, "linear" },
		{ 60, 30, 0, -25, "outQuad" },
		{ 63, 26, 0, -25, "linear" },
		{ 68, 26, 0, -25, "linear" },
		{ 96, 30, 0, -25, "inOutSine" },
		{ 108, 6, 0, -11, "inOutSine" },
		{ LAST_FRAME, -8, 0, -5, "linear" },
	},
}

