set -e
P="C:/Users/osaya/OneDrive/Documents/nenxiety26/anim_reader"
node work/mkupper.js "$(cat work/upper_hand.json)" "$(cat work/upper_body.json)" >/dev/null
echo "bake: $(node ikbake.js work/upper.tpl work/upper_ik.json work/upper_tracks.lua | grep -o 'WARN.*' || echo 'all frames reachable')"
node gen_anim.js work/upper_tracks.lua work/upper.json work/upper.server.lua >/dev/null
node script2data.js work/upper.server.lua "$P/Animations/Boxing_Uppercut_Orthodox.lua" >/dev/null
node bundle.js "$P/AnimReader.lua" "$P/Animations/Boxing_Uppercut_Orthodox.lua" work/bundle_upper.lua >/dev/null
node mkcheck.js work/bundle_upper.lua >/dev/null
./rbxrun.sh check.lua work/upper_dump.txt
grep -v "per frame\|^dump" work/upper_dump.txt | head -20
node mkrender.js work/bundle_upper.lua 0,22,25,27,33,45 >/dev/null
./rbxrun.sh posedump_run.lua work/upper_pose.json >/dev/null
node balance.js work/upper_pose.json | grep -o "^f[0-9]*\|rear foot ≈ [0-9]*%" | paste - - 
node render.js work/upper_pose.json work/upper_v3.png | head -1
