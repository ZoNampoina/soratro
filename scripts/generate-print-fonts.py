"""Rebuild local print-font subsets and their exact layout metrics (fontTools required)."""
from pathlib import Path
import json
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/usr/share/fonts/truetype/dejavu')
OUT = ROOT / 'src/assets/print'
OUT.mkdir(parents=True, exist_ok=True)
CHARS = set(range(32, 700)) | set(range(0x2000, 0x2070)) | {9833, 9834, 9835}
metrics = {}
for family, name in [('sans','DejaVuSans'),('serif','DejaVuSerif'),('mono','DejaVuSansMono')]:
    for bold in (False, True):
        for italic in (False, True):
            style = ('bold' if bold else 'regular') + ('-italic' if italic else '')
            font = TTFont(SOURCE / (name + ('-Bold' if bold else '') + '.ttf'))
            subset = Subsetter(options=Options())
            subset.populate(unicodes=CHARS)
            subset.subset(font)
            if italic:
                glyphs = font.getGlyphSet()
                for glyph_name in font.getGlyphOrder():
                    record = DecomposingRecordingPen(glyphs)
                    glyphs[glyph_name].draw(record)
                    pen = TTGlyphPen(None)
                    record.replay(TransformPen(pen, (1, 0, .18, 1, 0, 0)))
                    font['glyf'][glyph_name] = pen.glyph()
                font['head'].macStyle |= 2
                font['OS/2'].fsSelection |= 1
                font['post'].italicAngle = -10.2
            units = font['head'].unitsPerEm
            metrics[family + ':' + style] = {str(code): round(font['hmtx'].metrics[glyph][0]/units, 6) for code, glyph in font.getBestCmap().items() if code in CHARS}
            font.save(OUT / (family + '-' + style + '.ttf'))
(ROOT / 'src/score/decoration-font-metrics.ts').write_text('// Generated from the bundled DejaVu print fonts. See docs/FONT-LICENSE.txt.\nexport const DECORATION_WIDTHS:Record<string,Record<string,number>>=' + json.dumps(metrics,separators=(',',':')) + ';\n')
