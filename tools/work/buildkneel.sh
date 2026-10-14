set -e
X=${1:-1}; N=${2:-Boxing_Knockdown_Kneel}; TUNE=${3:-}
P="C:/Users/osaya/OneDrive/Documents/nenxiety26/anim_reader"
node work/mkkneel.js "$X" "$N" $TUNE >/dev/null
BAKE=$(node ikbake.js work/$N.tpl work/${N}_ik.json work/${N}_tracks.lua); echo "bake: $(echo "$BAKE" | grep -o "WARN.*" || echo "all frames reachable")"
node gen_anim.js work/${N}_tracks.lua work/$N.json work/$N.server.lua >/dev/null
node script2data.js work/$N.server.lua "$P/Animations/$N.lua" >/dev/null
node lint.js "$N" --onion || true
node work/lowpoints.js work/lint_$N.json 0 22
