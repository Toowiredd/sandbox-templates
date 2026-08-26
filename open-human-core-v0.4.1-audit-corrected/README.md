# Open Human Core v0.4.1 Audit-Corrected: Public Runtime Verification

This branch is the cookie-free public verification surface for the repaired `human_core_01` procedural engineering fallback.

The source commit contains the exact compressed deterministic generator payload and the real Three.js validator. GitHub Actions materializes the generator, regenerates the three GLBs byte-for-byte, verifies the posted SHA-256 hashes, installs Three.js `0.185.1`, and executes:

- `GLTFLoader`
- `AnimationMixer`
- `SkeletonUtils.clone`

After a successful run, the workflow commits the generated GLBs and normalized receipt to this public branch and publishes cookie-free release assets.

## Clone and run

```bash
git clone --branch open-human-core-v0.4.1 --single-branch https://github.com/Toowiredd/sandbox-templates.git
cd sandbox-templates/open-human-core-v0.4.1-audit-corrected
python scripts/materialize_generator.py
python -m pip install -r requirements.txt
python scripts/generate_owned_humanoid.py --all-lods --report reports/build.json
sha256sum -c EXPECTED_SHA256SUMS.txt
npm install --ignore-scripts --no-audit --no-fund
npm run validate
cat reports/threejs-runtime-result.json
```

## Expected repaired GLB hashes

```text
642e69852db77400d277737afabfc2dbc5952d8c533051be674d5df3535f89ab  human_core_01.glb
a4b19ebc6b452e4fe99407290f67bf6ba26f4c20984e2fb2f629e6624a51106d  human_core_01_lod1.glb
89bdc40cb7eec39e1d362aa1b4db88e3e87559ecf6c037633bf61346d6da2d86  human_core_01_lod2.glb
```

## Status boundary

A Three.js pass proves loader parsing, animation action creation/advancement, and skeleton-aware cloning. It does not prove Godot import, rendered visual quality, WebGL presentation, or production promotion.
