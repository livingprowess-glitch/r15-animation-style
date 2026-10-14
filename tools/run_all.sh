#!/bin/sh
T="C:/Users/osaya/.claude/skills/r15-animation-style/tools"
RBX="powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/osaya/rbxbridge/rbx.ps1"
cd "$T" || exit 1
node gen_anim.js "$1" "$2" "$3" || exit 1
node mkcheck.js "$3" > /dev/null
echo "--- limb check"
$RBX -Op run -File "$T/check.lua" -TimeoutSec 90 | grep -v "hand gap"
$RBX -Op run -File "$T/check.lua" -TimeoutSec 90 | grep "hand gap" | cut -c1-20 > /dev/null
node mkverify.js "$3" > /dev/null
$RBX -Op run -File "$T/verify.lua" -TimeoutSec 90 > gen.json
echo "--- style"
node cmp.js | grep -E "FAIL|max single|mean per-joint|easing total"
