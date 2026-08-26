# Open Human Core v0.4.1 Audit-Corrected: Public Runtime Verification

This public branch is the cookie-free verification surface for the repaired `human_core_01` procedural engineering fallback.

It contains:

- the exact compressed deterministic v0.4.1 generator payload;
- the pinned Python dependency set used to reproduce the repaired GLBs;
- the posted SHA-256 contract for all three GLBs;
- the real Three.js validator using `GLTFLoader`, `AnimationMixer`, and `SkeletonUtils.clone`;
- a cross-platform one-command verifier.

No ChatGPT session cookie, private attachment URL, paid asset, or Quaternius Source pack is required.

## Clone and verify end to end

```bash
git clone --branch open-human-core-v0.4.1 --single-branch https://github.com/Toowiredd/sandbox-templates.git
cd sandbox-templates/open-human-core-v0.4.1-audit-corrected
python scripts/check_now.py
```

The verifier creates an isolated `.venv`, materializes the audited generator, installs the pinned geometry dependencies, regenerates all three repaired GLBs, verifies every posted SHA-256 value, installs Three.js `0.185.1`, and runs the real runtime validator.

Final machine-readable receipt:

```text
reports/check-now-result.json
```

Generated GLBs:

```text
assets/runtime/humans/human_core_01.glb
assets/runtime/humans/human_core_01_lod1.glb
assets/runtime/humans/human_core_01_lod2.glb
```

## Expected repaired GLB hashes

```text
642e69852db77400d277737afabfc2dbc5952d8c533051be674d5df3535f89ab  assets/runtime/humans/human_core_01.glb
a4b19ebc6b452e4fe99407290f67bf6ba26f4c20984e2fb2f629e6624a51106d  assets/runtime/humans/human_core_01_lod1.glb
89bdc40cb7eec39e1d362aa1b4db88e3e87559ecf6c037633bf61346d6da2d86  assets/runtime/humans/human_core_01_lod2.glb
```

## Manual route

```bash
python scripts/materialize_generator.py
python -m pip install -r requirements.txt
python scripts/generate_owned_humanoid.py --all-lods --report reports/build.json
npm install --ignore-scripts --no-audit --no-fund
npm run validate
```

## Validation boundary

A passing receipt proves exact repaired-GLB reproduction, Three.js `GLTFLoader` parsing, `AnimationMixer` action creation and advancement, and independent `SkeletonUtils.clone` results. It does not prove Godot import, rendered WebGL appearance, human visual acceptance, or production promotion.
