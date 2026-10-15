#!/usr/bin/env python3
"""Rebuild the downloadable inventory and ZIP from the preserved source files."""

import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "assets/2026-10-15-william-stegmeier/sources"
ARCHIVE = "william-stegmeier-sources.zip"
GENERATED = {ARCHIVE, "source-inventory.csv", "source-inventory.json", "SHA256SUMS.txt"}


def main():
    metadata = json.loads((SOURCES / "source-metadata.json").read_text())
    rows = []
    for path in sorted(SOURCES.rglob("*")):
        if not path.is_file() or path.name in GENERATED:
            continue
        relative = path.relative_to(SOURCES).as_posix()
        data = path.read_bytes()
        entry = metadata.get(relative, {})
        rows.append({
            "path": relative,
            "title": entry.get("title", path.stem.replace("_", " ")),
            "kind": entry.get("kind", "Research archive documentation"),
            "original_url": entry.get("original_url", ""),
            "source_url": entry.get("source_url", ""),
            "pages_or_context": entry.get("pages_or_context", ""),
            "notes": entry.get("notes", ""),
            "preserved_date": "2026-10-15",
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        })
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    (SOURCES / "source-inventory.csv").write_text(output.getvalue())
    (SOURCES / "source-inventory.json").write_text(json.dumps(rows, indent=2) + "\n")
    paths = sorted(p for p in SOURCES.rglob("*") if p.is_file() and p.name not in {ARCHIVE, "SHA256SUMS.txt"})
    checksums = [f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(SOURCES).as_posix()}" for p in paths]
    (SOURCES / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n")
    paths.append(SOURCES / "SHA256SUMS.txt")
    with zipfile.ZipFile(SOURCES / ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in paths:
            bundle.write(path, "William_D_Stegmeier_Sources/" + path.relative_to(SOURCES).as_posix())
    with zipfile.ZipFile(SOURCES / ARCHIVE) as bundle:
        assert bundle.testzip() is None, "Archive integrity check failed"
    archive_size = (SOURCES / ARCHIVE).stat().st_size
    assert archive_size < 100 * 1024 * 1024, "Archive exceeds GitHub's per-file limit"
    print(f"Preserved {len(rows)} files; ZIP {archive_size / 1024 / 1024:.1f} MiB; integrity check passed.")


if __name__ == "__main__":
    main()
