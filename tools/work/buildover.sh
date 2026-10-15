set -e
V=$1; N=$2; shift 2
P="C:/Users/osaya/OneDrive/Documents/nenxiety26/anim_reader"
node work/mkover.js "$V" "$N"
BAKE=$(node ikbake.js work/$N.tpl work/${N}_ik.json work/${N}_tracks.lua); echo "bake: $(echo "$BAKE" | grep -o "WARN.\{0,120\}" || echo "all frames reachable")"
node gen_anim.js work/${N}_tracks.lua work/$N.json work/$N.server.lua >/dev/null
node script2data.js work/$N.server.lua "$P/Animations/$N.lua" >/dev/null
node lint.js "$N" --onion "$@" | grep -vE "^ok " || true
