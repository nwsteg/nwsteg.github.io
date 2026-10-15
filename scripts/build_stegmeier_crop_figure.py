#!/usr/bin/env python3
"""Build the crop explorer's readable HTML fallback from its cited figure data."""
from html import escape
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = "/assets/2026-10-15-william-stegmeier/"


def build():
    crops = json.loads((ROOT / ASSETS.lstrip("/") / "figures-data.json").read_text())["crops"]
    tabs, panels = [], []
    for crop in crops:
        name, ident = escape(crop["name"]), crop["id"]
        tabs.append(f'<a class="crop-tab" data-crop="{ident}" id="crop-tab-{ident}" href="#crop-panel-{ident}">{name}</a>')
        markers = "".join(f'<button type="button" style="left:{part["x"]}%;top:{part["y"]}%" data-crop-part="{i}" aria-label="{i + 1}. {escape(part["name"])}" aria-controls="crop-parts-{ident}" aria-pressed="false">{i + 1}</button>' for i, part in enumerate(crop["parts"]))
        metrics = "".join(f'<div><dt>{escape(m["label"])}</dt><dd><a href="{escape(m["source"])}">{escape(m["value"])}</a></dd></div>' for m in crop["metrics"])
        refs = "".join(f'<a href="{escape(r["url"])}">{escape(r["label"])} ↗</a>' for r in crop["references"])
        panels.append(f'''<section class="crop-panel" data-crop-panel="{ident}" id="crop-panel-{ident}" aria-labelledby="crop-name-{ident}">
<div class="crop-exploration">
<div class="crop-botany"><div class="crop-anatomy"><img src="{ASSETS}{ident}.svg" width="200" height="320" loading="lazy" alt="{name}: characteristic leaves, stem and flowering or grain head. Illustrative growth stage and scale."><div class="crop-part-markers" data-enhanced-only hidden>{markers}</div></div>
<details class="crop-plant-notes" data-enhanced-only hidden><summary>Explore plant parts</summary><div class="crop-part-copy" id="crop-parts-{ident}" aria-live="polite"><h5 class="crop-part-title"></h5><p class="crop-part-text"></p></div></details>
<a class="crop-botanical-source" href="{escape(crop['botany'])}">Botanical reference ↗</a></div>
<div class="crop-exploration-copy"><p class="crop-role">{escape(crop['role'])}</p><h4 id="crop-name-{ident}">{name} <i>{escape(crop['latin'])}</i></h4>
<p class="crop-work">{escape(crop['work'])}</p><dl class="crop-metrics">{metrics}</dl>
<h5>Why the work mattered</h5><p class="crop-impact">{escape(crop['impact'])}</p>
<details class="crop-notes"><summary>Context &amp; original reports</summary><p class="crop-context">{escape(crop['context'])}</p><div class="crop-reading">{refs}</div></details></div></div>
</section>''')
    markup = '''<figure aria-labelledby="crops-title" class="research-figure crops-figure clear-section" id="crop-figure">
<div class="figure-heading"><p class="figure-kicker">03 / In the research plots</p><h3 id="crops-title">A breeder’s field of work</h3><p>Select a crop to explore Bill’s work and its reach.</p></div>
<nav class="crop-tabs" aria-label="Choose a crop">''' + "".join(tabs) + '</nav>\n' + "\n".join(panels) + '''
<details class="other-crops"><summary>Other trials &amp; exploratory work</summary><ul><li>Wheat</li><li>Corn</li><li>Castor beans</li><li>Soybeans</li><li>Pinto beans</li><li>Safflower</li><li>Winter barley</li><li>Popcorn</li><li>Amaranth</li></ul></details>
<figcaption>Each statistic links to its preserved report. Acreage, experimental results and research scale measure different kinds of contribution. Illustrations show characteristic plant parts; sizes and growth stages are illustrative. <a href="#source-11">Botanical references</a> · <a href="#source-2">Station history</a> · <a href="#source-4">Millet parents</a> · <a href="#source-6">Sunflower and canola trials</a> · <a href="#source-7">Virus study</a>.</figcaption>
</figure>'''
    path = ROOT / '2026/10/15/william-d-stegmeier.html'
    text = path.read_text()
    start = text.index('<figure aria-labelledby="crops-title"')
    end = text.index('</figure>', start) + len('</figure>')
    path.write_text(text[:start] + markup + text[end:])


if __name__ == '__main__':
    build()
