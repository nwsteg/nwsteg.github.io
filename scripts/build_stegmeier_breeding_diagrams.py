#!/usr/bin/env python3
"""Build responsive breeding explainers and matching downloadable SVG figures."""
from html import escape
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'assets/2026-10-15-william-stegmeier'
URL = '/assets/2026-10-15-william-stegmeier/sources/'
MILLET = URL + 'research/02_Pearl_Millet_Research/'
SOURCE = {n: MILLET + f'1998_Pearl_Millet_Parental_Lines_{n}A_{n}B_EXCERPT.pdf#page=1' for n in ('842', '843')}
STEPS = [
    ('Choose parents', 'Start with useful traits', 'Breeders choose plants with characteristics they want to combine, such as earlier flowering, larger seed, or shorter stature.'),
    ('Make a cross', 'Bring the parents together', 'Pollen from one chosen parent fertilizes flowers on the other. The resulting seeds carry genetic material from both parents.'),
    ('Grow offspring', 'Look for new combinations', 'The seeds grow into a new generation. Breeders look for plants that bring useful traits together.'),
    ('Select and test', 'Keep the promising plants', 'Promising selections are grown and evaluated again. Yield, maturity, disease response, and standing strength all matter in the field.'),
]
FAMILIES = [
    dict(number='842', stock='2221', hybrid='HHB 68', year='1993', color='#977028'),
    dict(number='843', stock='2068', hybrid='HHB 67', year='1990', color='#4d6950'),
]


def plant(x, y, scale=1, color='#ae914c'):
    return f'''<g transform="translate({x} {y}) scale({scale})"><path d="M0 0V-69M0-18Q-13-37-31-35Q-14-30 0-18M0-37Q16-54 29-51Q13-48 0-37" fill="#738862" stroke="#566e49" stroke-width="1.5" stroke-linejoin="round"/><rect x="-5" y="-91" width="10" height="29" rx="5" fill="{color}"/><path d="M-2-86H2M-2-80H2M-2-74H2M-2-68H2" stroke="#f2e8c6" stroke-width="1.4"/></g>'''


def art(index):
    if index == 0:
        return plant(52, 107, 1) + plant(111, 107, .79, '#82936a')
    if index == 1:
        return plant(43, 107, .9, '#82936a') + plant(121, 107, .9, '#82936a') + '<path d="M55 28Q80 2 106 27M98 24L106 27L103 19" fill="none" stroke="#977028" stroke-width="2" stroke-linecap="round"/><circle cx="72" cy="15" r="2.5" fill="#c0a866"/><circle cx="86" cy="15" r="2" fill="#c0a866"/>'
    if index == 2:
        return ''.join(plant(x, 107, scale, '#82936a') for x, scale in [(25,.55),(52,.75),(80,1),(108,.66),(137,.85)])
    return plant(35, 107, .75, '#82936a') + plant(82, 107, .88) + plant(132, 107, 1, '#82936a') + '<ellipse cx="82" cy="61" rx="24" ry="49" fill="none" stroke="#977028" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M75 18L80 23L90 12" fill="none" stroke="#977028" stroke-width="2.5" stroke-linecap="round"/>'


def icon(index):
    return f'<svg class="breeding-icon" viewBox="0 0 160 118" aria-hidden="true" focusable="false">{art(index)}</svg>'


def svg_start(title, desc, width, height):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title description">
<title id="title">{escape(title)}</title><desc id="description">{escape(desc)}</desc>
<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#7c8d6e"/></marker></defs>
<style>text{{fill:#293f35;font-family:Arial,sans-serif}}.title{{font:30px Georgia,serif}}.name{{font:22px Georgia,serif}}.small{{font-size:13px;fill:#64725b}}.label{{font-size:11px;letter-spacing:1.4px;fill:#4d6950}}</style>
<rect width="100%" height="100%" fill="#f8f6ee"/>
'''


def svg_text(x, y, text, cls='', anchor='start'):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(text)}</text>'


def cycle_svg():
    out = svg_start('How a breeder builds a better starting point', 'Choose parents, make a cross, grow offspring, select and test. Selection and testing continue across generations. Simplified overview.', 960, 410)
    out += svg_text(32, 45, 'How a breeder builds a better starting point', 'title')
    for i, (name, short, _) in enumerate(STEPS):
        x = 32 + i * 231
        out += f'<rect x="{x}" y="76" width="202" height="229" rx="4" fill="#fffdf8" stroke="#d9dfce"/>'
        out += svg_text(x + 15, 100, f'0{i+1}', 'label')
        out += f'<g transform="translate({x+21} 105)">{art(i)}</g>'
        out += svg_text(x + 101, 254, name, 'name', 'middle')
        out += svg_text(x + 101, 281, short, 'small', 'middle')
        if i < 3:
            out += f'<path d="M{x+208} 185H{x+224}" stroke="#7c8d6e" stroke-width="1.5" marker-end="url(#arrow)"/>'
    out += '<path d="M890 320V342H70V320" fill="none" stroke="#7c8d6e" stroke-width="1.5" marker-end="url(#arrow)"/>'
    out += svg_text(480, 371, 'Repeat selection and testing across generations', 'small', 'middle')
    out += f'<a href="https://nwsteg.github.io{URL}research/02_Pearl_Millet_Research/1984_Pearl_Millet_Potential_Crop_Kansas_SRL77.pdf">' + svg_text(480, 395, 'Illustrative overview · Based on the 1984 millet bulletin and 1998 parental-line papers', 'small', 'middle') + '</a></svg>\n'
    return out


def family_svg():
    out = svg_start('From Hays breeding stocks to Indian hybrids', 'Two separate paths: Hays AKM/BKM 2221 stocks to ICRISAT 842A and 842B, with 842A used as seed parent of HHB 68, released in 1993. Hays AKM/BKM 2068 stocks to ICRISAT 843A and 843B, with 843A used as seed parent of HHB 67, released in 1990. Each hybrid also has a separate pollen parent.', 960, 590)
    out += svg_text(32, 44, 'From Hays breeding stocks to Indian hybrids', 'title')
    out += svg_text(32, 73, 'D. J. Andrews introduced both sets of Hays stocks to ICRISAT in 1980.', 'small')
    for x, title in [(32, 'HAYS, KANSAS'), (356, 'ICRISAT, INDIA'), (680, 'HARYANA, INDIA')]:
        out += svg_text(x, 115, title, 'label')
    for index, f in enumerate(FAMILIES):
        y, n = 137 + index * 172, f['number']
        for x in [32, 356, 680]:
            out += f'<rect x="{x}" y="{y}" width="248" height="143" rx="4" fill="#fffdf8" stroke="#d9dfce"/><path d="M{x} {y+1}H{x+248}" stroke="{f["color"]}" stroke-width="3"/>'
        out += svg_text(50, y+35, 'Bill’s breeding stocks', 'name')
        out += svg_text(50, y+66, f'AKM {f["stock"]} / BKM {f["stock"]}', 'small')
        out += svg_text(50, y+102, 'Developed at the Fort Hays station', 'small')
        out += svg_text(374, y+35, f'{n}A / {n}B', 'name')
        out += svg_text(374, y+66, 'Further selection for', 'small')
        out += svg_text(374, y+86, 'downy mildew resistance', 'small')
        out += svg_text(374, y+118, f'{n}A: seed parent · {n}B: maintainer', 'small')
        out += svg_text(698, y+35, f['hybrid'], 'name')
        out += svg_text(698, y+66, f'{n}A × a separate pollen parent', 'small')
        out += svg_text(698, y+102, f'Released in India in {f["year"]}', 'small')
        for x in [288, 612]:
            out += f'<path d="M{x} {y+70}H{x+58}" stroke="#7c8d6e" stroke-width="1.5" marker-end="url(#arrow)"/>'
    out += svg_text(32, 503, 'Reading the letters', 'name')
    out += svg_text(32, 532, 'A lines produce no functional pollen. B lines maintain the matching A line for future seed production.', 'small')
    out += svg_text(32, 555, 'The hybrids were developed at CCS Haryana Agricultural University using A lines as seed parents.', 'small')
    out += '<a href="https://nwsteg.github.io' + SOURCE['842'] + '">' + svg_text(32, 578, 'Source: 842A/B paper, ISMN 39 (1998), p. 128', 'small') + '</a>'
    out += '<a href="https://nwsteg.github.io' + SOURCE['843'] + '">' + svg_text(390, 578, 'Source: 843A/B paper, pp. 129–130', 'small') + '</a></svg>\n'
    return out


def cycle_html():
    cards = ''.join(f'''<li><details><summary><span class="breeding-step-number">0{i+1}</span>{icon(i)}<span class="breeding-step-name">{name}</span><span class="breeding-step-short">{short}</span><span class="breeding-more">Explore step <span aria-hidden="true">+</span></span></summary><p>{text}</p></details></li>''' for i, (name, short, text) in enumerate(STEPS))
    return f'''<figure class="research-figure explain-figure" id="breeding-cycle" aria-labelledby="breeding-cycle-title">
<div class="figure-heading"><p class="figure-kicker">03 / Across generations</p><h3 id="breeding-cycle-title">How a breeder builds a better starting point</h3><p>Small choices, repeated over many growing seasons. Open a step to see what happens.</p></div>
<ol class="breeding-steps">{cards}</ol>
<p class="breeding-repeat"><span aria-hidden="true">↶</span> Repeat selection and testing across generations</p>
<figcaption>A simplified overview of crossing, selection, and field evaluation. Drawings illustrate pearl millet plants and variation; they represent stages of the work rather than named lines. Sources: <a href="#source-3">1984 millet bulletin</a> and <a href="#source-4">1998 parental-line papers</a>. <a href="{URL}figures/breeding-cycle.svg" download>Download diagram (SVG)</a>.</figcaption>
</figure>'''


def family_html():
    rows = []
    for f in FAMILIES:
        n = f['number']
        rows.append(f'''<div class="millet-lineage lineage-{n}" aria-label="{n} breeding path">
<details class="lineage-node"><summary><span class="lineage-stage">Hays, Kansas</span><span class="lineage-name">Bill’s breeding stocks</span><span class="lineage-description">The {f['stock']} pair</span><span class="breeding-more">Original names <span aria-hidden="true">+</span></span></summary><p>At the Fort Hays station, Bill developed <strong>AKM {f['stock']}</strong> and <strong>BKM {f['stock']}</strong>. D. J. Andrews introduced them to ICRISAT in 1980.</p></details>
<span class="lineage-arrow" aria-hidden="true">→</span>
<details class="lineage-node"><summary><span class="lineage-stage">ICRISAT, India</span><span class="lineage-name">{n}A <span class="lineage-slash">/</span> {n}B</span><span class="lineage-description">Further selection for<br>downy mildew resistance</span><span class="breeding-more">How the pair works <span aria-hidden="true">+</span></span></summary><p><strong>{n}A</strong> is the male-sterile seed-parent line. <strong>{n}B</strong> is its maintainer. ICRISAT distributed these reselected lines under the {n} names from 1984.</p></details>
<span class="lineage-arrow" aria-hidden="true">→</span>
<details class="lineage-node lineage-hybrid"><summary><span class="lineage-stage">Haryana, India</span><span class="lineage-name">{f['hybrid']}</span><span class="lineage-description">{n}A × a separate pollen parent<br>Released in {f['year']}</span><span class="breeding-more">From parent to hybrid <span aria-hidden="true">+</span></span></summary><p>CCS Haryana Agricultural University developed {f['hybrid']} using {n}A as its seed parent. The other parent supplies pollen. <a href="{SOURCE[n]}">Read the {n}A/B paper ↗</a></p></details>
</div>''')
    return f'''<figure class="research-figure explain-figure" id="millet-family-tree" aria-labelledby="millet-family-title">
<div class="figure-heading"><p class="figure-kicker">04 / A family tree for the plants</p><h3 id="millet-family-title">From Hays stocks to Indian hybrids</h3><p>Two paths through an international collaboration. Open any box for the names and the work behind it.</p></div>
<div class="lineage-transfer"><span>1980</span><p>D. J. Andrews brings both sets of Hays stocks to ICRISAT, India.</p></div>
{''.join(rows)}
<div class="lineage-key"><h4>Reading the letters</h4><p><strong>A · Seed parent</strong> produces no functional pollen.<br><strong>B · Maintainer</strong> helps reproduce the matching A line.<br><strong>Hybrid seed</strong> comes from the A line crossed with a separate pollen parent.</p></div>
<figcaption>Arrows trace the development and use of these lines. The hybrids were developed at CCS Haryana Agricultural University; each includes a separate pollen parent. Sources: <a href="{SOURCE['842']}">842A/B, p. 128</a> and <a href="{SOURCE['843']}">843A/B, pp. 129–130</a>, <i>ISMN</i> 39 (1998). <a href="{URL}figures/millet-family-tree.svg" download>Download diagram (SVG)</a>.</figcaption>
</figure>'''


def insert_figure(text, ident, markup, before):
    begin, end = f'<!-- {ident}:start -->', f'<!-- {ident}:end -->'
    replacement = begin + '\n' + markup + '\n' + end
    if begin in text:
        a, b = text.index(begin), text.index(end) + len(end)
        return text[:a] + replacement + text[b:]
    position = text.index(before)
    return text[:position] + replacement + '\n\n' + text[position:]


def main():
    for name, svg in [('breeding-cycle', cycle_svg()), ('millet-family-tree', family_svg())]:
        (ASSET / 'sources/figures' / f'{name}.svg').write_text(svg)
    path = ROOT / '2026/10/15/william-d-stegmeier.html'
    text = insert_figure(path.read_text(), 'breeding-cycle', cycle_html(), '          <p>The field reports show that progress happening.')
    text = insert_figure(text, 'millet-family-tree', family_html(), '          <p>Kansas State’s history of the Hays station reported that, by 1997,')
    path.write_text(text)
    path = ASSET / 'sources/source-metadata.json'
    data = json.loads(path.read_text())
    for name, title, notes in [
        ('breeding-cycle', 'How a breeder builds a better starting point', 'Original vector diagram of a simplified breeding cycle. Based on the archived 1984 millet bulletin and 1998 parental-line descriptions. Plant drawings are illustrative.'),
        ('millet-family-tree', 'From Hays breeding stocks to Indian hybrids', 'Selected development history from the archived 842A/B and 843A/B papers, ISMN 39 (1998), pp. 128–130. Hays AKM/BKM 2221 to 842A/B to HHB 68 (1993); AKM/BKM 2068 to 843A/B to HHB 67 (1990). Each hybrid has a separate pollen parent; B lines maintain A lines.'),
    ]:
        data[f'figures/{name}.svg'] = dict(title=title, kind='Original explanatory SVG figure', source_url=f'https://nwsteg.github.io/2026/10/15/william-d-stegmeier.html#{name}', notes=notes, preserved_date='2026-10-16')
    path.write_text(json.dumps(data, indent=2) + '\n')
    print('Built two responsive diagrams, downloadable SVGs, and source metadata.')


if __name__ == '__main__':
    main()
