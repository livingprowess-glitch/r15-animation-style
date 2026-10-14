---
name: r15-animation-style
description: Author new R15 KeyframeSequence animations in the user's house style (the animation_rigs corpus) and verify them statistically. Use when asked to make, synthesize, restyle or tune a Roblox R15 animation, analyze AnimSaves, or compare an animation against the corpus style.
---

# R15 animation house style

The style comes from the user's own rigs in `workspace.animation_rigs` (44 unique sequences, analyzed 2026-10-09). The best-rated output so far is `reference/kiai_burst.server.lua`: the user liked its overall motion but saw limb issues. `reference/muay_thai_combo.server.lua` read as "rough and raw", so don't treat it as a quality bar.

## Delivery format: AnimReader data modules (since 2026-10-14)
The user doesn't want a new Script for every animation. Deliver each animation as a data ModuleScript in `ReplicatedStorage.AnimReader.Animations`.
- **Source of truth:** `C:\Users\osaya\OneDrive\Documents\nenxiety26\anim_reader\` (`AnimReader.lua`, `Animations/*.lua`, `AnimPreview.server.lua`).
- **Data shape:** `{ name, fps, lastFrame, loop, priority, assetId?, markers = {[frame]=name}, tracks = { Part = { {frame, rx, ry, rz, ease, px?, py?, pz?} } } }`.
- **API:** `AnimReader.build / animation / load / play(rig, nameOrData, fade) / save(rig, …)`. Studio uses `RegisterKeyframeSequence`; live games need `assetId`.
- **Pipeline:** tracks → `gen_anim.js` (script) → `script2data.js` (data module) → `bundle.js AnimReader.lua data.lua out.lua`, then run `mkcheck.js` / `mkverify.js` on the bundle.
- **Preview:** `ServerScriptService.AnimPreview` plays the module named in its `Animation` attribute on the rig named in `Rig`.
- **Code style:** the reader follows the Luau preferences (`const`, no comments). Data modules carry no comments.

## Workflow
1. **Check the place.** Run `rbx.ps1 -Op status` first (see the rbxbridge memory). Guard every write with a place check.
2. **Author key poses, not frames.** Copy `reference/kiai_burst.server.lua`, keep everything outside `TRACKS`, and write new `TRACKS`. Key format: `{ frame, rx, ry, rz, easeName, px?, py?, pz? }` in degrees and studs, in joint space. The easing named on a key shapes the segment *leaving* that key.
3. **Bake.** The builder samples the keys at 60 Hz into Linear/In poses for every joint on every frame, which is the corpus format.
4. **Verify.** From `tools/`:
   ```
   node mkverify.js <script.lua>
   powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\osaya\rbxbridge\rbx.ps1 -Op run -File verify.lua > gen.json
   node cmp.js
   ```
   `mkverify.js` compiles the whole script in Studio, runs only the builder (everything above `-- PLAYBACK`), and exports the result. `cmp.js` measures it with the same analyzer used on the corpus.
5. **Limb check.** Run `node mkcheck.js <script.lua>`, then run `check.lua` through rbx.ps1. It builds an unparented R15 rig from a default HumanoidDescription (nothing is written to the place) and computes every frame's limb positions from the RigAttachments. It reports:
   - limbs inside the torso or head, overlapping limbs, legs into the chest;
   - feet below the floor, planted feet sliding, hyperextended joints;
   - per frame: hand gap, the **ground offset** (how far to raise the root), and each foot's XZ position.

   Severity is calibrated on the user's own 44 animations: **WARN** above their 90th percentile, **ERROR** past their worst case. Fix every ERROR. Explain any WARN that's left.
6. **Grounded moves: lock the feet.**
   - Write the root keys with `__Y<frame>__` placeholders for height.
   - Put `__LeftUpperLeg__` and `__RightUpperLeg__` placeholders in the hip blocks (`node templatelegs.js <tpl>` does this).
   - Describe the intended *world* thigh angles in a stance JSON.
   - `node footlock.js <tpl> <stance.json> <out.lua> <lastFrame>` computes the hip keys exactly (inverse of the root rotation × the intended rotation).
   - Run once with the placeholders set to 0, read the ground offsets at the root key frames, write them in as root height, and rerun.

   **Preferred over footlock: `ikbake.js`.**
   - Put placeholders on the arm and leg blocks: `node templatelegs.js <tpl> LeftUpperArm RightUpperArm LeftLowerArm RightLowerArm LeftUpperLeg RightUpperLeg LeftLowerLeg RightLowerLeg LeftFoot RightFoot`.
   - Write an IK spec: hand-centre targets in UpperTorso space, ankle-pivot targets in HumanoidRootPart space, a pole for each (the direction the elbow or knee points), and a foot yaw.
   - Run `node ikbake.js <tpl> <ik.json> <out.lua>`. It solves the shoulder, elbow, hip, knee and ankle (flat foot) for every frame, using the rig geometry in `geometry.json`.
   - Root keys stay hand-authored (the pelvis drives the look); the legs follow it with the feet locked.

   `gen_anim.js <tracks> <config.json> <out>` wraps the tracks in the Kiai template. See `work/kame.json` and `work/kame_*` for a full example.
7. **Iterate** until there are no limb ERRORs and the style metrics pass, then report both tables honestly, including any metric that still misses.
8. **Re-analyze the corpus** after the user adds rigs: run `tools/export.lua` through rbx.ps1 into `corpus.json`, then `node report.js`.

## Style fingerprint (corpus means)
- Baked at 60 Hz, all poses Linear/In, every joint keyed on every frame. Easing exists only in the curve shape.
- Fitted easing by movement: ease-out 37.7%, ease-in-out 39.2%, overshoot 9.0%, ease-in 7.8%, linear 6.4%.
- Joint involvement, highest first: RShoulder, LShoulder, RHip, LHip, Neck, Waist, RAnkle, LAnkle, Root (96%), RElbow, LElbow (86%), LKnee, RKnee (61–65%). Wrists never move (0%).
- Elbows and knees bend on the X axis only. Elbow +X bends; knee -X bends.
- Speed: the fastest joint peaks at ~4436 °/s (about 73° per frame); the average joint peaks at ~1945 °/s. The peak arrives ~2.3 frames after the move starts.
- Strikes: ~5.5 frames of anticipation, settle within ~7 frames, then a rebound of about 28°. Hit reactions pop to peak on frame 1 with no anticipation.
- Child joints lag their parents by 0 frames. There is no overlapping action; secondary motion comes from rebound, not delay.
- Root moves ~1.1 studs, with a crouch/spring of ~1.3 studs vertically.
- Left/right symmetry correlation 0.35, weight shifts ~2.9 per second.
- One-shot animations end ~103° (max joint) away from their start pose. True loops close to 0°.
- Exaggeration past normal human range: waist up to 217%, ankles 170%, neck 147%, shoulders and hips 110–127%. Elbows stay inside normal range.

## Axis conventions (verified on these rigs)
- Shoulder/hip **+X** raises the limb forward.
- **-Z** abducts the LEFT limb; **+Z** abducts the RIGHT limb.
- Root/Waist/Neck **-X** leans forward or looks down.
- Root **-Y** turns the left side forward (bladed orthodox stance; the user's Idle has Root Y -40.9).
- `CFrame.Angles(x, y, z)` order, which matches `ToEulerAnglesXYZ`.
- User's guard poses to start from: `Combat_Animations.Idle_Animation` and `Blocking_Animation` (frame 0 of each is in `tools/corpus.json`).

## Known failure modes (fix these before reporting)
- **Euler lerp across large multi-axis spans.** The builder interpolates each Euler channel separately. A swing like shoulder Z 33 → -166 with X and Y changing at the same time follows a curved, gimbal-ish path, so the limb can sweep through the torso or twist mid-swing. Split big swings with an intermediate key, or keep any single segment under ~120° on combined axes.
- **No collision or limb sanity check.** Nothing stops a hand from entering the torso or head, or a foot from going below the floor. Watch arms crossing the chest and legs under the body.
- **Pose-matching video by eye is unreliable.** For reference footage, prefer the user blocking key poses in the Animation Editor, then doing timing, easing and stylization on those keys.
- **Don't trace other creators' animations** (watermarked clips). Match the beat structure with original poses instead.

## Corrections log
Append each user correction here as a rule: what was wrong, which joint, and the fix. Read it before authoring. Rules here override the fingerprint.

- (2026-10-14) The user reported limb issues on Kiai Burst; details not yet given. The limb checker found **both upper arms passing through the head at f33–41**: the head was thrown back 48° straight into the path of the overhead arm fling. Feet also sank 0.26–0.39 studs and slid about 4 studs in total. Rule: never throw the head back into the path an arm is sweeping. Tuck the head or turn it away instead.
- (2026-10-14) **Twist the chest, not the pelvis, when the feet are planted.** Kamehameha v1 put a -42° coil in the root, which swung the feet and slid the back foot 1.5 studs in 3 frames. Keep root yaw within about ±8° in grounded moves, let the waist carry the coil, and use footlock for the hips.
- (2026-10-14) **Root height comes from the ground offset, not from guessing.** A deep-looking bent stance only lowered the hips about 0.29 studs on this rig, so the hand-guessed 0.65-stud drop buried the feet.
- (2026-10-14, user review of Kamehameha v1) **"Left arm bent toward my right during the animation."** The limb dump showed the left hand at the LEFT shoulder (torso-space x -1.21, y +1.23): the upper arm lay horizontally across the chest with the forearm pointing up, instead of the hands cupping at the right hip. The Euler keys were combined by intuition (shoulder X 70, Y 25, Z 50). Rule: **never hand-author shoulder or hip Euler angles for a reach pose.** Author hand and ankle positions in `ikbake.js` and let it solve the rotations.
- (2026-10-14, same review) **"Limbs kick out unnaturally at the end."** In the recovery, interpolating the Euler angles swung the hands outward in a wide arc (x ±0.56 → ±2.03), and the feet slid inward about 0.4 studs with no lift. Rules:
  - Recovery paths are hand positions that come down in front of the body.
  - Feet either stay planted or take a real step with a lift (raise the ankle ~0.33 mid-step).
  - Never let both feet be airborne in a grounded move. Start the second foot's step after the first lands.
- (2026-10-14) **Reach limits on this rig:** shoulder pivots sit at torso (±0.972, 0.598, 0) and the arm reaches 1.786 from the pivot to the hand centre. The left hand can't reach the right hip, so cross-body poses go in front of the chest (z ≤ -1.1) and lean on the waist coil.
  - Hand targets nearer than z -1.0 put the forearms in the chest. Fully stretched arms (target ≥ 1.78 from the shoulder) clamp.
  - Ankle pivot rest height is y -2.929 in HumanoidRootPart space.
- (2026-10-14) Keeping the hands on a straight path costs speed: the shoulders turn less for the same hand travel. Use a 2-frame release plus a 2-frame pull-back to get back to about 3.4k °/s.
- (2026-10-14, user review of Kamehameha v2) The arm and end fixes passed. The Kamehameha's legs weren't exaggerated enough in position, which the user put down to having no photo reference. **This note applies to that move only. Do NOT generalize it.** For named moves from media, ask for a reference image before guessing.
- (2026-10-14, user review of boxing idle v2) **"Incredibly stiff, poor, nothing like the style."** v2 copied the near-static `Idle_Animation` (lower body frozen, 4.9 °/s). That misread "follow the skill specifications". The specs mean the **fingerprint**:
  - every joint moving (~100% participation);
  - exaggerated poses;
  - weight shifts and asymmetry (symmetry ~0.35);
  - no flicks or jab pumps in an idle, and a moderate stance (not wide or deep).

  v3 was built from the user's pose references:
  - a high guard with the gloves flanking the face at cheek/eye level (torso space: L ≈ (-0.74, 1.52, -1.14), R ≈ (0.62, 1.48, -1.06));
  - elbows down and slightly out, a forward lean of about 22° total (root -8 + waist -16), and the neck at about +6 so the eyes glare forward instead of at the floor;
  - pelvis yaw -24 with the chest squared to -15;
  - feet about 1.1 studs apart side to side and 1.05 front to back, rear heel up (pitch -20 to -26);
  - a hip drop of 0.2–0.3 (bob), a forward/back weight rock of ±0.1, and the gloves bobbing out of phase.
- (2026-10-14, user review of boxing idle v3) **Remove bobs; idle movement stays subtle; the gloves were a little too high.** v4:
  - root height constant (no bob), a 101-frame loop (1.67 s) with one slow cycle;
  - weight rock ±0.04, waist and head move about 1°, gloves move about 0.03 studs, out of phase;
  - fastest joint about 13 °/s;
  - gloves lowered about 0.16 to chin/cheek level: torso space L (-0.74, 1.36, -1.14), R (0.62, 1.32, -1.06).
- (2026-10-14, user review of boxing idle v4) **"Too hard on the front foot, like balancing on one leg."** `balance.js` showed the centre of mass at z -0.72, past the lead foot (-0.54), with only about 24% on the rear foot. The causes were a ~23° forward lean plus hips over the lead foot. Rules:
  - Run `node balance.js <posedump.json>` on every grounded pose.
  - Stances sit at 45–55% on the rear foot unless the move is deliberately committed.
  - To get there: move the hips back between the feet (+0.45 z here), keep the lean modest (root -3, waist -10), lower the rear heel (pitch about -12), and bend the rear knee more than the lead (-68 vs -44 here).
- (2026-10-14, user review of boxing idle v5, in-game screenshots) **Straighten the back a little.** The hunch read as sitting. v6:
  - torso lean cut from about 13° to about 5° (root -1, waist -4), neck -7 so the eyes stay forward;
  - hips rebalanced back +0.36, giving 48–52% on the rear foot.

  Guard idles want a near-upright back. Get the protective look from the chin tuck and glove height, not from the spine.
- (2026-10-14) User asked for the rear (right) foot further back. The rear ankle moved from z 0.5 to 0.75, and the hips were rebalanced back to +0.50 to hold 48–52% on the rear foot. Whenever a foot moves, re-run balance.js and re-place the hips.
- (2026-10-14) **The user adds glove models, so the bare-hand guard must sit lower than a real guard** to keep the face visible. Hands lowered 0.22 to chin/jaw level: torso space L (-0.74, 1.14, -1.14), R (0.62, 1.10, -1.06). Balance unchanged at 48–52%.
- (2026-10-14) **The lead foot was turned in.** The left foot had yaw -12, which turns the toes right, i.e. inward for the LEFT foot. The yaw-sign rule above was already logged and I still got it wrong. Rule: after every foot change, measure the actual toe yaw from the posedump (atan2 of the foot forward vector).
  - Left foot: + is outward, - is inward. Right foot: - is outward, + is inward.
  - Boxing lead foot is now +3 (slightly out), with the knee pole straight forward; the rear foot is -35 (out).
- (2026-10-14) **"Something about the back leg looks odd from that angle."** `legcheck.js` found two things:
  - The rear knee was folded to 107–111° while the lead was 141–150°. The hips had moved back for balance but still dropped 0.25, which left the rear leg in a kneeling Z shape with the knee jutting forward under the body.
  - The rear knee pointed 16° inward of its toes.

  Fixes: aim each knee pole along its foot yaw (rear pole (0.57, 0, -0.82) for yaw -35), drop the hips less (-0.18) so the rear knee is about 115–119° and the lead stays soft at 147–165° (never 180, locked), and rebalance with hips +0.47.

  Rule: run `node legcheck.js <posedump.json>` on every grounded pose. Knee direction must match toe yaw within about 5°, and the two knee angles shouldn't differ by more than about 35° in a neutral stance. (Its toe-yaw readout is flipped 180°; compare against the yaw you authored.)
- (2026-10-14) The user's test place is now **"animation workshop", PlaceId 103523105713230** (Place2, published). Guard every write by that PlaceId, not by name.
- (2026-10-14) **Strikes that chain from an idle.** `Boxing_Jab_Orthodox` (35 frames, Action priority, marker `Hit` at f9).
  - Frame 0 and the last frame must equal the idle's frame 0 exactly. Verify the max channel difference is 0.000 against the idle's verify export.
  - v1 timing was too soft (2.9k °/s, 3-frame wind-up). The user's strikes run 3.2–5.6k °/s, a 6–19 frame wind-up, settle within 1–4 frames, and last 0.5–0.67 s. The jab now uses a 7-frame load, a 2-frame snap to full reach, a 2-frame rebound, a retract by f18 and a settle by f25.
  - The chest turns the lead shoulder in (root yaw -34, waist -2 at impact), and the neck counter-turns (+34) so the eyes stay on the target.
  - Feet stay planted. Weight commits to about 41% rear at impact, then returns.
- (2026-10-14) **Attacks ship slow.** The user's game speeds attacks up at runtime (`AdjustSpeed`), so author strikes at base speed.
  - The jab was retimed uniformly to 61 frames (1.0 s, `Hit` at f16), with every key frame scaled ×1.765. `AdjustSpeed(1.765)` reproduces the 0.57 s version exactly.
  - Peak speed at base speed is about 2.4k °/s. Judge strike snap at the intended in-game speed, not at base.
- (2026-10-14) **`Boxing_Cross_Orthodox`** (71 frames, base speed, `Hit` at f17), chained from the idle's frame 0.
  - **Hips and chest:** root yaw -24 → +12 and waist +14 at impact; the neck counter-turns to about -24.
  - **Rear foot pivot:** pivots on the ball of the foot (yaw -35 → -5, pitch -12 → -30). Compute the ankle path with the ball held fixed: ball = ankle + 0.42·cos(pitch)·toeDir. The limb checker then reports about 0.45 studs of "slide" on that foot. That's the ankle orbiting the planted ball, not a slide.
  - **Lead leg:** sink the hips at impact (y -0.29), otherwise the hip turn locks the lead knee at 180°.
  - **Speed:** a cross must peak above the jab at the same game speed. A 6-frame snap gave 3.25k (less than the jab's 3.6k); a 4-frame snap gives 4.47k at ×1.765.
- (2026-10-14, user review of cross v1) **"Not enough exaggeration, really swift. I want a middle ground leaning toward swift and exaggerated, but less swift than now."** Strike grammar for v2 (`work/mkcross.js`):
  - **Wind-up:** about 15 frames. The hips coil past the idle (root yaw -36), the striking glove draws back and drops slightly, and the lead glove reaches forward a touch.
  - **Snap:** 5 frames at base speed (about 2.8 at game speed), not 4.
  - **Turn and lean:** a bigger turn (hips 58°, chest 76° total, against 41° and 49° before) and a shoulder dive (combined lean -19°).
  - **Follow-through:** the body keeps turning about 4° past impact before recoil.
  - **Rear foot:** a deeper pivot (yaw 0, pitch -34).
  - **Weight:** commits to about 22% on the rear foot.

  Peak speed rose to 4.75k at game speed because of the bigger arcs, while the snap got longer. "Less swift" means more time and bigger poses, not lower angular speed. Keep a raised guard glove at least about 1.05 forward of the chest so the head's counter-turn doesn't run into it.
- (2026-10-14, user review of cross v2) **"The extension on the cross seems a little off."** At impact the fist landed 1.02 below the head and 0.87 to its right, with the forearm aimed 16° down: a rib shot off to the side. The torso-space hand target had been authored before the extra lean and hip sink carried it down and out.
  - Rule: **aim strike extensions in world space.** Dump the impact frames, then `node aim.js <posedump.json> <Left|Right> <reach> <dx> <dy> <dz>`. It returns the UpperTorso-space target that puts the fist on a line from the shoulder to the aim point (head + offset).
  - The cross uses reach 1.76 and aim offset (-0.9, -0.15, -3.5). That lands the fist on the head line at chin height (0.54 below head centre) with the forearm level.
  - Re-run aim.js whenever the body keys change.
  - The jab was re-aimed the same way: reach 1.76 at impact (f16) and 1.70 at the rebound (f19), aim offset (+0.9, -0.15, -3.5). It now lands 0.03 from the head line at chin height (0.50 below head centre), with the forearm level.
  - The lead hand needs a positive dx and the rear hand a negative dx, because each shoulder sits off the centre line on its own side.
- (2026-10-14) **Jab v3 has the cross's exaggeration grammar** (`work/mkjab.js`, 69 frames, `Hit` at f20).
  - **Wind-up:** 15 frames. The lead shoulder draws back (root yaw -18, waist +12) and the lead glove drops.
  - **Snap and turn:** a 5-frame snap. Chest turn 46° (×1.55 the old jab), a shoulder dive (lean -18°), hip sink -0.26 with the hips driving forward to 0.28.
  - **Follow-through:** about 3° past impact.
  - **Rear heel:** lifts to -20 with the ball fixed.
  - **Result:** weight about 41% rear (less committed than the cross's 22%), lead knee about 121°, aimed with `aim.js` (dx +0.9). Peak at game speed 4.1k stays under the cross's 4.5k.
  - Build order for any strike: body keys → mk*.js with placeholder hands → dump the impact frames → `aim.js` → rebuild with the aimed hands.
- (2026-10-14, user review) **"The reset back into the idle isn't smooth" (jab and cross).** The body speed profile showed the recovery as three separate moves: it stopped at the "back" key, re-accelerated to about 530 °/s, stopped again at "settle", then drifted.
  - Cause: every key with in/out easing forces zero velocity at that key.
  - Rule: a recovery is **one body curve** from the follow-through key straight to the last frame (inOutSine), with no intermediate body keys. The arms ease back to guard (inOutCubic) by about f36–38 and hold there.
  - Check: profile `analyze(...).body` across the recovery. After the 1-frame follow-through pause there must be no dip that rises again.
- (2026-10-14) **Hand-off to a looping base.** The attack's last frame equals the idle's frame 0, but the idle underneath is usually mid-cycle. Players (AnimGallery, AnimPreview) now start the attack on `base.DidLoop` with fade 0 and set `base.TimePosition = 0` when the attack stops. The user's in-game attack system needs the same sync (or its own fade) for a seamless reset.
- (2026-10-14, user review) **"After the hit, the attacking arm twists back."** Not intended. The elbow pole switched from guard (elbow down) to impact (elbow out, a fake fist turn-over), so the IK rolled the whole upper arm about 60–70° on the way out and back on the return. The wrists are static on these rigs, so arm roll can't be hidden in the forearm.
  - Rule: **keep the elbow pole consistent through a strike.** Elbow down with only a slight outward drift ((∓0.6, -1, 0.1) at impact against (∓0.5, -1, 0.1) in guard).
  - Check with `node armroll.js <posedump.json> <Left|Right>`. Some reading remains from the arm swinging against world up; a real twist shows as a 50°+ swing that reverses.
  - Removing the roll lowered the game-speed peaks (jab 3.2k, cross 3.6k), because the roll had added angular speed without adding visible power.
- (2026-10-14, user review) **"Still snapping right after the hit frame."** The per-frame profile found two causes:
  1. The body (root, waist, head) moved at constant speed into the hit key, then nearly stopped in one frame (head 13 → 1.7 °/frame). The load key was "linear" and the hit key was a hard stop.
  2. The punching arm decelerated into the hit key, then jumped back up for the follow-through (a stop-start at impact).

  Rules for strikes:
  - **No hit key on the body or the punching arm.** Each runs one segment from the load key to the follow-through key with `inOutCubic`, so speed rises, peaks around the old hit frame, and bleeds off.
  - **Punch the fist in a straight world line.** `ikbake.js` arm keys accept `"world": true` (HumanoidRootPart-space position). Any segment touching a world key interpolates in world space, using a per-frame chest pose (`chestAt`, verified against Studio to 0.0000).
  - `outCubic` on that segment over-reaches mid-path (the chest hasn't turned yet), so use `inOutCubic`.
  - Get the world target from `aim.js` (its `world` output) at the follow-through frame, reach 1.76.
  - Put the `Hit` marker where the fist is about 0.1 from the target (f22 here), not at the speed peak.
  - Check: degrees per frame for the arm, root and head across the hit must be single-peaked.

  Result: jab and cross peak at f20 and arrive at f24. The game-speed peaks dropped (jab 2.3k, cross 3.1k) because the snap is now smooth instead of a spike.
- (2026-10-14, user review) **"The cross attacks without flaring the elbow; stiff and strict."** Locking the elbow pole to guard (the twist fix) over-corrected. A rear-hand punch wants the elbow to come **out and up** mid-extension.
  - The fix is pole timing independent of the hand keys: `ik.poles.Right` = guard (0.5, -1, 0.1) → load (0.6, -1, 0.1) → **flare (1, -0.35, 0.1) one frame before the old hit frame** → full reach (0.85, -0.6, 0.1) → back to guard by the guard key, all inOutSine.
  - Result: the elbow goes out 0.45 and rises from 0.54 below the shoulder to 0.53 above it. Roll builds smoothly into the flare, eases off only 5–6°/frame at impact, and unwinds gently over the recovery (no snap-back).
  - The twist the user hated was a big roll reversing **fast** right after the hit. A flare that settles slowly is wanted.
  - **Follow-up (user):** "The elbow flare should be in the wind-up, not mixed into the hit frame." The flare now peaks at the load key. Poles: guard (0.5, -1, 0.1) at f0 → **flare (1, -0.35, 0.1) at the load key** → punch line (0.75, -0.75, 0.1) at the follow-through → guard by the guard key, all inOutSine.
  - The elbow swings out 0.39 during the wind-up. Roll builds at up to 6°/frame across f1–15 and stays within ±4°/frame through the extension and hit.
  - Rule: **flares, chambers and other telegraphing belong in the wind-up. Keep the extension clean.**
- (2026-10-14, user) **"The snap-back on the cross and jab seems off compared to before. Revert, but keep the cross's wind-up elbow flare."** Both strikes were restored to commit 203872f:
  - hit key at f20 (`Hit` at f20);
  - torso-space hands aimed with aim.js;
  - outQuad into the hit, inOutCubic recoil.

  Reverted out: the fa37bd6 single-curve body drive, the world-space straight-line fist path and Hit at f22. The cross keeps `poles.Right` (guard → flare at load → punch line (0.6, -1, 0.1) at the hit → guard).

  Follow-up (user): **"The bring-back on the attack is what's throwing me off."**
  - Measured: after the hit the fist hung frozen for about 7 frames (f21–27, ≤0.04 studs/frame), then drifted back at a 0.16–0.19 peak (about a third of extension speed) over about 10 frames.
  - Fix, punching arm only: hit (f20) → hold key at **hit+2** (outCubic from there) → **guard at hit+10**. The cross's pole keys moved to the same frames. The body recovery is unchanged.
  - Result: a 2-frame hold, then a 0.30 studs/frame snap-back decelerating into guard by about f28, with gradual elbow unwinding. Game-speed peaks are jab 3.5k, cross 4.6k.
  - Rule: **a punch returns nearly as fast as it lands.** Hold at most about 2 frames at full extension, and retract to guard within about 8 frames with outCubic.

  Follow-up (user): **"Improve the extension on the jab and cross; poor, lacking range."**
  - Measured: both arms were already at full length (1.76 of 1.79) at impact, so range has to come from the body. Fist travel from guard was jab 1.28 and cross about 1.75.
  - **Jab:** a lead-foot step of 0.35 forward (lift ≥0.18 so it reads as a step, not a shuffle), landing at hit-1, held through the punch, stepping back over hit+12 to hit+20. Hips drive forward to z 0.03–0.05.
  - **Cross:** more hip turn (+26/+29 against +18/+22), more chest turn (+22/+24), neck counter -46/-52, hips forward to z 0.10, sink -0.33. The lean stays at the original root -7 / waist -10.
  - Result: jab travel 1.55, cross 2.04, both re-aimed onto the chin line with aim.js.
  - Balance: a deeper lean (-9/-13) pushed the cross to 11% on the rear foot, nearly tipping, so it was rolled back. **Range comes from rotation and steps, not lean.** The cross sits at 15–16% rear (committed); the jab at 38%.

  Lesson: the user preferred the **crisper hit-key stop and recoil** over the fully smooth bell-shaped drive. "Snap" complaints were about the arm twist, not about the hit being a hard stop. Don't smooth away the impact accent in future strikes. Cross game-speed peak with the flare is 2.5k (jab 3.2k); offer to sharpen if it reads soft.
- (2026-10-14) **`Boxing_LeadHook_Orthodox`** (`work/mkhook.js`, 71 frames, `Hit` at f20, ends f70).
  - **Rotation direction:** a lead hook turns the body **clockwise from above (root yaw more negative)**, the opposite of the cross. The wind-up opens the chest first (root -14, waist +10). Impact: root -42, waist -4 (chest about -46), neck +44 to hold the eyes.
  - Turning the wrong way pulls the lead shoulder away (shoulder-to-fist 1.9, too straight). Over-rotating to chest -60 jams it (0.5–0.8, cramped).
  - **Arm:** the bent arm is a rigid frame carried by the body. Target 1.6 ahead of the head on the centre line at chin height, which gives shoulder-to-fist 1.38 (about 90° elbow). Check candidate targets for 1.25–1.5 before baking.
  - **Elbow:** chambered out and up in the wind-up (pole (-1, -0.05, 0.15)), level with the fist at impact (pole (-1, 0, 0.1)). It drops back to guard over hit+2 → hit+14 with inOutSine. outCubic over 8 frames gave a 16–19°/frame twist.
  - **Lead foot:** pivots on the ball (yaw 3 → -38, pitch -24). The checker reports about 0.63 "slide", which is the pivot.
  - **Weight:** loads onto the lead side (39% rear), then transfers to 60% rear at impact.
  - **Speed:** the joint angular peak (1.5k at game speed) is low because the arm is carried, but the fist's linear speed (about 0.55 studs/frame) matches the cross. Judge hooks by fist speed.
  - **v2 (user): "More elbow flare in the wind-up, a longer wind-up, and farther reach."** K = load 22, hit 27, over 31, end 77 (`Hit` at f27).
    - **Wind-up:** load pole (-0.8, 0.45, 0.25), so the elbow ends 0.32 **above** the shoulder and swings well out. The chamber glove sits at local (-1.421, 1.367, -0.801), cheek height, out and back. The wind-up also opens the chest more (root -10, waist +13).
    - **Reach:** the impact target is 1.85 ahead of the head (was 1.6), giving shoulder-to-fist 1.58 (a wider hook). The fist peaks at 0.74 studs/frame (was 0.55).
    - Balance (40% → 60% rear) and the smooth elbow drop are unchanged.
- (2026-10-14) **`AnimPreview` attributes:** `Base` (looping underlay, e.g. the idle), `Animation` (one-shot repeated every `Interval` seconds, or a loop), `Rig`.
- (2026-10-14) **Always render before reporting.**
  - `node mkrender.js <script or bundle> 0,15,30,45`, then `rbxrun.sh posedump_run.lua out.json`, then `node render.js out.json out.png`. That gives front, left-side and three-quarter views per frame.
  - Read the PNG, compare it against the user's references, and iterate on what's visible. Metrics alone passed v2.
  - Ask for pose references whenever a move is described only by name.
- (2026-10-14) The bridge sometimes reaches a playtest DataModel ("loadstring() is not available"). Use `tools/rbxrun.sh <lua> <out>`, which retries until the edit session answers.
- (2026-10-14) The `weightShiftsPerSec` metric compares |hip rotation| magnitudes, so a bladed stance with hip yaw counter-rotation always reads 0 even when the root rocks. Check the weight shift in the side render instead.
- (superseded by the v2 review above) **Idles follow the user's own idle exactly, not a "boxing realism" take.** Boxing idle v1 failed: it was wide and deep, bounced, and had a lead-hand flick, which the user called "flinching". The user's idle grammar (`Idle_Animation`, `Blocking_Animation`):
  - 101 frames (1.67 s), loop, a single slow cycle with extremes at f0 and f50 (inOutSine).
  - The lower body is completely static: pelvis bladed -31° to -41°, hips counter-yawed about +30° to +42° so the legs face forward, hip X about ±10–14, knees -0.1 (straight), ankles flattening the hip pitch, root position 0 (no hip drop).
  - The waist and head move under 1°. Only the arms breathe a few degrees.
  - No flicks, bounces, pumps or weight rocking.
- (2026-10-14) **Foot yaw sign:** in ikbake, yaw follows Ry. Negative yaw turns the toes to the character's RIGHT, positive to the LEFT. A turned-out rear right foot is therefore NEGATIVE yaw. The Kamehameha v2 right foot used +20, which turns it in.
