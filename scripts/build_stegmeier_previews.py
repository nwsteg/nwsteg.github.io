#!/usr/bin/env python3
"""Render labeled source excerpts for the interactive figures; leave originals intact."""

import json
from pathlib import Path
import subprocess
import tempfile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/2026-10-15-william-stegmeier"
SOURCES = ASSETS / "sources"
OUTPUT = SOURCES / "previews"
RESEARCH = "research/"
MEMORIAL = RESEARCH + "01_Biography_Memorials_and_Photographs/1998_In_Memoriam_Bill_Stegmeier_C_Tom_Hash_EXCERPT.pdf"

JOBS = [
    ("green-bay", MEMORIAL, 1, (0.065, 0.661, 0.519, 0.695)),
    ("yuma", MEMORIAL, 1, (0.065, 0.691, 0.519, 0.726)),
    ("fort-collins", MEMORIAL, 1, (0.065, 0.724, 0.519, 0.790)),
    ("remembering-bill", MEMORIAL, 1, (0.065, 0.194, 0.340, 0.275)),
    ("minneapolis", "records/1968-north-dakota-veterans-register-s.pdf", 145, (0.408, 0.097, 0.649, 0.130)),
    ("brookings", RESEARCH + "1969-usda-winter-wheat-personnel-notice.pdf", 3, (0.200, 0.648, 0.846, 0.706)),
    ("garden-city", RESEARCH + "01_Biography_Memorials_and_Photographs/2001_Hays_History_Stegmeier_Biography_EXCERPT.pdf", 1, (0.490, 0.775, 0.850, 0.884)),
    ("hybrid-parents", RESEARCH + "02_Pearl_Millet_Research/1998_Pearl_Millet_Parental_Lines_843A_843B_EXCERPT.pdf", 1, (0.055, 0.055, 0.960, 0.935)),
]


def main():
    OUTPUT.mkdir(exist_ok=True)
    provenance = []
    with tempfile.TemporaryDirectory() as temporary:
        for name, source, page, bounds in JOBS:
            prefix = Path(temporary) / name
            subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", "300", "-png", "-singlefile", str(SOURCES / source), str(prefix)], check=True, capture_output=True)
            with Image.open(prefix.with_suffix(".png")) as image:
                box = tuple(round(v * (image.width if i % 2 == 0 else image.height)) for i, v in enumerate(bounds))
                excerpt = image.crop(box)
                excerpt.thumbnail((1600, 1800), Image.Resampling.LANCZOS)
                excerpt.save(OUTPUT / (name + ".png"), optimize=True)
            provenance.append({"preview": name + ".png", "source": source, "pdf_page": page, "normalized_crop": bounds})
    for name, source, box in [
        ("elgin", "records/1940_Elgin_ED19-7_sheet5A.jpg", (1150, 2850, 3150, 3290)),
        ("camp-pendleton", "records/1953-01-26_Marine_unit_diary_23247621.jpg", (195, 220, 2970, 1110)),
    ]:
        with Image.open(SOURCES / source) as image:
            excerpt = image.crop(box)
            excerpt.thumbnail((1600, 1000), Image.Resampling.LANCZOS)
            excerpt.save(OUTPUT / (name + ".png"), optimize=True)
        provenance.append({"preview": name + ".png", "source": source, "pixel_crop": box})
    (OUTPUT / "preview-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(f"Rendered {len(provenance)} source excerpts without changing their originals.")


if __name__ == "__main__":
    main()
