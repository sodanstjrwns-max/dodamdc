"""Build-time Wanted Sans subsets; retain all original cmap coverage and variable weights.
Requires fonttools[woff]. Original and derived fonts remain under OFL-WantedSans.txt.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'public/static/fonts'
SOURCE = DIR / 'WantedSansVariable.woff2'
original = TTFont(SOURCE)
coverage = set(original.getBestCmap())
text = ''.join(p.read_text() for p in (ROOT / 'src').rglob('*') if p.suffix in ('.ts', '.tsx'))
text += ''.join(p.read_text() for p in (ROOT / 'public/static').glob('*') if p.suffix in ('.css', '.js'))
core = coverage & (set(map(ord, text)) | set(range(0x20, 0x100)))
remaining = coverage - core

def ranges(points):
    values = sorted(points)
    out = []
    start = end = values[0]
    for point in values[1:]:
        if point == end + 1:
            end = point
        else:
            out.append(f'U+{start:X}' if start == end else f'U+{start:X}-{end:X}')
            start = end = point
    out.append(f'U+{start:X}' if start == end else f'U+{start:X}-{end:X}')
    return ','.join(out)

rules = ['/* Wanted Sans (OFL). Generated subsets: every original character remains available. */']
seen = set()
for name, points in [('Core', core), ('Extended', remaining)]:
    font = TTFont(SOURCE)
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=points)
    worker.subset(font)
    font.flavor = 'woff2'
    output = DIR / f'WantedSans{name}-v1.woff2'
    font.save(output)
    result = TTFont(output)
    actual = set(result.getBestCmap())
    assert actual == points
    assert 'fvar' in result
    seen |= actual
    rules.append("@font-face{font-family:'Wanted Sans';font-style:normal;font-weight:400 1000;font-display:swap;src:url('/static/fonts/" + output.name + "') format('woff2');unicode-range:" + ranges(points) + '}')
    print(name, len(points), 'characters;', output.stat().st_size, 'bytes')
assert seen == coverage and not core & remaining
(DIR / 'wanted-subsets.css').write_text('\n'.join(rules) + '\n')
print('Original:', SOURCE.stat().st_size, 'bytes; complete character coverage preserved')
