#!/usr/bin/env python3
"""Rebuild the exact repaired GLBs and run the real Three.js runtime validator."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports"
VENV = ROOT / ".venv"


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def venv_python() -> Path:
    if os.name == "nt":
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def verify_hashes() -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    sums = ROOT / "EXPECTED_SHA256SUMS.txt"
    for raw_line in sums.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        expected, relative = line.split(maxsplit=1)
        relative = relative.lstrip("*")
        target = ROOT / relative
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        passed = digest == expected
        results.append(
            {
                "path": relative,
                "expected_sha256": expected,
                "actual_sha256": digest,
                "passed": passed,
            }
        )
        if not passed:
            raise RuntimeError(
                f"SHA-256 mismatch for {relative}: expected {expected}, got {digest}"
            )
    return results


def main() -> int:
    if sys.version_info < (3, 11):
        raise SystemExit("Python 3.11 or newer is required; Python 3.13 is the pinned reference.")

    REPORTS.mkdir(parents=True, exist_ok=True)
    run([sys.executable, str(ROOT / "scripts" / "materialize_generator.py")])

    python = venv_python()
    if not python.exists():
        print(f"Creating isolated Python environment at {VENV}", flush=True)
        venv.EnvBuilder(with_pip=True, clear=False).create(VENV)

    run(
        [
            str(python),
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "-r",
            str(ROOT / "requirements.txt"),
        ]
    )
    run(
        [
            str(python),
            str(ROOT / "scripts" / "generate_owned_humanoid.py"),
            "--all-lods",
            "--report",
            str(REPORTS / "build.json"),
        ]
    )
    hashes = verify_hashes()

    npm = shutil.which("npm")
    if npm is None:
        raise SystemExit("npm is required but was not found on PATH.")
    run([npm, "install", "--ignore-scripts", "--no-audit", "--no-fund"])
    run([npm, "run", "validate"])

    validator_receipt = json.loads(
        (REPORTS / "threejs-runtime-result.json").read_text(encoding="utf-8")
    )
    if validator_receipt.get("passed") is not True:
        raise SystemExit("Three.js validator returned a non-pass receipt.")

    final = {
        "schema_version": 1,
        "public_source": "Toowiredd/sandbox-templates@open-human-core-v0.4.1",
        "hashes": hashes,
        "threejs_runtime": validator_receipt,
        "passed": all(item["passed"] for item in hashes)
        and validator_receipt.get("passed") is True,
        "boundary": (
            "This proves exact repaired GLB reproduction, GLTFLoader parsing, "
            "AnimationMixer action execution, and SkeletonUtils.clone behavior. "
            "It does not prove Godot import, WebGL rendering, or human visual acceptance."
        ),
    }
    output = REPORTS / "check-now-result.json"
    output.write_text(json.dumps(final, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(final, indent=2))
    return 0 if final["passed"] else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.returncode or 2) from exc
