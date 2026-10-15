#!/usr/bin/env python3
"""Build web copies and credits from the preserved place photographs."""

from html import escape
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/2026-10-15-william-stegmeier"
PHOTOS = ASSETS / "sources/places"
URL = "/assets/2026-10-15-william-stegmeier/sources/places/"


def main():
    photos = json.loads((PHOTOS / "photo-provenance.json").read_text())
    data_path = ASSETS / "figures-data.json"
    data = json.loads(data_path.read_text())
    metadata_path = ASSETS / "sources/source-metadata.json"
    metadata = json.loads(metadata_path.read_text())
    (PHOTOS / "views").mkdir(exist_ok=True)
    cards = []
    for photo in photos:
        with Image.open(PHOTOS / photo["original"]) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            if photo.get("crop"):
                image = image.crop(tuple(photo["crop"]))
            image.thumbnail((1280, 960), Image.Resampling.LANCZOS)
            image.save(PHOTOS / photo["view"], quality=88, optimize=True)
            width, height = image.size
        credit = photo.get("credit", photo["author"] + " · " + photo["license"])
        for place in data["places"]:
            if place["record"] == photo["id"]:
                place["photo"] = {
                    "image": URL + photo["view"],
                    "original": URL + photo["original"],
                    "alt": photo["alt"],
                    "title": photo["title"],
                    "year": photo["year"],
                    "caption": photo["caption"],
                    "credit": credit,
                    "license": photo["license"],
                    "licenseUrl": photo["licenseUrl"],
                    "source": URL + "credits.html#" + photo["id"],
                    "width": width,
                    "height": height,
                }
                if photo.get("relatedUrl"):
                    place["photo"]["relatedUrl"] = URL + photo["relatedUrl"]
                    place["photo"]["relatedTitle"] = photo["relatedTitle"]
        for kind in ("original", "view"):
            metadata["places/" + photo[kind]] = {
                "title": photo["title"],
                "kind": "Place photograph" if kind == "original" else "Web-sized place photograph",
                "original_url": photo["sourceUrl"],
                "source_url": photo["downloadUrl"] or photo["sourceUrl"],
                "pages_or_context": photo["date"] + "; " + photo["representation"],
                "notes": credit + ". " + photo["rightsNote"],
            }
        p = {key: escape(str(value), quote=True) for key, value in photo.items()}
        related = f'<p><a href="{p["relatedUrl"]}">{p["relatedTitle"]} →</a></p>' if photo.get("relatedUrl") else ""
        view_note = escape(photo.get("viewNote", "Web copy resized without cropping."))
        cards.append(f'''<section id="{p['id']}">
<h2>{p['title']}</h2><p class="date">Photograph: {p['date']}</p>
<a href="{p['original']}"><img src="{p['view']}" alt="{p['alt']}" width="{width}" height="{height}" loading="lazy"></a>
<p>{p['caption']}</p><p><strong>{escape(credit)}</strong></p>
<p><a href="{p['sourceUrl']}">Source and attribution</a> · <a href="{p['licenseUrl']}">{p['license']}</a> · <a href="{p['original']}" download>Download photograph</a></p>
<p class="rights">{p['rightsNote']} {view_note}</p>{related}</section>''')
    # A second view of the same preserved 1984 composite for the Hays feature.
    office_view = "views/hays-office-1984.jpg"
    with Image.open(PHOTOS / "originals/hays-1984.png") as original:
        original.convert("RGB").crop((8, 158, 220, 287)).save(
            PHOTOS / office_view, quality=88, optimize=True
        )
    metadata["places/" + office_view] = {
        "title": "Hays station office, published 1984",
        "kind": "Cropped station photograph",
        "original_url": "https://extension.k-state.edu/historicpublications/pubs/fthays.pdf",
        "source_url": "https://extension.k-state.edu/historicpublications/pubs/fthays.pdf",
        "pages_or_context": "PDF page 3; lower photograph in composite image 1; exposure date unrecorded",
        "notes": "Kansas State University. Crop (8, 158, 220, 287) from preserved originals/hays-1984.png, saved as JPEG without retouching. Copyright remains with the source publisher.",
    }
    (PHOTOS / "credits.html").write_text('''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Photographs of the places in Bill Stegmeier’s life</title>
<style>body{max-width:820px;margin:40px auto;padding:0 24px;background:#f6f4eb;color:#293f35;font:16px/1.7 system-ui,sans-serif}h1,h2{font-family:Georgia,serif;line-height:1.2}h1{font-size:38px}h2{font-size:27px}a{color:#496749;text-underline-offset:3px}section{padding:26px;margin:30px 0;background:#fffdf8;border:1px solid #d7decd;border-radius:4px;scroll-margin-top:24px}img{display:block;width:100%;height:auto;max-height:480px;object-fit:contain;background:#e9e8de}p{margin:14px 0}.date,.rights{color:#68735f;font-size:13px}@media(max-width:600px){body{padding:0 16px}section{padding:18px}h1{font-size:31px}}</style>
</head><body><p><a href="/2026/10/15/william-d-stegmeier.html#life-map">← Back to Bill’s story and map</a></p>
<h1>Historical views of Bill’s world</h1><p>Street scenes, campuses, a military base, and research stations from around the years in his story. Photograph dates and publication dates are identified separately. The Grant County scene supplies regional childhood context; his exact Colorado State enrollment dates are still unknown.</p>
<p>Local copies and credits are preserved with the downloadable source collection. Each photograph retains its own copyright or license.</p>
<p><a href="earlier-views.html">More views of these places, including Elgin’s streets in 1952 →</a></p>
''' + "\n".join(cards) + "\n</body></html>\n")
    data_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
    print("Built nine place-photo views, map data, source metadata, and the photo credits page.")


if __name__ == "__main__":
    main()
